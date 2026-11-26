import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from scipy.stats import spearmanr

def scale(col):
    return (col - col.min()) / (col.max() - col.min())

def make_data(seed, rating_noise, completion_noise, complaint_noise, n=10000):
    rng = np.random.default_rng(seed)
    r = rng.beta(a=5, b=2, size=n)

    def noisy(rel, noise):
        return np.clip(rel + rng.normal(0, noise, size=len(rel)), 0, 1)

    rating = np.round(3.0 + noisy(r, rating_noise) * 2.0, 1)
    completion = np.round(noisy(r, completion_noise), 2)
    complaint = np.round(noisy(1 - r, complaint_noise) * 0.3, 3)
    jobs = np.floor(rng.exponential(scale=20, size=n) * (0.5 + r)).astype(int)
    rng.uniform(0.4, 0.7, size=n)

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
        "truth": r,
    })

def run(seed, rn, cn, qn):
    df = make_data(seed, rn, cn, qn)
    X = df[["rating", "completion", "low_complaints", "verification"]]
    y = df["truth"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=seed)
    m = Ridge(alpha=1.0).fit(Xtr, ytr)
    w = pd.Series(m.coef_, index=X.columns)
    sp_model = spearmanr(m.predict(Xte), yte).correlation
    sp_base = spearmanr(Xte["rating"], yte).correlation
    return w / w.sum(), sp_model, sp_base, bool((w > 0).all())

settings = [
    ("deployed noise (rating .15, others .10)", 0.15, 0.10, 0.10),
    ("all signals equally noisy (.10)",          0.10, 0.10, 0.10),
    ("all signals equally noisy (.15)",          0.15, 0.15, 0.15),
    ("rating cleaner (.05)",                     0.05, 0.10, 0.10),
    ("rating noisier (.25)",                     0.25, 0.10, 0.10),
    ("behaviour noisier (.20 each)",             0.15, 0.20, 0.20),
]
seeds = [1, 7, 13, 42, 99]

for name, rn, cn, qn in settings:
    ws, sm, sb, pos = [], [], [], []
    for s in seeds:
        w, a, b, p = run(s, rn, cn, qn)
        ws.append(w); sm.append(a); sb.append(b); pos.append(p)
    mean_w = pd.concat(ws, axis=1).mean(axis=1)
    beats = sum((w["completion"] > w["rating"]) and (w["low_complaints"] > w["rating"]) for w in ws)
    print(f"\n{name}")
    print("  mean weights:", {k: round(v, 3) for k, v in mean_w.items()})
    print(f"  completion and complaints above rating in {beats} of {len(seeds)} seeds")
    print(f"  all coefficients positive in {sum(pos)} of {len(seeds)} seeds")
    print(f"  Spearman: model {np.mean(sm):.3f}, star average {np.mean(sb):.3f}")