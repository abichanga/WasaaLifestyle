#evaluate the trust scoring model against a star-average baseline

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge
from scipy.stats import spearmanr

#load and prepare exactly as in calibration
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

#same split (same random_state) 
X_train, X_test, y_train, y_test = train_test_split(
    features, target, test_size=0.2, random_state=42
)

#refit the model on the training set
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

print("Setup complete. Evaluating on", len(X_test), "held-out providers.")

#2: produce the two rankings on the test providers 

#the model's trust score for each test provider (using the learned weights).
model_scores = model.predict(X_test)

#the baseline: rank by star rating alone (what existing platforms do).
baseline_scores = X_test["rating"].values

#the ground truth we compare against.
truth = y_test.values

print("Scores computed for both the model and the baseline.")

#3: measure both rankings against true reliability

#metric 1: Spearman rank correlation (does the overall ORDER match reliability?)
model_spearman = spearmanr(model_scores, truth).correlation
baseline_spearman = spearmanr(baseline_scores, truth).correlation

#metric 2: Precision@k (of the top-k ranked providers, how many are genuinely in the truly-reliable top group?)
def precision_at_k(scores, truth, k=50):
    #indices of the top-k providers by score
    top_k_by_score = np.argsort(scores)[::-1][:k]
    #the truly best providers (top-k by true reliability)
    truly_top = set(np.argsort(truth)[::-1][:k])
    #how many of our top-k are actually in the truly-top group
    hits = sum(1 for i in top_k_by_score if i in truly_top)
    return hits / k

model_prec = precision_at_k(model_scores, truth, k=50)
baseline_prec = precision_at_k(baseline_scores, truth, k=50)

#Results
print("\n================ RESULTS ================")
print(f"{'Metric':<22}{'Model':>10}{'Baseline':>12}")
print(f"{'Spearman correlation':<22}{model_spearman:>10.3f}{baseline_spearman:>12.3f}")
print(f"{'Precision@50':<22}{model_prec:>10.2f}{baseline_prec:>12.2f}")
print("=========================================")

if model_spearman > baseline_spearman:
    print("\n=> The multi-signal model ranks providers more accurately")
    print("   than the star-average baseline.")
else:
    print("\n=> The baseline matched or beat the model - worth investigating.")