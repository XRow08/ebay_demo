const User = require("../models/User");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const Deposit = require("../models/Deposit");

const router = require("express").Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const { isUser } = require("../helpers/verify");
const uuidEreg = /^[a-f\d]{24}$/i;
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 4,
  message: "too many requests!",
  standardHeaders: true,
  legacyHeaders: false,
});

//REGISTER
router.get("/add", (req, res) => {
  res.render("register");
});
router.post("/register", (req, res) => {
  var erros = [];
  if (
    !req.body.password ||
    typeof req.body.password == undefined ||
    req.body.password == null ||
    !req.body.username ||
    typeof req.body.username == undefined ||
    req.body.username == null
  ) {
    erros.push({ text: "Incorrect pass or user" });
  }
  if (req.body.password2 == null || req.body.password2 != req.body.password) {
    erros.push({ text: "The passes don't match" });
  }
  if (req.body.password.length < 6) {
    erros.push({ text: "Password must be at least 6 characters long!" });
  }
  if (erros.length > 0) {
    res.render("register", { erros: erros });
  } else {
    User.findOne({ username: req.body.username })
      .then((user) => {
        if (user) {
          req.flash("error_msg", "Choose another username!");
          res.redirect("/add");
        } else {
          const newUser = new User({
            username: req.body.username,
            password: req.body.password,
          });
          //Criptografando
          bcrypt.genSalt(10, (erro, salt) => {
            bcrypt.hash(newUser.password, salt, (erro, hash) => {
              if (erro) {
                req.flash("error_msg", "Cannot save User!");
                res.redirect("/add");
              }
              newUser.password = hash;

              newUser
                .save()
                .then(() => {
                  req.flash("success_msg", "User created!");
                  res.redirect("/");
                })
                .catch((err) => {
                  req.flash("error_msg", "Something Goes Wrong!");
                  res.redirect("/add");
                });
            });
          });
        }
      })
      .catch((err) => {
        req.flash("error_msg", "Error");
        res.redirect("/add");
      });
  }
});

//LOGIN
router.get("/", (req, res) => {
  if (req.query.fail) {
    req.flash("error_msg", "Username or password incorrect!");
    return res.redirect("/");
  } else {
    res.render("login", { error: res.json.send });
  }
});
router.post(
  "/login",
  apiLimiter,
  passport.authenticate("local", {
    successRedirect: "/shop",
    failureRedirect: "/?fail=true",
  })
);

//LOGOUT
router.get("/logout", function (req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//DASHBOARD
router.get("/dashboard/:id", isUser, async (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  const user = await User.findById({ _id: req.params.id }).lean();
  res.render("user/dashBoard");
});

//GET USER
router.get("/profile/:id", isUser, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
    //throw new Error('Id invalido')
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .then((user) => {
      res.render("user/profile", { user });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong, try again");
      res.redirect("/home");
    });
});

//EDIT USER
router.get("/profile/edit/:id", isUser, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .then((user) => {
      res.render("user/editprofile", {
        user,
        username: req.user.username,
        id: req.user.id,
      });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong, try again");
      res.redirect("/home");
    });
});

//UPDATE USER
router.post("/changepassword", isUser, (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const { id: userID } = req.user;
  let erros = [];
  //Check required fields
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    erros.push({ text: "Please fill in all fields." });
  }

  //Check passwords match
  if (newPassword !== confirmNewPassword) {
    erros.push({ text: "New passwords do not match." });
  }

  //Check perrosassword length
  if (newPassword.length < 6 || confirmNewPassword.length < 6) {
    erros.push({ text: "Password should be at least six characters." });
  }

  if (erros.length > 0) {
    res.render("user/editprofile", { erros: erros });
  } else {
    //VALIDATION PASSED
    //Ensure current password submitted matches
    User.findOne({ _id: userID }).then((user) => {
      //encrypt newly submitted password
      bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          //Update password for user with new password
          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newPassword, salt, (err, hash) => {
              if (err) throw err;
              user.password = hash;
              user.save();
            })
          );
          req.flash("success_msg", "Password successfully updated!");
          res.redirect("/home");
        } else {
          //Password does not match
          errors.push({ msg: "Current password is not a match." });
          res.render("user/editprofile", { erros: erros });
        }
      });
    });
  }
});

//ADD SOCIAL
router.get("/profile/addsocial/:id", isUser, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  const { username, id, wallet } = req.user;
  User.findOne({ _id: req.params.id })
    .lean()
    .then((user) => {
      res.render("user/addsocialprofile", { user, username, id, wallet });
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong, try again");
      res.redirect("/home");
    });
});

//POST SOCIAL
router.post("/addsocial/:id", isUser, async (req, res) => {
  var erros = [];
  if (
    !req.body.telegram ||
    typeof req.body.telegram == undefined ||
    req.body.telegram == null
  ) {
    erros.push({ text: "Need a Telegram number" });
  }
  if (
    !req.body.whatsapp ||
    typeof req.body.whatsapp == undefined ||
    req.body.whatsapp == null
  ) {
    erros.push({ text: "Need a WhatsApp number" });
  }
  if (erros.length > 0) {
    res.render("user/addsocialprofile", { erros });
  } else {
    if (!uuidEreg.test(req.params.id)) {
      res.status(406).json({ erro: "Id invalido" });
    }
    const { telegram, whatsapp } = req.body;

    const social = {
      Telegram: telegram,
      Whatsapp: whatsapp,
    };

    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { social }
    ).lean();
    console.log(user);
    if (user.err) {
      req.flash("error_msg", "Something going Wrong, try again!");
    }
    req.flash("success_msg", "Socials created!");
    res.redirect(`/profile/${req.user.id}`);
  }
});

