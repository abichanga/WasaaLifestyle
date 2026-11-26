const express = require("express");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

//CREATE a booking (household requests a provider) 
router.post("/", protect, restrictTo("household"), async (req, res) => {
  try {
    const { providerId, scheduledDate, scheduledTime, address, notes } = req.body;

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const booking = await Booking.create({
      householdId: req.user.userId,
      providerId,
      status: "requested",
      scheduledDate,
      scheduledTime,
      address,
      notes,
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Booking error:", err.message);
    res.status(500).json({ message: "Booking failed" });
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
      console.error("Booking error:", err.message);
      res.status(500).json({ message: "Booking failed" });
    }
});

//UPDATE booking status 
router.patch("/:id/status", protect, restrictTo("provider"), async (req, res) => {
  try {
    let { status } = req.body;

    // the provider can no longer complete a job on their own.
    // "completed" from the provider now means "I'm done, household please confirm".
    if (status === "completed") status = "awaiting_household";

    // which status each move is allowed to come from
    const validFrom = {
      confirmed: ["requested"],
      rejected: ["requested"],
      awaiting_household: ["confirmed"],
    };
    if (!validFrom[status]) {
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

    if (!validFrom[status].includes(booking.status)) {
      return res.status(400).json({ message: `Can't move a ${booking.status} booking to ${status}` });
    }

    booking.status = status;
    if (status === "awaiting_household") booking.providerMarkedDoneAt = new Date();
    await booking.save();

    res.json(booking);
      } catch (err) {
      console.error("Booking error:", err.message);
      res.status(500).json({ message: "Booking failed" });
    }
});

//HOUSEHOLD confirms (or disputes) that the job was actually done
router.patch("/:id/confirm-completion", protect, restrictTo("household"), async (req, res) => {
  try {
    const { confirmed } = req.body; // true = job done, false = not done yet

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (!booking.householdId.equals(req.user.userId)) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.status !== "awaiting_household") {
      return res.status(400).json({ message: "The provider hasn't marked this job as done yet" });
    }

    if (confirmed === true) {
      booking.status = "completed";
      booking.householdConfirmedAt = new Date();
      await booking.save();
      // only a household-confirmed job counts toward the trust score
      await updateProviderSignals(booking.providerId);
    } else {
      // household says it isn't finished, send it back to the provider
      booking.status = "confirmed";
      booking.providerMarkedDoneAt = undefined;
      await booking.save();
    }

    res.json(booking);
      } catch (err) {
      console.error("Booking error:", err.message);
      res.status(500).json({ message: "Booking failed" });
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