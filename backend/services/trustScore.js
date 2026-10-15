//Computes a provider's trust score from their signals using calibrated weights

//CALIBRATED WEIGHTS
const WEIGHTS = {
  completion: 0.395,
  lowComplaints: 0.385,
  rating: 0.186,
  verification: 0.033,
};

//Map the verification tier to a 0-1 value 
const TIER_VALUE = {
  provisional: 0.0,
  verified: 0.5,
  trusted: 1.0,
};

//Normalise each raw signal to a 0-1 scale so they're comparable before weighting
function normaliseSignals(provider) {
  //rating is on a 1-5 scale -> map to 0-1
  const rating = (provider.avgRating - 1) / 4;

  //completion rate is already 0-1
  const completion = provider.completionRate;

  //complaints run inverse: fewer complaints = higher score
  //complaintRate is roughly 0-0.3 in the data, so we invert and clamp.
  const lowComplaints = 1 - Math.min(provider.complaintRate / 0.3, 1);

  // verification tier -> 0-1
  const verification = TIER_VALUE[provider.verificationTier] ?? 0;

  return { rating, completion, lowComplaints, verification };
}

//Compute the trust score (0-100) and a breakdown of each signal's contribution.
function computeTrustScore(provider) {
  const s = normaliseSignals(provider);

  //each signal's contribution = normalised value * its weight
  const contributions = {
    completion: s.completion * WEIGHTS.completion,
    lowComplaints: s.lowComplaints * WEIGHTS.lowComplaints,
    rating: s.rating * WEIGHTS.rating,
    verification: s.verification * WEIGHTS.verification,
  };

  //total is the sum of contributions, scaled to 0-100
  const raw = contributions.completion + contributions.lowComplaints +
              contributions.rating + contributions.verification;
  const score = Math.round(raw * 100);

  return {
    value: score,
    breakdown: {
      completion: Math.round(contributions.completion * 100),
      lowComplaints: Math.round(contributions.lowComplaints * 100),
      rating: Math.round(contributions.rating * 100),
      verification: Math.round(contributions.verification * 100),
    },
  };
}

module.exports = { computeTrustScore, WEIGHTS };