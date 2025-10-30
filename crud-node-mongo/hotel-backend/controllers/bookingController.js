// controllers/bookingController.js

const { Booking, Room } = require("../models/bookingModels");

// Book a room
exports.bookRoom = async (req, res) => {
  try {
    const { userEmail, roomNumber, roomType, startTime, endTime } = req.body;
    // Convert start time and end time to Date objects
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    const existingRoom = await Room.findOne({ roomNumber, roomType });
    // console.log(startTimeDate)

    if (!existingRoom) {
      // alert("Room Already Booked");
      console.log("help");
      return res.status(400).json({ message: "Invalid Room Details" });
    }
    // console.log("here");

    // Check if room is available
    const existingBooking = await Booking.findOne({
      roomNumber,
      $or: [
      {
        startTime: { $lt: endTimeDate },//This will cover all the overlap cases.
        endTime: { $gt: startTimeDate },
      }
    ]
    });

    if (existingBooking) {
      // console.log("hello");
      return res
        .status(400)
        .json({ message: "Room is not available for the specified time slot" });
    }

    // Calculate duration and price
    const duration = (endTimeDate - startTimeDate) / (1000 * 60 * 60); // Convert to hours
    const room = existingBooking;//this unnesessary and wasiting database time and resources
    const totalPrice = duration * room.pricePerHour;

    // Create new booking
    const booking = new Booking({
      userEmail,
      roomNumber,
      roomType,
      startTime: startTimeDate,
      endTime: endTimeDate,
      totalPrice,
    });

    await booking.save();

    res.status(201).json({ message: "Room booked successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Edit a booking
// controllers/bookingController.js

exports.editBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { userEmail, roomNumber, startTime, endTime } = req.body;

    // Find the existing booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Convert start time and end time to Date objects
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    // Check if the new time slot is available
    const existingBooking = await Booking.findOne({
      roomNumber,
      _id: { $ne: bookingId },
      $or: [
        { startTime: { $lt: endTimeDate }, endTime: { $gt: startTimeDate } },
        { startTime: { $gte: startTimeDate, $lt: endTimeDate } },
        { endTime: { $lte: endTimeDate, $gt: startTimeDate } },
      ],
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "Room is not available for the specified time slot" });
    }

    // Calculate duration and price
    const duration = (endTimeDate - startTimeDate) / (1000 * 60 * 60); // Convert to hours
    const room = await Room.findOne({ roomNumber });
    const totalPrice = duration * room.pricePerHour;

    // Update booking details
    booking.userEmail = userEmail;
    booking.roomNumber = roomNumber;
    booking.startTime = startTimeDate;
    booking.endTime = endTimeDate;
    booking.totalPrice = totalPrice;

    await booking.save();

    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Calculate time difference in milliseconds
    const currentTime = new Date();
    const timeDifference = booking.startTime - currentTime;

    // Define cancellation policy thresholds
    const within24Hours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const within48Hours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

    let refundAmount = 0;

    if (timeDifference > within48Hours) {
      // Full refund if more than 48 hours left
      refundAmount = booking.totalPrice;
    } else if (timeDifference > within24Hours) {
      // 50% refund if between 24 and 48 hours left
      refundAmount = booking.totalPrice / 2;
    }

    // Update booking status and refund amount
    booking.status = "cancelled";
    booking.refundAmount = refundAmount;

    await booking.save();// You're updating the booking's status to "cancelled" and adding a refundAmount, but then you're deleting that booking from the database right after.**

    res
      .status(200)
      .json({ message: "Booking cancelled successfully", refundAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// View all bookings
// controllers/bookingController.js

exports.viewBookings = async (req, res) => {
  try {
    const { roomNumber, roomType, startTime, endTime } = req.query;

    // Construct query object based on provided filters
    const query = {};
    if (roomNumber) {
      query.roomNumber = roomNumber;
    }
    if (roomType) {
      query.roomType = roomType;
    }
    if (startTime && endTime) {
      // Convert startTime and endTime strings to Date objects
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      query.startTime = { $gte: startDateTime, $lte: endDateTime };
    }

    //  Exclude cancelled bookings by default
    query.status = { $ne: "cancelled" };

    // Find bookings based on filters
    const bookings = await Booking.find(query);

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Report a booking
// controllers/bookingController.js
exports.reportBooking = async (req, res) => {
  try{
    const bookingId = req.params.id;
    const {reason} = req.body;

    const booking = await Booking.findbyIdAndUpdate(
      bookingId,
      { isReported: true, reportReason: reason },
      { new: true}
    );
    if(!booking){
      return res.status(404).json({message: "Booking not found"})
    }
      res.status(200).json({message:"Booking reported",booking});
  }
    catch(err){
      res.status(500).json({message: "Error reporting booking",error: err.message});
    }
  }

  //Get all reported bookings
  exports.getReportedBookings = async (req, res) =>{
    try{
      const reported = await Booking.find({ isReported: true});
      res.status(200).json(reported);
    } catch(err) {
      res.status(500).json({message: "Error fetching reports",error: err.message});
    }
  }
