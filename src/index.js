const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("node:fs");
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const chats_path = "./chats.json";
const base = require(chats_path);
const chats = base.chats;
const helmet = require("helmet");
const fsReadDirRecGen = require("fs-readdir-rec-gen");
const I18n = require("i18n-2");

//MODELS
const Purchase = require("./models/Purchase");
const User = require("./models/User");
const Product = require("./models/Product");
const Dispute = require("./models/Dispute");

//HELPERS
const { isUser } = require("./helpers/verify");
const uploadChat = require("./helpers/uploadImgChat");

//ROUTES
const userRoute = require("./routes/user");
const productRoute = require("./routes/product");
const adminRoute = require("./routes/admin");
const sellerRoute = require("./routes/seller");
const suportRoute = require("./routes/suport");

require("./config/auth")(passport);

dotenv.config();

//CONNECT DATABASE
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("Mongo Connected!");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "bemseguro",
    rolling: true,
    resave: false,
    saveUninitialized: false,
    name: "sessionebay",
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.user = req.user || null;
  res.locals.username = req.user?.username || null;
  res.locals.id = req.user?._id || null;
  res.locals.wallet = req.user?.wallet || null;
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
I18n.expressBind(app, {
  locales: ["en-us", "pt-br", "it-ch", "de"],
});

//ROUTES
app.use("/", userRoute);
app.use("/", productRoute);
app.use("/seller", sellerRoute);
app.use("/admin", adminRoute);
app.use("/suport", suportRoute);

//TEMPLATE ENGINE
app.engine("handlebars", handlebars.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/err", (req, res) => {
  res.render("err");
});

//CHAT
app.get("/chat/:id", isUser, async (req, res) => {
  const purchase = await Purchase.findOne({ _id: req.params.id })
    .lean()
    .populate(["buyer._id", "seller._id", "productId"]);

  if (!purchase) {
    req.flash("error_msg", "Something going wrong");
    return res.redirect("/home");
  }

  const dispute = await Dispute.findOne({ purchaseId: purchase._id }).lean();
  purchase.createdAt = new Date(purchase.createdAt).toLocaleString("en-us");
  purchase.open = purchase.status !== "Pending" ? false : true;

  if (req.user.id === purchase.productId.seller) {
    return res.render("seller/chat", { purchase });
  }
  if (req.user.id === dispute?.suport) {
    return res.render("suport/chat", {
      dispute,
      purchase,
      sellerCreatedAt: purchase.seller._id.createdAt,
      buyerCreatedAt: purchase.buyer._id.createdAt,
    });
  }
  if (req.user.isAdmin) {
    return res.render("admin/chat", {
      dispute,
      purchase,
      sellerCreatedAt: (purchase.seller._id.createdAt = new Date(
        purchase.seller._id.createdAt
      ).toLocaleString("en-us")),
      buyerCreatedAt: (purchase.buyer._id.createdAt = new Date(
        purchase.buyer._id.createdAt
      ).toLocaleString("en-us")),
    });
  }

  res.render("user/chat", { purchase, dispute });
});
app.get("/chat/finish/:id", async (req, res) => {
  console.log("/chat/finish/:id");
  const savePurchase = await Purchase.findOneAndUpdate(
    { _id: req.params.id },
    { status: "Finished" }
  )
    .lean()
    .populate("productId");
  const saveProduct = await Product.findOneAndUpdate(
    { _id: savePurchase.productId._id },
    { $inc: { quantity: -Math.abs(savePurchase.units) } }
  ).lean();

  await User.updateOne(
    { _id: savePurchase.seller._id },
    { $inc: { wallet: savePurchase.total } }
  ).lean();

  if (savePurchase?.error || saveProduct?.error) {
    req.flash("error_msg", "Something going wrong");
    return res.redirect("/home");
  }
  res.redirect(`/purchase/${req.user.id}`);
});
app.get("/chat/cancel/:id", async (req, res) => {
  const save = await Purchase.findOneAndUpdate(
    { _id: req.params.id },
    { status: "Canceled" }
  ).lean();

  await User.updateOne(
    { _id: save.buyer._id },
    { $inc: { wallet: save.total } }
  ).lean();

  if (save?.error) {
    req.flash("error_msg", "Something going wrong");
    return res.redirect("/home");
  }

  res.redirect(`/seller/sells`);
});
app.post("/chat/resolved/:id", async (req, res) => {
  const erros = [];

  if (
    !req.body.winner ||
    typeof req.body.winner == undefined ||
    req.body.winner == null
  ) {
    erros.push({ text: "Select a winner!" });
  }
  if (erros.length > 0) {
    console.log(erros);
    req.flash("error_msg", "Can't resolve the dispute!");
    res.redirect("/suport/mydisputes");
  } else {
    const resolvedDispute = await Dispute.findOneAndUpdate(
      { _id: req.params.id },
      { winner: req.body.winner, status: "Finished" }
    ).lean();

    req.flash("success_msg", "Dispute Resolved!");
    res.redirect("/suport/mydisputes");

    if (req.body.winner == resolvedDispute.buyer) {
      await Purchase.findOneAndUpdate(
        { _id: req.body.purchase },
        { status: "Finished" }
      ).lean();
    } else {
      await Purchase.findOneAndUpdate(
        { _id: req.body.purchase },
        { status: "Canceled" }
      ).lean();
    }

    if (resolvedDispute?.error) {
      req.flash("error_msg", "Something going wrong");
      return res.redirect("/suport/disputes");
    }
  }
});

