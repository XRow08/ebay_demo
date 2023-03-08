const Product = require("../models/Product");
const router = require("express").Router();
const fs = require("fs");
const { isSeller } = require("../helpers/verify");
const uploadUser = require("../helpers/uploadImg");
const uuidEreg = /^[a-f\d]{24}$/i;

//CREATE
router.get("/seller/addproduct", isSeller, (req, res) => {
  const { username, id, wallet } = req.user;
  res.render("seller/addProduct", { username, id, wallet });
});

//POST CREATE
router.post(
  "/seller/newproduct",
  uploadUser.single("image"),
  isSeller,
  (req, res) => {
    const { username, id, wallet } = req.user;
    var erros = [];

    if (
      !req.body.title ||
      typeof req.body.title == undefined ||
      req.body.title == null ||
      !req.body.desc ||
      typeof req.body.desc == undefined ||
      req.body.desc == null ||
      !req.body.price ||
      typeof req.body.price == undefined ||
      req.body.price == null ||
      !req.body.quantity ||
      typeof req.body.quantity == undefined ||
      req.body.quantity == null ||
      !req.body.timeToSell ||
      typeof req.body.timeToSell == undefined ||
      req.body.timeToSell == null
    ) {
      erros.push({ text: "Missing information" });
    }

    if (erros.length > 0) {
      console.log(erros);
      res.render("seller/addProduct", { erros, username, id, wallet });
    } else {
      const newProduct = {
        title: req.body.title,
        desc: req.body.desc,
        timeToSell: req.body.timeToSell * 60 * 60 * 1000,
        price: req.body.price,
        image: req.file.filename,
        quantity: req.body.quantity,
        seller: req.body.seller,
      };
      console.log(newProduct);
      new Product(newProduct)
        .save()
        .then(() => {
          req.flash("success_msg", "Product created");
          res.redirect("/seller/products");
        })
        .catch((err) => {
          req.flash("error_msg", "Something going wrong");
          res.redirect("/seller/products");
        });
    }
  }
);

//GET PRODUCT TO EDIT
router.get("/seller/editproduct/:id", isSeller, (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  const { username, id, wallet } = req.user;
  Product.findOne({ _id: req.params.id })
    .lean()
    .then((product) => {
      let timeToSell = Number((product.timeToSell / 60 / 60 / 1000).toFixed(2));
      if (timeToSell < 0) timeToSell = 0;
      res.render("seller/editProduct", {
        product: { ...product, timeToSell },
        username,
        id,
        wallet,
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Something going wrong");
      res.redirect("/seller/products");
    });
});

//UPDATE PRODUCT
router.post(
  "/seller/editproduct",
  uploadUser.single("image"),
  isSeller,
  async (req, res) => {
    let oldProduct;
    if (req.body.id) {
      oldProduct = await Product.findById({ _id: req.body.id }).lean();
    }
    const { username, id, wallet } = req.user;
    const erros = [];

    if (
      !req.body.id ||
      !req.body.title ||
      typeof req.body.title == undefined ||
      req.body.title == null ||
      !req.body.desc ||
      typeof req.body.desc == undefined ||
      req.body.desc == null ||
      !req.body.price ||
      typeof req.body.price == undefined ||
      req.body.price == null ||
      !req.body.quantity ||
      typeof req.body.quantity == undefined ||
      req.body.quantity == null
    ) {
      erros.push({ text: "Missing information" });
    }

    if (
      (!oldProduct?.image && !req.file?.filename) ||
      typeof req.file?.filename == undefined ||
      req.file?.filename == null
    ) {
      erros.push({ text: "Send a image!" });
    }

    if (erros.length > 0) {
      res.render("seller/editProduct", {
        erros: erros,
        product,
        username,
        id,
        wallet,
      });
    } else {
      const product = {
        seller: req.body.seller,
        title: req.body.title,
        desc: req.body.desc,
        timeToSell: req.body.timeToSell * 60 * 60 * 1000,
        price: req.body.price,
        image: req.file.filename || oldProduct.image,
        quantity: req.body.quantity,
      };

      Product.findByIdAndUpdate({ _id: req.body.id }, product)
        .then(() => {
          req.flash("success_msg", "Congratulations");
          res.redirect("/seller/products");
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Something going wrong");
          res.redirect("/seller/products");
        });
    }
  }
);

//DELETE PRODUCT
router.post("/seller/delete/:id", isSeller, async (req, res) => {
  if (!uuidEreg.test(req.params.id)) {
    res.status(406).json({ erro: "Id invalido" });
  }
  const product = await Product.findOne({ _id: req.body.id });

  if (!product?.image) {
    console.log("No file received");
  } else {
    try {
      fs.unlinkSync("public//uploads/" + product.image);
    } catch (err) {
      console.log(err);
    }
  }

  Product.deleteOne({ _id: req.params.id })
    .then(() => {
      req.flash("success_msg", "Product deleted with sucess!  ");
      res.redirect("/seller/products");
    })
    .catch((err) => {
      console.log(err);
      req.flash("error_msg", "Something going wrong");
      res.redirect("/seller/products");
    });
});

module.exports = router;
