const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  status: {
    type: String,
    enum: ["requested", "confirmed", "completed", "rejected"],
    default: "requested",
  },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);