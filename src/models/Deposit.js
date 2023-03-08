const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "Pending",
    },
    total: {
      type: Number,
      required: true,
    },
    userUsername: {
      type: String,
      required: true,
    },
    timeFinalized: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deposit", DepositSchema);