//DELETING FILES WITH +1 MONTH
const oneMonth = ((d) => {
  d.setMonth(d.getMonth() - 1);
  return d;
})(new Date());
function filtrarPorExtensao(fileName) {
  return fileName.endsWith(".png", ".jpg");
}

//UPLOAD IMAGE CHAT
app.post(
  "/chat/:id/uploadimg",
  isUser,
  uploadChat.single("image"),
  (req, res) => {
    res.status(200).json({ file: req.file.filename });
  }
);

//SOCKET IO
io.on("connection", (socket) => {
  socket.on("chat message", (purchase, msg) => {
    if (!purchase) return;
    if (!chats[purchase]) chats[purchase] = { msgs: [], users_in_chat: [] };
    chats[purchase].msgs.push(msg);
    fs.writeFileSync(
      chats_path,
      JSON.stringify(base),
      (err) => err && console.log(err)
    );

    console.log(chats[purchase]);
    const userId = chats[purchase]?.users_in_chat.find(
      (e) => e.socket_id === socket.id
    );

    io.to(purchase).emit("chat message", msg, userId);
  });

  socket.on("chat image", (purchase, img) => {
    if (!purchase) return;
    if (!chats[purchase]) chats[purchase] = { msgs: [], users_in_chat: [] };
    chats[purchase].msgs.push("/chat/" + img);
    fs.writeFileSync(
      chats_path,
      JSON.stringify(base),
      (err) => err && console.log(err)
    );

    io.to(purchase).emit("chat image", img);
  });

  socket.on("join", (purchase, userId, callback) => {
    if (!purchase || !userId) return callback({ error: true });
    socket.join(purchase);

    if (!chats[purchase]) chats[purchase] = { msgs: [], users_in_chat: [] };
    const exists = chats[purchase]?.users_in_chat.find((e) => e.id === userId);
    if (!exists)
      chats[purchase]?.users_in_chat.push({ id: userId, socket_id: socket.id });

    callback({ error: false, msgs: chats[purchase]?.msgs || [] });
  });

  socket.on(
    "new cause",
    async (purchase, userId, msgCause, sellerId, callback) => {
      if (!msgCause || msgCause === "") {
        return callback({ error: true });
      }

      const purchaseValid = await Purchase.findOne({ _id: purchase }).lean();
      console.log(purchaseValid);
      const erros = [];

      if (purchaseValid.haveDispute) {
        erros.push({ text: "Dispute already exist" });
      }
      console.log(purchaseValid.haveDispute);
      if (erros.length > 0) {
        return callback({ error: true, message: "Dispute already exist" });
      } else {
        const dispute = await new Dispute({
          buyer: userId,
          seller: sellerId,
          purchaseId: purchase,
          message: msgCause,
        }).save();
        if (!dispute) {
          return callback({ error: true, message: "dispute save error" });
        }

        const purchaseNow = await Purchase.findOneAndUpdate(
          { _id: purchase },
          { haveDispute: true }
        ).lean();
        console.log(purchaseNow);
        if (!purchaseNow) {
          return callback({ error: true, message: "purchase save error" });
        }

        const user = await User.findOneAndUpdate(
          { _id: userId },
          { $push: { disputes: dispute._id } }
        ).lean();
        if (!user) {
          return callback({ error: true, message: "user save error" });
        }
        callback({ error: false });
      }
    }
  );
});

//SERVIDOR
server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on url ${process.env.SERVER_URL}`)
);
