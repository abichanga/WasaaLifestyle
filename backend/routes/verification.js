const express = require("express");
const Provider = require("../models/Provider");
const { protect, restrictTo } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

//PROVIDER submits identity + credential documents
router.post(
  "/submit",
  protect,
  restrictTo("provider"),
  upload.fields([
    { name: "identityDocument", maxCount: 1 },
    { name: "credentialDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const provider = await Provider.findOne({ userId: req.user.userId });
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      if (req.files.identityDocument) {
        provider.identityDocument = req.files.identityDocument[0].path;
      }
      if (req.files.credentialDocument) {
        provider.credentialDocument = req.files.credentialDocument[0].path;
      }

      provider.verificationStatus = "pending";
      await provider.save();

      res.json({ message: "Documents submitted for review", status: "pending" });
    } catch (err) {
      res.status(500).json({ message: "Submission failed", error: err.message });
    }
  }
);

//ADMIN lists providers awaiting review
router.get("/pending", protect, restrictTo("admin"), async (req, res) => {
  try {
    const pending = await Provider.find({ verificationStatus: "pending" })
      .populate("userId", "fullName email");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch", error: err.message });
  }
});

//ADMIN approves or rejects a provider's verification
router.patch("/:providerId/review", protect, restrictTo("admin"), async (req, res) => {
  try {
    const { decision, tier } = req.body;   //decision: "approved" | "rejected"
    const provider = await Provider.findById(req.params.providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    if (decision === "approved") {
      provider.verificationStatus = "approved";
      provider.identityVerified = true;
      provider.verificationTier = tier || "verified";   //admin sets the tier
    } else if (decision === "rejected") {
      provider.verificationStatus = "rejected";
      provider.identityVerified = false;
    } else {
      return res.status(400).json({ message: "Invalid decision" });
    }

    //re-score since verification is a trust signal
    const { computeTrustScore } = require("../services/trustScore");
    const result = computeTrustScore(provider);
    provider.trustScore = { value: result.value, lastComputed: new Date() };

    await provider.save();
    res.json({ message: `Provider ${decision}`, verificationTier: provider.verificationTier });
  } catch (err) {
    res.status(500).json({ message: "Review failed", error: err.message });
  }
});

module.exports = router;