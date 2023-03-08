const router = require("express").Router();
const { isSeller } = require("../helpers/verify");
const uuidEreg = /^[a-f\d]{24}$/i;

const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Withdraw = require("../models/Withdraw");

//DASHBOARD
router.get("/dashboard", isSeller, (req, res) => {
  const { username, id, wallet } = req.user;
  res.render("seller/dashBoard", {
    username,
    id,
    wallet,
  });
});

//SELLS
router.get("/sells", isSeller, async (req, res) => {
  Purchase.find({ "seller._id": req.user.id })
    .lean()
    .populate("productId")
    .then((purchase) => {
      res.render("seller/sells", {
        purchase: purchase
          .map((e) => ({
            ...e.productId,
            purchaseId: e._id,
            haveDispute: e.haveDispute,
            purchaseStatus: e.status,
            buyer: e.buyer?.username,
            units: e.units,
            total: e.total,
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
          }))
          .reverse(),
        purchaseId: purchase._id,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Dont listing the products");
    });
});

//GET ALL SELLER PRODUCTS
router.get("/products", isSeller, (req, res) => {
  Product.find({ seller: req.user.id })
    .lean()
    .then((product) => {
      res.render("seller/products", {
        product: product
          .map((e) => ({
            timeToSell: (e.timeToSell = Number(
              (e.timeToSell / 60 / 60 / 1000).toFixed(2)
            )),
            createdAt: new Date(e.createdAt).toLocaleString("en-us"),
            title: e.title,
            quantity: e.quantity,
            price: e.price,
            _id: e._id,
            image: e.image,
          }))
          .reverse(),
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Dont listing the products");
    });
});

//PROFILE
router.get("/profile/:id", isSeller, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  res.render("seller/profile");
});

//EDIT USER
router.get("/profile/edit/:id", isSeller, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .then(() => {
      res.render("seller/editprofile");
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/seller/dashboard");
    });
});

//USER WITHDRAWS
router.get("/withdraw/:id", isSeller, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .populate({ path: "withdraw" })
    .then((user) => {
      user.withdraw = user.withdraw
        .map((e) => {
          e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
          e.wallet = e.wallet == "Null" ? false : e.wallet;
          e.pixKey = e.pixKey == "Null" ? false : e.pixKey;
          return e;
        })
        .reverse();
      res.render("seller/withdraws", {
        withdraws: user.withdraw,
      });
    })
    .catch((err) => {
      console.log("erro >>>>>>>>>", err);
      req.flash("error_msg", "Err to load Withdraws!");
      res.redirect("/seller/dashboard");
    });
});

//POST WITHDRAWS
router.post("/withdraw", isSeller, (req, res) => {
  const { id, username, wallet, pixKey, total } = req.body;

  if (total <= 0) {
    req.flash("error_msg", "Insufficient funds!");
    return res.redirect(`/seller/dashboard`);
  }

  if (!username || !id || !total) {
    req.flash("error_msg", "Please fill the input!");
    return res.redirect(`/seller/dashboard`);
  }
  const newWithdraw = {
    total: total,
    pixKey: pixKey,
    wallet: wallet,
    userUsername: username,
  };
  console.log("newWithdraw: ", newWithdraw);
  new Withdraw(newWithdraw)
    .save()
    .then((withdrawSave) => {
      User.findByIdAndUpdate(
        { _id: id },
        {
          $push: { withdraw: withdrawSave },
        },
        { upsert: true, new: true }
      )
        .lean()
        .then(() => {
          req.flash("success_msg", "Withdraw solicited");
          res.redirect(`/seller/withdraw/${id}`);
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Something going wrong");
          res.redirect("/seller/dashboard");
        });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/seller/dashboard");
    });
});

module.exports = router;
