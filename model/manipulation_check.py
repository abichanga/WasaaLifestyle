#To show the model resists fake-review farming better than a star-average baseline

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge

df = pd.read_csv("simulated_providers.csv")
tier_map = {"Provisional": 0.0, "Verified": 0.5, "Trusted": 1.0}
df["tier_num"] = df["verification_tier"].map(tier_map)

def scale(col):
    return (col - col.min()) / (col.max() - col.min())

features = pd.DataFrame({
    "rating":         scale(df["avg_rating"]),
    "completion":     scale(df["completion_rate"]),
    "low_complaints": 1 - scale(df["complaint_rate"]),
    "job_count":      scale(df["confirmed_job_count"]),
    "review_count":   scale(df["review_count"]),
    "verification":   df["tier_num"],
})
target = df["true_reliability"]

X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)
model = Ridge(alpha=1.0).fit(X_train, y_train)

#score all providers with both methods
model_scores = model.predict(features)
baseline_scores = features["rating"].values
n = len(df)

#pick a mediocre provider (low true reliability)
victim = df["true_reliability"].values.argsort()[int(n*0.4)]  # a below-average provider
print(f"Chosen provider true reliability: {df['true_reliability'].iloc[victim]:.2f}")

def rank_of(scores, idx):
    #rank position (1 = best) of provider idx
    order = np.argsort(scores)[::-1]
    return int(np.where(order == victim)[0][0]) + 1

print("\nBEFORE manipulation:")
print(f"  Star-average rank: {rank_of(baseline_scores, victim)} of {n}")
print(f"  Model rank:        {rank_of(model_scores, victim)} of {n}")

#simulate fake-review farming
manip_features = features.copy()
manip_features.loc[victim, "rating"] = 1.0   #farmed to top rating

# recompute scores with the manipulated rating
manip_model_scores = model.predict(manip_features)
manip_baseline_scores = manip_features["rating"].values

print("\nAFTER faking a top rating:")
print(f"  Star-average rank: {rank_of(manip_baseline_scores, victim)} of {n}")
print(f"  Model rank:        {rank_of(manip_model_scores, victim)} of {n}")