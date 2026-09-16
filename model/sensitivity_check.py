
#to test whether the model's advantage over the baseline holds across many random datasets

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge
from scipy.stats import spearmanr

def scale(col):
    return (col - col.min()) / (col.max() - col.min())

def run_once(seed, n_providers=10000):
    """Generate a fresh dataset with this seed, fit the model, return both Spearman scores."""
    rng = np.random.default_rng(seed)

    true_reliability = rng.beta(a=5, b=2, size=n_providers)

    def noisy(reliability, noise_level):
        noise = rng.normal(0, noise_level, size=len(reliability))
        return np.clip(reliability + noise, 0, 1)

    avg_rating = np.round(3.0 + noisy(true_reliability, 0.15) * 2.0, 1)
    completion_rate = np.round(noisy(true_reliability, 0.10), 2)
    complaint_rate = np.round(noisy(1 - true_reliability, 0.10) * 0.3, 3)
    confirmed_job_count = np.floor(
        rng.exponential(scale=20, size=n_providers) * (0.5 + true_reliability)
    ).astype(int)
    review_count = np.floor(confirmed_job_count * rng.uniform(0.4, 0.7, size=n_providers)).astype(int)

    def assign_tier(reliability, jobs):
        tiers = []
        for r, j in zip(reliability, jobs):
            if j < 5:
                tiers.append(0.0)
            elif r > 0.7 and j >= 20 and rng.random() < 0.8:
                tiers.append(1.0)
            elif r > 0.5 and rng.random() < 0.7:
                tiers.append(0.5)
            else:
                tiers.append(0.0)
        return np.array(tiers)

    tier_num = assign_tier(true_reliability, confirmed_job_count)

    #build features
    features = pd.DataFrame({
        "rating":         scale(pd.Series(avg_rating)),
        "completion":     scale(pd.Series(completion_rate)),
        "low_complaints": 1 - scale(pd.Series(complaint_rate)),
        "job_count":      scale(pd.Series(confirmed_job_count)),
        "review_count":   scale(pd.Series(review_count)),
        "verification":   tier_num,
    })
    target = pd.Series(true_reliability)

    #split, fit n evaluate 
    X_train, X_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=seed
    )
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    model_scores = model.predict(X_test)
    baseline_scores = X_test["rating"].values
    truth = y_test.values

    model_sp = spearmanr(model_scores, truth).correlation
    base_sp = spearmanr(baseline_scores, truth).correlation
    return model_sp, base_sp

#run across several seeds
seeds = [1, 7, 13, 42, 99, 123, 777, 2024]
print(f"{'Seed':>6}{'Model':>10}{'Baseline':>12}{'Model wins?':>14}")
model_results, base_results = [], []
for s in seeds:
    m, b = run_once(s)
    model_results.append(m)
    base_results.append(b)
    print(f"{s:>6}{m:>10.3f}{b:>12.3f}{'yes' if m > b else 'NO':>14}")

print("\n----- Summary across seeds -----")
print(f"Model    mean Spearman: {np.mean(model_results):.3f}  (min {np.min(model_results):.3f}, max {np.max(model_results):.3f})")
print(f"Baseline mean Spearman: {np.mean(base_results):.3f}  (min {np.min(base_results):.3f}, max {np.max(base_results):.3f})")
print(f"Model beat baseline on {sum(m>b for m,b in zip(model_results, base_results))} of {len(seeds)} datasets")