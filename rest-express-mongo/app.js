const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/model");
const User = require("./models/users");
const auth = require("./authentication");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");
const morgan = require("morgan");

const app = express();


// Middleware setup
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public')); 

// Database connection
mongoose.set('strictQuery', false);
const db = "mongodb://localhost:27017/local";

mongoose.connect(db)
  .then((res) => {
    app.listen(3000);
    logger.info("Connected to MongoDB");
    logger.info("Server listening on port 3000");
  })
  .catch((err) => logger.error("MongoDB connection error:", err));

app.set("view engine", "ejs");

// Routes - Maintaining your original structure with added logging
app.get("/signup", (req, res) => {
  logger.debug("Rendering signup page");
  res.render("signup");
});

app.post("/signup", auth.signIn);

app.get("/login", (req, res) => {
  logger.debug("Rendering login page");
  res.render("login");
});

app.post("/login", auth.logIn);

app.get("/logout", auth.logout);

app.get("*", auth.checkUser);

// Home route 
app.get("/", auth.showNotes);

// Note creation
app.post("/", (req, res) => {
  logger.debug("Creating new note");
  const note = new Note(req.body);
  note.save()
    .then((result) => {
      logger.info("Note created successfully");
      res.redirect("/");
    })
    .catch((err) => {
      logger.error("Note creation error:", err);
      console.log(err); 
    });
});

// New note page 
app.get("/note", function (req, res) {
  logger.debug("New note page request");
  res.render("note");
});

// Individual note
app.get("/note/:id", (req, res) => {
  const id = req.params.id;
  logger.debug(`Fetching note with ID: ${id}`);
  Note.findById(id)
    .then((result) => {
      logger.debug("Note found, rendering individual view");
      res.render("indi", { result });
    })
    .catch((err) => {
      logger.error("Error fetching note:", err);
      console.log(err); 
    });
});

// Delete note 
app.delete("/:id", (req, res) => {
  const id = req.params.id;
  logger.debug(`Deleting note with ID: ${id}`);
  Note.findByIdAndDelete(id)
    .then((result) => {
      logger.info("Note deleted successfully");
      res.json({ redirect: "/" });
    })
    .catch((err) => {
      logger.error("Note deletion error:", err);
      console.log(err); // Keeping your original error handling
    });
});

// 404 handler 
app.use((req, res) => {
  logger.warn(`404 - Not Found: ${req.originalUrl}`);
  res.render("error");
});

// Error handler middleware - new addition to catch any unhandled errors
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).render('error');
});