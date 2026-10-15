// testScore.js - quick sanity check of the trust scoring logic
const { computeTrustScore } = require("./services/trustScore");

// a strong provider: high completion, few complaints, good rating, trusted
const strong = {
  avgRating: 4.7,
  completionRate: 0.95,
  complaintRate: 0.02,
  verificationTier: "trusted",
};

// a weak provider: low completion, more complaints, mediocre rating, provisional
const weak = {
  avgRating: 3.5,
  completionRate: 0.55,
  complaintRate: 0.20,
  verificationTier: "provisional",
};

// a "fake rating" provider: great rating but poor actual behaviour
const faker = {
  avgRating: 5.0,
  completionRate: 0.50,
  complaintRate: 0.25,
  verificationTier: "provisional",
};

console.log("Strong provider:", computeTrustScore(strong));
console.log("Weak provider:  ", computeTrustScore(weak));
console.log("Faker provider: ", computeTrustScore(faker));