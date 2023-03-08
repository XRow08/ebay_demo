const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");

const router = require("express").Router();
const { isAdmin } = require("../helpers/verify");
const uuidEreg = /^[a-f\d]{24}$/i;

//ADMIN DASHBOARD
router.get("/dashboard", isAdmin, (req, res) => {
  res.render("admin/dashBoard");
});

//GET ALL USERS
router.get("/users", isAdmin, (req, res) => {
  User.find()
    .lean()
    .then((users) => {
      res.render("admin/users", {
        users: users
          .map((e) => ({
            ...e,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse(),
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET USER PURCHASES
router.get("/user/purchases/:id", isAdmin, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
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
      user.purchase = user.purchase?.reverse().map((e) => {
        e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("admin/userPurchases", {
        user,
        purchase: user.purchase,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET USER DISPUTES
router.get("/user/disputes/:id", isAdmin, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406);
    req.flash("error_msg", "invalid id");
    res.redirect("/admin/users");
  }
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
        e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("admin/userDisputes", {
        dispute: user.disputes,
        user,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET ALL DEPOSITS
router.get("/deposits", isAdmin, (req, res) => {
  Deposit.find()
    .lean()
    .then((deposits) => {
      deposits = deposits.reverse().map((e) => {
        e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("admin/deposits", {
        deposits,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET ALL WITHDRAWS
router.get("/withdraws", isAdmin, (req, res) => {
  Withdraw.find()
    .lean()
    .then((withdraws) => {
      withdraws = withdraws.reverse().map((e) => {
        e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
        e.wallet = e.wallet == "Null" ? false : e.wallet;
        e.pixKey = e.pixKey == "Null" ? false : e.pixKey;
        return e;
      });
      res.render("admin/withdraws", {
        withdraws,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET USER DEPOSITS
router.get("/user/deposits/:id", isAdmin, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).flash({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .populate("deposit")
    .then((user) => {
      res.render("admin/userDeposits", {
        user,
        deposits: user.deposit
          .map((e) => ({
            ...e,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse(),
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//GET USER WITHDRAWS
router.get("/user/withdraw/:id", isAdmin, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).flash({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .populate("withdraw")
    .then((user) => {
      res.render("admin/userWithdraws", {
        user,
        withdraws: user.withdraw
          .map((e) => ({
            ...e,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
            wallet: e.wallet == "Null" ? false : e.wallet,
            pixKey: e.pixKey == "Null" ? false : e.pixKey,
          }))
          .reverse(),
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
    });
});

//PAY ALL SELLERS
router.post("/payment", isAdmin, async (req, res) => {
  const withdraws = await Withdraw.find({ status: "Pending" }).lean();
  console.log(withdraws);
  if (!withdraws) {
    req.flash("error_msg", "Something went wrong");
    return res.redirect("/admin/withdraws");
  }
  for (const withdraw of withdraws) {
    const withdrawUpdated = await Withdraw.updateMany({
      $set: { status: "Finished" },
    }).lean();
    console.log(withdrawUpdated);
    if (!withdrawUpdated) {
      req.flash("error_msg", "Something went wrong");
      return res.redirect("/admin/withdraws");
    }
    const user = await User.findOneAndUpdate(
      { username: withdraw.userUsername },
      { $inc: { wallet: -Math.abs(withdraw.total) } },
      { upsert: true, new: true }
    ).lean();
    console.log(user);
    if (!user) {
      req.flash("error_msg", "Something went wrong");
      return res.redirect("/admin/withdraws");
    }
  }
  req.flash("success_msg", "All done!");
  return res.redirect("/admin/withdraws");
});

module.exports = router;
