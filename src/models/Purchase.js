const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      default: "Pending",
    },
    haveDispute: {
      type: Boolean,
      default: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    timeToSell: {
      type: Number,
      required: true,
    },
    buyer: {
      username: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    seller: {
      username: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    timeFinalized: {
      type: Date,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
