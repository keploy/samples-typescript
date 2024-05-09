// models/bookingModels.js
const mongoose = require("mongoose");

// Define Room schema
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  roomType: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
});

const Room = mongoose.model("Room", roomSchema);

// Define Booking schema
const bookingSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  roomNumber: { type: String, required: true },
  startTime: { type: Date, required: true },  
  roomType : {type : String, required : true},
  endTime: { type: Date, required: true },
  totalPrice: { type: Number, required: false },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = { Booking, Room };