//GET ALL PRODUCTS
router.get("/shop", isUser, (req, res) => {
  Product.find({ quantity: { $ne: 0 } })
    .lean()
    .sort({ data: "desc" })
    .then((products) => {
      if (req.user.isAdmin) {
        return res.redirect("/admin/dashboard");
      }

      if (req.user.isSuport) {
        return res.redirect("/suport/disputes");
      }

      if (req.user.isSeller) {
        return res.redirect("/seller/dashboard");
      }
      res.render("user/shop", {
        product: products
          .map((e) => {
            e.timeToSell = Number((e.timeToSell / 60 / 60 / 1000).toFixed(2));
            return e;
          })
          .reverse(),
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Dont listing the products");
    });
});

//PRODUCT
router.get("/product/:id", isUser, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  Product.findOne({ _id: req.params.id })
    .lean()
    .then((product) => {
      res.render("user/product", {
        product: {
          ...product,
          timeToSell: Number((product.timeToSell / 60 / 60 / 1000).toFixed(2)),
        },
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Something going wrong, try again");
      res.redirect("/home");
    });
});

//USER PURCHASES
router.get("/purchase/:id", isUser, async (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  const user = await User.findById({ _id: req.params.id })
    .lean()
    .populate("purchase");
  const purchases = await Purchase.find({ _id: { $in: user.purchase } })
    .lean()
    .populate("productId");
  res.render("user/purchase", {
    purchase: user.purchase,
    purchases: purchases
      .map((e) => ({
        ...e.productId,
        haveDispute: e.haveDispute,
        total: e.total,
        units: e.units,
        purchaseId: e._id,
        purchaseStatus: e.status,
        timeToSell: Number(
          (e.productId.timeToSell / 60 / 60 / 1000).toFixed(2)
        ),
        createdAt: new Date(e.createdAt).toLocaleString("en-us"),
      }))
      .reverse(),
  });
});

//POST PURCHASES
router.post("/addPurchase", isUser, async (req, res) => {
  const { product, sellerId, buyerId, units } = req.body;
  const seller = await User.findOne({ _id: sellerId }).lean();
  const buyer = await User.findOne({ _id: buyerId }).lean();

  Product.findById({ _id: product })
    .lean()
    .then((productPurchase) => {
      if (productPurchase.price * units > buyer.wallet) {
        req.flash("error_msg", "Insufficient funds!");
        return res.redirect("/product/" + product);
      }

      const newPurchase = {
        total: productPurchase.price * units,
        productId: product,
        seller: { username: seller.username, _id: seller._id },
        buyer: { username: buyer.username, _id: buyer._id },
        timeToSell: Date.now() + productPurchase.timeToSell,
        units,
      };
      console.log("newPurchase: ", newPurchase);
      new Purchase(newPurchase)
        .save()
        .then((purchaseSave) => {
          User.findByIdAndUpdate(
            { _id: buyerId },
            {
              $push: { purchase: purchaseSave },
              $inc: { wallet: -Math.abs(newPurchase.total) },
            },
            { upsert: true, new: true }
          )
            .lean()
            .then(() => {
              console.log("err");
              res.redirect(`/chat/${purchaseSave._id}`);
            })
            .catch((err) => {
              console.log(err);
              req.flash("error_msg", "Something going wrong, try again");
              res.redirect("/shop");
            });
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Something going wrong, try again");
          res.redirect("/shop");
        });
    })
    .catch((err) => console.log("err catch addPurchase", err));
});

//USER DEPOSITS
router.get("/deposit/:id", isUser, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  User.findOne({ _id: req.params.id })
    .lean()
    .populate({ path: "deposit" })
    .then((user) => {
      user.deposit = user.deposit.map((e) => {
        e.createdAt = new Date(e.createdAt).toLocaleString("en-us");
        return e;
      });
      res.render("user/deposit", {
        deposits: user.deposit,
      });
    })
    .catch((err) => {
      console.log("erro >>>>>>>>>", err);
      req.flash("error_msg", "Err to load Deposits!");
      res.redirect("/home");
    });
});

//POST DEPOSITS
router.post("/deposit", isUser, (req, res) => {
  const { id, username, total } = req.body;
  let erros = [];

  if (!total || !username || !id) {
    erros.push({ text: "Please fill the quantity!" });
  }

  if (erros.length > 0) {
    req.flash("error_msg", "Please fill the quantity!");
    res.redirect(`/dashboard/${id}`);
  } else {
    const newDeposit = {
      total: total,
      userUsername: username,
    };
    console.log("newDeposit: ", newDeposit);
    new Deposit(newDeposit)
      .save()
      .then((depositSave) => {
        User.findByIdAndUpdate(
          { _id: id },
          {
            $push: { deposit: depositSave },
            $inc: { wallet: newDeposit.total },
          },
          { upsert: true, new: true }
        )
          .lean()
          .then(() => {
            req.flash("success_msg", "Deposit solicited!");
            res.redirect(`/dashboard/${id}`);
          })
          .catch((err) => {
            console.log(err);
            req.flash("error_msg", "Something going wrong, try again");
            res.redirect(`/dashboard/${id}`);
          });
      })
      .catch((err) => {
        console.log(err);
        req.flash("error_msg", "Something going wrong, try again");
        res.redirect(`/dashboard/${id}`);
      });
  }
});

module.exports = router;
