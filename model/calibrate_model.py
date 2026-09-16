
#calibrate the trust scoring weights using Ridge regression

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge

#1: load data and normalise signals to 0-1 
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

#train/test split
X_train, X_test, y_train, y_test = train_test_split(
    features, target, test_size=0.2, random_state=42
)
print("Training providers:", len(X_train))
print("Test providers:", len(X_test))

#3: fit Ridge regression
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

weights = pd.Series(model.coef_, index=features.columns).sort_values(ascending=False)
print("\nLearned weights (higher = more predictive of reliability):")
for signal, w in weights.items():
    print(f"  {signal:14s} {w:+.3f}")
print(f"\nIntercept: {model.intercept_:.3f}")