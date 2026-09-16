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