const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
const mongoConnection = async () => {
  try {
    await mongoose.connect(process.env.mongodb_url);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

mongoConnection();

// Course Schema
const Course = mongoose.model("Course", {
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  published: { type: Boolean, default: false },
});

// Helper: Validate request body
function validateCourseInput(course) {
  const { title, price } = course;
  if (!title || typeof title !== "string") {
    return "Title is required and must be a string.";
  }
  if (price === undefined || typeof price !== "number") {
    return "Price is required and must be a number.";
  }
  return null;
}

// Create a course
app.post("/courses", async (req, res) => {
  const validationError = validateCourseInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json({ message: "Course created successfully", courseId: course._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses
app.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get course by ID
app.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ course });
  } catch (error) {
    res.status(400).json({ error: "Invalid course ID format" });
  }
});

// Update a course
app.put("/courses/:id", async (req, res) => {
  const validationError = validateCourseInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(400).json({ error: "Invalid course ID format" });
  }
});

// Delete a course
app.delete("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Invalid course ID format" });
  }
});

module.exports = { app, mongoConnection, Course };
