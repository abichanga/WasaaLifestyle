# WasaaLifestyle

A machine-learning trust-scoring model for ranking household service providers in Nairobi, delivered within a service marketplace. Instead of ranking providers by a star-rating average, WasaaLifestyle learns a trust score from multiple signals and ranks providers by their predicted reliability.

## The Problem

Urban households in Nairobi struggle to find trustworthy service providers (plumbers, electricians, and other skilled trades) when they have no personal referral. Existing platforms rank providers by a single star average, which is a weak and easily manipulated signal of trust: it ignores whether a provider is verified, how consistently they complete jobs, and how often they attract complaints.

## The Contribution

A **supervised machine-learning trust-scoring model** that combines multiple weighted signals, job completion rate, complaint rate, average rating, and verification status, into a single transparent score used to rank providers by reliability.

- **Model:** Ridge regression, calibrated on a labelled dataset to learn each signal's weight rather than setting weights by hand.
- **Key finding:** job completion and low complaint rates are stronger predictors of reliability than the average rating, which is direct evidence against star-average ranking.
- **Transparency:** every score comes with a breakdown of how much each signal contributed, so the ranking is explainable rather than a black box.

## Results

Evaluated against a star-average baseline on a held-out test set:

| Measure | Trust model | Star-average baseline |
|---|---|---|
| Spearman rank correlation with true reliability | **0.92** | 0.71 |
| Precision@50 | **0.26** | 0.14 |
| Mean Spearman across 8 datasets | **0.92** | 0.72 |

The model beat the baseline on all 8 independently generated datasets. In a manipulation test, a mediocre provider faking a top rating jumped into the top 6% under the star average but stayed mid-pack under the trust model, because rating is only one of several weighted signals.

## Tech Stack

- **Model / ML:** Python, scikit-learn (Ridge regression), pandas, NumPy
- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas), Mongoose
- **Auth:** JSON Web Tokens, bcrypt
- **Frontend (planned):** React (web), React Native (mobile)

## Project Structure

```
WasaaLifestyle/
├── model/            # ML: dataset generation, calibration, evaluation
│   ├── generate_dataset.py     # simulate providers with known reliability
│   ├── calibrate_model.py      # learn trust weights (Ridge regression)
│   ├── evaluate_model.py       # vs star-average baseline
│   ├── sensitivity_check.py    # robustness across datasets
│   └── manipulation_test.py    # resistance to fake ratings
├── backend/          # Node.js + Express REST API
│   ├── models/           # Mongoose schemas
│   ├── routes/           # auth, providers, bookings, reviews, categories
│   ├── services/         # trust scoring, live re-scoring
│   ├── middleware/       # auth & role-based access
│   └── seed.js           # loads sample providers from the research data
├── web/              # React web app (planned)
└── mobile/           # React Native app (planned)
```

## How the Model Works

1. **Dataset:** 10,000 simulated providers, each with a hidden true reliability and observable signals (rating, completion, complaints, verification, job/review counts) generated from it with realistic noise. Observable signal distributions are grounded in real Nairobi platform data.
2. **Calibration:** signals are normalised and the model is fitted with Ridge regression (chosen for stability with correlated signals and interpretability) on an 80/20 train/test split.
3. **Scoring:** the learned weights are normalised to proportions and applied live in the backend to score and rank providers, re-computing as providers complete jobs and receive reviews.

## Scope

Focused on skilled, certifiable trades (plumbing, electrical, carpentry, appliance repair), where the three-layer verification model (identity, credential, earned track record) applies consistently. Other categories are noted as future work.

## Getting Started

### Model
\`\`\`bash
cd model
python generate_dataset.py
python calibrate_model.py
python evaluate_model.py
\`\`\`

### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
Requires a \`.env\` file in \`backend/\` with \`MONGO_URI\`, \`JWT_SECRET\`, and \`PORT\`.

### Seed sample data
\`\`\`bash
cd backend
node seed.js
\`\`\`

## Author

Anita Bichanga, Strathmore University
Final-year BSc Informatics and Computer Science project.
