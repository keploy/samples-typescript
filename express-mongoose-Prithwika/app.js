const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/model");
const User = require("./models/users");
const auth = require("./authentication");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//link for database connection
const db =
  "mongodb+srv://prithwikadas:TXN8xEtDsgDb7Xof@cluster0.cqtvl3o.mongodb.net/?retryWrites=true&w=majority";

//connecting to the database
mongoose
  .connect(db)
  .then((res) => {
    app.listen(3000); //after connnecting to the database listen to this port...
  })
  .catch((err) => console.log(err));

app.set("view engine", "ejs");

//...............for signup .........................

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", auth.signIn);

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", auth.logIn);

app.get("/logout", auth.logout);

//.....................end of signup ........................

app.get("*", auth.checkUser);

//for home page
app.get("/", auth.showNotes);
//for posting a new note...
app.post("/", (req, res) => {
  const note = new Note(req.body);
  note
    .save()
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

//for new note
app.get("/note", function (req, res) {
  res.render("note");
});

//get individual notes
app.get("/note/:id", (req, res) => {
  const id = req.params.id;
  Note.findById(id)
    .then((result) => {
      res.render("indi", { result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//delete notes
app.delete("/:id", (req, res) => {
  const id = req.params.id;
  Note.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//for page not found
app.use((req, res) => {
  res.render("error");
});
