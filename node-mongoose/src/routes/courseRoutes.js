const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses
} = require('../controllers/courseController');
const validateCourse = require('../middleware/validateCourse');

// Get all courses with pagination
router.get('/', getAllCourses);

// Search courses
router.get('/search', searchCourses);

// Get a single course
router.get('/:id', getCourse);

// Create a new course
router.post('/', validateCourse, createCourse);

// Update a course
router.put('/:id', validateCourse, updateCourse);

// Delete a course
router.delete('/:id', deleteCourse);

module.exports = router; 