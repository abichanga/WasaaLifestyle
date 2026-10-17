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

//GET my bookings 
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

//UPDATE booking status 
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

    if (status === "completed" && previousStatus !== "completed") {
      await updateProviderSignals(provider._id);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Status update failed", error: err.message });
  }
});

//A newly completed job adds to the provider's track record, on top of their baseline.
async function updateProviderSignals(providerId) {
  const provider = await Provider.findById(providerId);

  provider.confirmedJobCount = (provider.confirmedJobCount || 0) + 1;
  provider.completionRate = provider.completionRate + (1 - provider.completionRate) * 0.05;
  provider.completionRate = Math.min(provider.completionRate, 1);

  const { computeTrustScore } = require("../services/trustScore");
  const result = computeTrustScore(provider);
  provider.trustScore = { value: result.value, lastComputed: new Date() };

  await provider.save();
}

module.exports = router;