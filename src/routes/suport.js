const User = require("../models/User");
const Dispute = require("../models/Dispute");

const router = require("express").Router();
const { isSuport } = require("../helpers/verify");
const uuidEreg = /^[a-f\d]{24}$/i;

//SUPORT DISPUTES
router.get("/disputes", isSuport, (req, res) => {
  const { id, username } = req.user;
  Dispute.find()
    .lean()
    .populate("purchaseId")
    .populate({
      path: "purchaseId",
      populate: { path: "productId", model: "Product" },
    })
    .sort({ data: "desc" })
    .then((disputes) => {
      res.render("suport/disputes", {
        dispute: disputes
          .filter((e) => !e.suport || e.suport === "")
          .map((e) => ({
            ...e.purchaseId,
            disputeId: e._id,
            disputeStatus: e.status,
            disputeCause: e.message,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse(),
        id,
        username,
        dispute_id: disputes._id,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Cannot Login");
      res.redirect("/");
    });
});

//GET A DISPUTE
router.post("/getdispute", isSuport, (req, res) => {
  const dispute = {
    suport: req.user.id,
  };
  Dispute.findByIdAndUpdate({ _id: req.body.disputeId }, dispute)
    .then(() => {
      req.flash("success_msg", "You have a new Dispute!");
      res.redirect("/suport/disputes");
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Cannot get the Dispute!");
      res.redirect("/suport/disputes");
    });
});

//MY DISPUTES
router.get("/mydisputes", isSuport, (req, res) => {
  const { id, username } = req.user;
  Dispute.find()
    .lean()
    .populate("purchaseId")
    .populate({
      path: "purchaseId",
      populate: { path: "productId", model: "Product" },
    })
    .sort({ data: "desc" })
    .then((disputes) => {
      console.log(
        disputes
          .filter((e) => e.suport === req.user.id)
          .map((e) => ({
            ...e.purchaseId,
            disputeId: e._id,
            disputeStatus: e.status,
            disputeCause: e.message,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse()
      );
      res.render("suport/mydisputes", {
        dispute: disputes
          .filter((e) => e.suport === req.user.id)
          .map((e) => ({
            ...e.purchaseId,
            disputeId: e._id,
            disputeStatus: e.status,
            disputeCause: e.message,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse(),
        id,
        username,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/suport/disputes");
    });
});

//GET A USER
router.get("/user/:id", isSuport, (req, res) => {
  const { id, username } = req.user;
  User.findById({ _id: req.params.id })
    .lean()
    .populate("purchase")
    .then((user) => {
      res.render("suport/getUser", {
        user,
        id,
        username,
        createdAt: new Date(user.createdAt).toLocaleString("en-us"),
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/suport/disputes");
    });
});

//GET USER PURCHASES
router.get("/userpurchases/:id", isSuport, (req, res) => {
  User.findOne({ _id: req.params.id })
    .lean()
    .populate("purchase")
    .populate({
      path: "purchase",
      populate: { path: "productId", model: "Product" },
    })
    .sort({ data: "desc" })
    .then((user) => {
      console.log(user.purchase);
      user.purchase = user.purchase.reverse().map((e) => {
        createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("suport/userPurchases", {
        user,
        purchase: user.purchase,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/suport/disputes");
    });
});

//GET USER DISPUTES
router.get("/userdisputes/:id", isSuport, (req, res) => {
  const { id, username } = req.user;
  User.findOne({ _id: req.params.id })
    .lean()
    .populate({
      path: "disputes",
      populate: {
        path: "purchaseId",
        model: "Purchase",
        populate: { path: "productId", model: "Product" },
      },
    })
    .sort({ data: "desc" })
    .then((user) => {
      user.disputes = user.disputes?.reverse().map((e) => {
        if (user._id == e.winner) {
          e.userWinner = true;
        }

        createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("suport/userDisputes", {
        dispute: user.disputes,
        id,
        username,
        user,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/suport/disputes");
    });
});

module.exports = router;
