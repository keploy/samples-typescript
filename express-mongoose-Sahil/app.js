const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express();


dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())



// MongoDB connection


const mongoConnection=async ()=>{
  try {
    await mongoose.connect(process.env.mongodb_url);

    console.log("connected database");
  }
  catch (err) {
    throw err;
  }
}

mongoConnection()


// schema of our db
const Course = mongoose.model("Course", {
  title: String,
  description: String,
  price: Number,
  published: Boolean,
});



// Create a course 
app.post("/courses", async (req, res) => {

  try {
    const course = new Course(req.body);
    await course.save();
    res.json({ message: "Course created successfully", courseId: course._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }


});

// Read all courses
app.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Read a course by ID
app.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update a course
app.put("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a course
app.delete("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports={app,mongoConnection,Course};