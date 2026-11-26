# Extra evaluation for Chapter 5: baselines, precision@50, SD across datasets, manipulation tests.
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from scipy.stats import spearmanr

SEEDS = [1, 7, 13, 42, 99, 123, 777, 2024]
FEATS = ["rating", "completion", "low_complaints", "verification"]
K = 50

def scale(col):
    return (col - col.min()) / (col.max() - col.min())

def make_data(seed, rn=0.15, cn=0.10, qn=0.10, n=10000):
    # same generator as sensitivity_noise.py, but this version keeps the review count
    rng = np.random.default_rng(seed)
    r = rng.beta(a=5, b=2, size=n)
    def noisy(rel, noise):
        return np.clip(rel + rng.normal(0, noise, size=len(rel)), 0, 1)
    rating = np.round(3.0 + noisy(r, rn) * 2.0, 1)
    completion = np.round(noisy(r, cn), 2)
    complaint = np.round(noisy(1 - r, qn) * 0.3, 3)
    jobs = np.floor(rng.exponential(scale=20, size=n) * (0.5 + r)).astype(int)
    frac = rng.uniform(0.4, 0.7, size=n)
    reviews = np.floor(jobs * frac).astype(int)
    tiers = []
    for rel, j in zip(r, jobs):
        if j < 5:
            tiers.append(0.0)
        elif rel > 0.7 and j >= 20 and rng.random() < 0.8:
            tiers.append(1.0)
        elif rel > 0.5 and rng.random() < 0.7:
            tiers.append(0.5)
        else:
            tiers.append(0.0)
    return pd.DataFrame({
        "rating": scale(pd.Series(rating)),
        "completion": scale(pd.Series(completion)),
        "low_complaints": 1 - scale(pd.Series(complaint)),
        "verification": tiers,
        "reviews": reviews,
        "truth": r,
    })

def precision_at_k(score, truth, k=K):
    top_pred = set(np.argsort(-np.asarray(score), kind="stable")[:k])
    top_true = set(np.argsort(-np.asarray(truth), kind="stable")[:k])
    return len(top_pred & top_true) / k

def position(sorted_scores, new, orig, N):
    """share of the other providers that rank above `new` (ties count half). 0 = best."""
    right = np.searchsorted(sorted_scores, new, side="right")
    left = np.searchsorted(sorted_scores, new, side="left")
    greater = N - right
    equal = (right - left) - (new == orig).astype(int)   # remove the provider itself
    return 100.0 * (greater + 0.5 * equal) / (N - 1)

def build_scorers(train, w_ridge, intercept):
    C = train["rating"].mean()
    m = float(np.median(train["reviews"]))
    def star(d):  return d["rating"].to_numpy()
    def bayes(d): return ((d["reviews"] * d["rating"] + m * C) / (d["reviews"] + m)).to_numpy()
    def equal(d): return d[FEATS].mean(axis=1).to_numpy()
    def ridge(d): return d[FEATS].to_numpy() @ w_ridge + intercept
    return {"star average": star, "Bayesian average": bayes, "equal weights": equal, "Ridge model": ridge}, m

def one_seed(seed):
    df = make_data(seed)
    X, y = df[FEATS + ["reviews"]], df["truth"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=seed)
    model = Ridge(alpha=1.0).fit(Xtr[FEATS], ytr)
    scorers, m = build_scorers(Xtr, model.coef_, model.intercept_)
    res = {}
    for name, f in scorers.items():
        s = f(Xte)
        res[name] = (spearmanr(s, yte).correlation, precision_at_k(s, yte.to_numpy()))
    return res, (Xte, yte, scorers, m)

# ---------- 1. metrics across the 8 datasets ----------
print("=== Metrics on the 2,000-provider test set, 8 datasets ===")
store = {}
rows = {n: {"sp": [], "p50": []} for n in ["star average", "Bayesian average", "equal weights", "Ridge model"]}
for s in SEEDS:
    res, pack = one_seed(s)
    store[s] = pack
    for n, (sp, p) in res.items():
        rows[n]["sp"].append(sp); rows[n]["p50"].append(p)
