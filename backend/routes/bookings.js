const express = require("express");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

//CREATE a booking 
router.post("/", protect, restrictTo("household"), async (req, res) => {
  try {
    const { providerId } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const booking = await Booking.create({
      householdId: req.user.userId,
      providerId,
      status: "requested",
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
});

//GET my bookings (works for both households and providers) 
router.get("/mine", protect, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === "household") {
      bookings = await Booking.find({ householdId: req.user.userId })
        .populate("providerId");
    } else {
      const provider = await Provider.findOne({ userId: req.user.userId });
      bookings = await Booking.find({ providerId: provider._id })
        .populate("householdId", "fullName phone");
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: err.message });
  }
});

//UPDATE booking status (provider confirms/completes/rejects) 
router.patch("/:id/status", protect, restrictTo("provider"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "completed", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const provider = await Provider.findOne({ userId: req.user.userId });
    if (!booking.providerId.equals(provider._id)) {
      return res.status(403).json({ message: "Not your booking" });
    }

    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();

    //a newly completed job updates the provider's track record
    if (status === "completed" && previousStatus !== "completed") {
      await updateProviderSignals(provider._id);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Status update failed", error: err.message });
  }
});

async function updateProviderRating(providerId) {
  const provider = await Provider.findById(providerId);
  if (!provider) return;   // provider no longer exists, skip the update

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