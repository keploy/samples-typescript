/* eslint-disable no-undef */
// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Booking routes
router.post("/book", bookingController.bookRoom);
router.put("/edit/:id", bookingController.editBooking);
router.delete("/cancel/:id", bookingController.cancelBooking);
router.get("/view", bookingController.viewBookings);

module.exports = router;
