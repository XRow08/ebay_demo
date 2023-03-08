module.exports = {
  isAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin == true) {
      return next();
    }
    req.flash("error_msg", "You are not a admin");
    res.redirect("/err");
  },
  isSeller: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isSeller == true) {
      return next();
    }
    req.flash("error_msg", "You have to be a seller");
    res.redirect("javascript:history.back()");
  },
  isSuport: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isSuport == true) {
      return next();
    }
    req.flash("error_msg", "You are not a suport");
    res.redirect("/err");
  },
  isUser: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "You have to be logged");
    res.redirect("/err");
  },
};
