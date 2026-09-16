#simulated provider dataset for the WasaaLifestyle trust scoring model

import numpy as np
import pandas as pd
import collections

#setup 
SEED = 42
rng = np.random.default_rng(SEED)
N_PROVIDERS = 10000

#1: generate true reliability
true_reliability = rng.beta(a=5, b=2, size=N_PROVIDERS)

#2: observable signals from reliability, with noise 
def noisy_signal(reliability, noise_level):
    noise = rng.normal(0, noise_level, size=len(reliability))
    return np.clip(reliability + noise, 0, 1)

rating_base = noisy_signal(true_reliability, noise_level=0.15)
avg_rating = np.round(3.0 + rating_base * 2.0, 1)

completion_rate = np.round(noisy_signal(true_reliability, noise_level=0.10), 2)
complaint_rate = np.round(noisy_signal(1 - true_reliability, noise_level=0.10) * 0.3, 3)

#3: verification tier, job counts, cold-start structure
confirmed_job_count = np.floor(
    rng.exponential(scale=20, size=N_PROVIDERS) * (0.5 + true_reliability)
).astype(int)

review_fraction = rng.uniform(0.4, 0.7, size=N_PROVIDERS)
review_count = np.floor(confirmed_job_count * review_fraction).astype(int)

def assign_tier(reliability, jobs):
    tiers = []
    for r, j in zip(reliability, jobs):
        if j < 5:
            tiers.append("Provisional")
        elif r > 0.7 and j >= 20 and rng.random() < 0.8:
            tiers.append("Trusted")
        elif r > 0.5 and rng.random() < 0.7:
            tiers.append("Verified")
        else:
            tiers.append("Provisional")
    return tiers

verification_tier = assign_tier(true_reliability, confirmed_job_count)

#save
df = pd.DataFrame({
    "provider_id": [f"P{i:05d}" for i in range(N_PROVIDERS)],
    "avg_rating": avg_rating,
    "completion_rate": completion_rate,
    "complaint_rate": complaint_rate,
    "confirmed_job_count": confirmed_job_count,
    "review_count": review_count,
    "verification_tier": verification_tier,
    "true_reliability": np.round(true_reliability, 3),
})

df.to_csv("simulated_providers.csv", index=False)

print("Dataset saved to simulated_providers.csv")
print("Shape:", df.shape)
print("Verification tier counts:", dict(collections.Counter(verification_tier)))
print("Cold-start cases (<5 jobs):", int((confirmed_job_count < 5).sum()))
print("\nFirst few rows:")
print(df.head())