print(f"Random ranking would score precision@{K} = {K}/2000 = {K/2000:.3f}")
print(f"Bayesian prior weight m (median review count of training set), per seed: "
      f"{[store[s][3] for s in SEEDS]}")
print(f"{'method':18s} {'Spearman mean':>14s} {'SD':>7s} {'P@50 mean':>10s} {'SD':>7s}")
for n, d in rows.items():
    print(f"{n:18s} {np.mean(d['sp']):14.3f} {np.std(d['sp'], ddof=1):7.3f} "
          f"{np.mean(d['p50']):10.3f} {np.std(d['p50'], ddof=1):7.3f}")
print("\nSeed 42 only (single test set):")
for n, d in rows.items():
    i = SEEDS.index(42)
    print(f"  {n:18s} Spearman {d['sp'][i]:.3f}  P@50 {d['p50'][i]:.3f}")
print("\nModel beats star average on Spearman in", sum(a > b for a, b in zip(rows['Ridge model']['sp'], rows['star average']['sp'])), "of 8 datasets")
print("Model beats Bayesian average on Spearman in", sum(a > b for a, b in zip(rows['Ridge model']['sp'], rows['Bayesian average']['sp'])), "of 8 datasets")
print("Model beats equal weights on Spearman in", sum(a > b for a, b in zip(rows['Ridge model']['sp'], rows['equal weights']['sp'])), "of 8 datasets")

# ---------- 2. manipulation tests on many providers ----------
def attacked(Xte, idx, kind):
    d = Xte.iloc[idx].copy()
    if kind in ("rating", "both"):
        d["rating"] = 1.0              # top rating on the scaled 0-1 range
    if kind in ("completion", "both"):
        d["completion"] = 1.0          # provider marks every job completed
    return d

print("\n=== Manipulation tests: every below-median-reliability test provider attacked one at a time ===")
attacks = {"rating": "Inflated rating (5 stars)",
           "completion": "Self-reported completion (completion rate set to 100%)",
           "both": "Both together"}
pooled = {k: {n: {"before": [], "after": [], "rise": []} for n in rows} for k in attacks}
share10_by_seed = {k: {n: [] for n in rows} for k in attacks}
for s in SEEDS:
    Xte, yte, scorers, m = store[s]
    low = np.where(yte.to_numpy() < np.median(yte.to_numpy()))[0]
    N = len(Xte)
    for n, f in scorers.items():
        base = f(Xte)
        srt = np.sort(base)
        before = position(srt, base[low], base[low], N)
        for k in attacks:
            new = f(attacked(Xte, low, k))
            after = position(srt, new, base[low], N)
            pooled[k][n]["before"].append(before)
            pooled[k][n]["after"].append(after)
            pooled[k][n]["rise"].append(before - after)
            share10_by_seed[k][n].append(np.mean(after <= 10))

for k, label in attacks.items():
    print(f"\n{label}")
    print(f"  {'method':18s} {'median top%':>12s} {'median rise':>12s} {'90th pct rise':>14s} "
          f"{'into top 10%':>13s} {'SD across seeds':>16s}")
    for n in rows:
        b = np.concatenate(pooled[k][n]["before"]); a = np.concatenate(pooled[k][n]["after"]); r = np.concatenate(pooled[k][n]["rise"])
        sh = share10_by_seed[k][n]
        print(f"  {n:18s} {np.median(a):11.1f}% {np.median(r):11.1f} {np.percentile(r, 90):14.1f} "
              f"{100*np.mean(a<=10):12.1f}% {100*np.std(sh, ddof=1):15.1f}")
b = np.concatenate(pooled['rating']['Ridge model']['before'])
print(f"\nBefore any attack the attacked providers sit at a median of top {np.median(b):.1f}% (higher number = lower rank).")
print(f"Number of attacked providers: {len(b)} (about 1,000 per dataset x 8 datasets)")
