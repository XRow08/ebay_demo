const localStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("../models/User");
const User = mongoose.model("User");

module.exports = (passport) => {
  passport.use(
    new localStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      (username, password, done) => {
        User.findOne({ username: username })
          .lean()
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "Dont exist" });
            }

            bcrypt.compare(password, user.password, (erro, match) => {
              if (match) {
                return done(null, user);
              } else {
                return done(null, false, { message: "Incorrect Password" });
              }
            });
          });
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
