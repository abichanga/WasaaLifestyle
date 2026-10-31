const express = require("express");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

//CREATE a review
router.post("/", protect, restrictTo("household"), async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    //validate the rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1-5" });
    }

    //the booking must exist, belong to this household, and be completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (!booking.householdId.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed jobs" });
    }

    //prevent a second review on the same booking
    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({ message: "This job has already been reviewed" });
    }

    const review = await Review.create({
      bookingId,
      providerId: booking.providerId,
      rating,
      comment,
    });

    // Recompute the provider's rating from all reviews, update complaint rate, then re-score.
async function updateProviderRating(providerId) {
  const provider = await Provider.findById(providerId);
  if (!provider) return;

  const reviews = await Review.find({ providerId });
  if (reviews.length > 0) {
    // average rating across all reviews
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    provider.avgRating = sum / reviews.length;
    provider.reviewCount = reviews.length;

    // complaint rate = share of reviews that are low (1 or 2 stars)
    const complaints = reviews.filter((r) => r.rating <= 2).length;
    provider.complaintRate = complaints / reviews.length;
  }

  const { computeTrustScore } = require("../services/trustScore");
  const result = computeTrustScore(provider);
  provider.trustScore = { value: result.value, lastComputed: new Date() };

  await provider.save();
}

    res.status(201).json(review);
    } catch (err) {
      console.error("Review error:", err.message);
      res.status(500).json({ message: "Review failed" });
    }
});

//GET all reviews for a provider 
router.get("/provider/:providerId", async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 });
    res.json(reviews);
    } catch (err) {
      console.error("Review error:", err.message);
      res.status(500).json({ message: "Review failed" });
    }  
});

//Recompute the provider's average rating from all their reviews, then re-score.
async function updateProviderRating(providerId) {
  const provider = await Provider.findById(providerId);

  const reviews = await Review.find({ providerId });
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    provider.avgRating = sum / reviews.length;
    provider.reviewCount = reviews.length;
  }

  const { computeTrustScore } = require("../services/trustScore");
  const result = computeTrustScore(provider);
  provider.trustScore = { value: result.value, lastComputed: new Date() };

  await provider.save();
}

module.exports = router;