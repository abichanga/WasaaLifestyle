const express = require("express");
const Provider = require("../models/Provider");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

//POST - a logged-in provider creates/completes their provider profile
router.post("/", protect, restrictTo("provider"), async (req, res) => {
  try {
    const { bio, serviceCategoryId } = req.body;

    //one profile per user
    const existing = await Provider.findOne({ userId: req.user.userId });
    if (existing) {
      return res.status(400).json({ message: "Provider profile already exists" });
    }

    const provider = await Provider.create({
      userId: req.user.userId,
      bio,
      serviceCategoryId,
    });

    res.status(201).json(provider);
  } catch (err) {
    res.status(500).json({ message: "Failed to create provider", error: err.message });
  }
});
// GET /api/providers/search - ranked providers, optionally filtered by category
router.get("/search", async (req, res) => {
  try {
    const { category } = req.query;

    //build the filter: if a category is given, filter by it
    const filter = {};
    if (category) {
      filter.serviceCategoryId = category;
    }

    //fetch matching providers, sorted by trust score (highest first)
    const providers = await Provider.find(filter)
      .populate("userId", "fullName phone")
      .populate("serviceCategoryId", "name")
      .sort({ "trustScore.value": -1 });   // -1 = descending

    //shape the response: include the trust score and the live breakdown
    const { computeTrustScore } = require("../services/trustScore");
    const results = providers.map((p) => {
      const scored = computeTrustScore(p);
      return {
        id: p._id,
        name: p.userId?.fullName,
        category: p.serviceCategoryId?.name,
        verificationTier: p.verificationTier,
        trustScore: p.trustScore.value,
        breakdown: scored.breakdown,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

//GET - a single provider's full profile
router.get("/:id", async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate("userId", "fullName phone")
      .populate("serviceCategoryId", "name");
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch provider", error: err.message });
  }
});

module.exports = router;