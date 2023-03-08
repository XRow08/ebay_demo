const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "Pending",
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },
    suport: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    buyer: {
      type: String,
      required: true,
    },
    seller: {
      type: String,
      required: true,
    },
    winner: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", DisputeSchema);
