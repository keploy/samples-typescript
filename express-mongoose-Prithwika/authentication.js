const { append } = require("express/lib/response");
const jwt = require("jsonwebtoken");
const User = require("./models/users");
const Note = require("./models/model");

module.exports.createToken = (id) => {
  return jwt.sign({ id }, "MONKE", { expiresIn: 24 * 60 * 60 });
};

module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "MONKE", async (err, decToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.redirect("/signup");
  }
};

//to get the username of the current user........
module.exports.showNotes = (req, res) => {
  const token = req.cookies.jwt;
  jwt.verify(token, "MONKE", async (err, decoded) => {
    if (err) {
      res.redirect("/login");
    } else {
      const user = await User.findById(decoded.id);
      Note.find({ username: user.username })
        .then((result) => {
          res.render("index", { result });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

module.exports.signIn = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.create({ username, password });
    const token = createToken(user._id);
    res.cookie("jwt", token, { expiresIn: 24 * 60 * 60 * 1000 });
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/signup");
  }
};
module.exports.logIn = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.login(username, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, { expiresIn: 24 * 60 * 60 * 1000 });
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

module.exports.logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/login");
};
