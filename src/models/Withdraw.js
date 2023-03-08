const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema(
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
    pixKey: {
      type: String,
      required: true,
      default: "Null",
    },
    wallet: {
      type: String,
      required: true,
      default: "Null",
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

module.exports = mongoose.model("Withdraw", WithdrawSchema);
