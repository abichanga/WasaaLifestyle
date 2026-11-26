const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  status: {
    type: String,
    // awaiting_household = provider says the job is done, household hasn't confirmed yet
    enum: ["requested", "confirmed", "awaiting_household", "completed", "rejected"],
    default: "requested",
  },
  providerMarkedDoneAt: { type: Date },
  householdConfirmedAt: { type: Date },
  scheduledDate: { type: String },    
  scheduledTime: { type: String },    
  address: { type: String },          
  notes: { type: String },            
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);