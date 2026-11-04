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
      console.error("Provider error:", err.message);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
});

// GET /api/providers/search - ranked providers, optional category + area filters
router.get("/search", async (req, res) => {
  try {
    const { category, area } = req.query;

    const filter = {};
    if (category) {
      filter.serviceCategoryId = category;
    }
    if (area) {
      // case-insensitive match so "westlands" and "Westlands" both work
      filter.area = { $regex: new RegExp(area, "i") };
    }

    const providers = await Provider.find(filter)
      .populate("userId", "fullName phone")
      .populate("serviceCategoryId", "name")
      .sort({ "trustScore.value": -1 });

    const { computeTrustScore } = require("../services/trustScore");
    const results = providers.map((p) => {
      const scored = computeTrustScore(p);
      return {
        id: p._id,
        name: p.userId?.fullName,
        category: p.serviceCategoryId?.name,
        area: p.area,
        photo: p.photo,
        verificationTier: p.verificationTier,
        trustScore: p.trustScore.value,
        breakdown: scored.breakdown,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
      };
    });

    res.json(results);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Search failed" });
  }
});

//GET - a single provider's full profile, with trust score breakdown
router.get("/:id", async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate("userId", "fullName phone")
      .populate("serviceCategoryId", "name");
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    //compute the live breakdown so the frontend can show what makes up the score
    const { computeTrustScore } = require("../services/trustScore");
    const scored = computeTrustScore(provider);

    //return the provider plus the breakdown
    res.json({ ...provider.toObject(), breakdown: scored.breakdown });
    } catch (err) {
      console.error("Provider error:", err.message);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
});
//GET the logged-in provider's own profile 
router.get("/me/profile", protect, restrictTo("provider"), async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.userId })
      .populate("userId", "fullName phone email")
      .populate("serviceCategoryId", "name");
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    res.json(provider);
    } catch (err) {
      console.error("Provider error:", err.message);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
});

const upload = require("../middleware/upload");

//PATCH - the logged-in provider updates their own profile (bio, area, photo)
router.patch("/me/profile", protect, restrictTo("provider"), upload.single("photo"), async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.userId });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const { bio, area } = req.body;
    if (bio !== undefined) provider.bio = bio;
    if (area !== undefined) provider.area = area;
    if (req.file) provider.photo = req.file.path;   // Cloudinary URL

    await provider.save();
    res.json({ message: "Profile updated", provider });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ message: "Profile update failed" });
  }
});

module.exports = router;