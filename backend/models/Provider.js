const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bio: { type: String },
  serviceCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" },

  // verification (result only - no raw ID numbers)
  identityVerified: { type: Boolean, default: false },
  credentialStatus: { type: String, enum: ["none", "association", "rpl", "both"], default: "none" },
  verificationTier: { type: String, enum: ["provisional", "verified", "trusted"], default: "provisional" },

    // verification submission
  identityDocument: { type: String },      // file path to uploaded ID
  credentialDocument: { type: String },    // file path to uploaded credential
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "approved", "rejected"],
    default: "unverified",
  },

  // trust signals
  completionRate: { type: Number, default: 0 },
  complaintRate: { type: Number, default: 0 },
  confirmedJobCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  // embedded trust score
  trustScore: {
    value: { type: Number, default: 0 },
    lastComputed: { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model("Provider", providerSchema);