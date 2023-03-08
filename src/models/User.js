const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    purchase: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",
      },
    ],
    deposit: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deposit",
      },
    ],
    withdraw: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Withdraw",
      },
    ],
    social: {
      type: Object,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    isSuport: {
      type: Boolean,
      default: false,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    disputes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dispute",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
