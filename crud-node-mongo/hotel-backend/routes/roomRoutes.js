/* eslint-disable no-undef */
// routes/roomRoutes.js

const express = require('express');
const router = express.Router();
const { Room, Booking } = require('../models/bookingModels');


const roomsData = [];
for (let i = 1; i <= 100; i++) {
    roomsData.push(
        { roomNumber: `${i}`, roomType: 'A', pricePerHour: 100 },
        { roomNumber: `${i}`, roomType: 'B', pricePerHour: 80 },
        { roomNumber: `${i}`, roomType: 'C', pricePerHour: 50 }
    );
}


// Route to insert sample room and booking data
router.post('/insert', async (req, res) => {
  try {
    // Sample room data to insert
    // const roomsData = [
    //   { roomNumber: '101', roomType: 'A', pricePerHour: 100 },
    //   { roomNumber: '102', roomType: 'A', pricePerHour: 100 },
    //   { roomNumber: '201', roomType: 'B', pricePerHour: 80 },
    //   { roomNumber: '202', roomType: 'B', pricePerHour: 80 },
    //   { roomNumber: '203', roomType: 'B', pricePerHour: 80 },
    //   { roomNumber: '301', roomType: 'C', pricePerHour: 50 },
    //   { roomNumber: '302', roomType: 'C', pricePerHour: 50 },
    //   { roomNumber: '303', roomType: 'C', pricePerHour: 50 },
    //   { roomNumber: '304', roomType: 'C', pricePerHour: 50 },
    //   { roomNumber: '305', roomType: 'C', pricePerHour: 50 }
    // ];

    // Insert sample room data into the database
    const insertedRooms = await Room.insertMany(roomsData);
    console.log("rooms inserted")

    // Sample booking data to insert
    const bookingsData = [
        { userEmail: 'user1@example.com', roomNumber: '101', startTime: new Date('2024-03-07T10:00:00.000Z'), endTime: new Date('2024-03-07T12:00:00.000Z') },
        { userEmail: 'user2@example.com', roomNumber: '201', startTime: new Date('2024-03-08T13:00:00.000Z'), endTime: new Date('2024-03-08T15:00:00.000Z') },
        { userEmail: 'user3@example.com', roomNumber: '102', startTime: new Date('2024-03-09T09:00:00.000Z'), endTime: new Date('2024-03-09T11:00:00.000Z') },
        { userEmail: 'user4@example.com', roomNumber: '202', startTime: new Date('2024-03-10T14:00:00.000Z'), endTime: new Date('2024-03-10T16:00:00.000Z') },
        { userEmail: 'user5@example.com', roomNumber: '203', startTime: new Date('2024-03-11T11:00:00.000Z'), endTime: new Date('2024-03-11T13:00:00.000Z') },
        { userEmail: 'user6@example.com', roomNumber: '301', startTime: new Date('2024-03-12T12:00:00.000Z'), endTime: new Date('2024-03-12T14:00:00.000Z') },
        { userEmail: 'user7@example.com', roomNumber: '302', startTime: new Date('2024-03-13T08:00:00.000Z'), endTime: new Date('2024-03-13T10:00:00.000Z') },
        { userEmail: 'user8@example.com', roomNumber: '303', startTime: new Date('2024-03-14T15:00:00.000Z'), endTime: new Date('2024-03-14T17:00:00.000Z') },
        { userEmail: 'user9@example.com', roomNumber: '304', startTime: new Date('2024-03-15T10:00:00.000Z'), endTime: new Date('2024-03-15T12:00:00.000Z') },
        { userEmail: 'user10@example.com', roomNumber: '305', startTime: new Date('2024-03-16T13:00:00.000Z'), endTime: new Date('2024-03-16T15:00:00.000Z') },
        { userEmail: 'user11@example.com', roomNumber: '101', startTime: new Date('2024-03-17T09:00:00.000Z'), endTime: new Date('2024-03-17T11:00:00.000Z') },
        { userEmail: 'user12@example.com', roomNumber: '201', startTime: new Date('2024-03-18T14:00:00.000Z'), endTime: new Date('2024-03-18T16:00:00.000Z') },
        { userEmail: 'user13@example.com', roomNumber: '102', startTime: new Date('2024-03-19T11:00:00.000Z'), endTime: new Date('2024-03-19T13:00:00.000Z') },
        { userEmail: 'user14@example.com', roomNumber: '202', startTime: new Date('2024-03-20T12:00:00.000Z'), endTime: new Date('2024-03-20T14:00:00.000Z') },
        { userEmail: 'user15@example.com', roomNumber: '203', startTime: new Date('2024-03-21T08:00:00.000Z'), endTime: new Date('2024-03-21T10:00:00.000Z') },
        { userEmail: 'user16@example.com', roomNumber: '301', startTime: new Date('2024-03-22T15:00:00.000Z'), endTime: new Date('2024-03-22T17:00:00.000Z') },
        { userEmail: 'user17@example.com', roomNumber: '302', startTime: new Date('2024-03-23T09:00:00.000Z'), endTime: new Date('2024-03-23T11:00:00.000Z') },
        { userEmail: 'user18@example.com', roomNumber: '303', startTime: new Date('2024-03-24T14:00:00.000Z'), endTime: new Date('2024-03-24T16:00:00.000Z') },
        { userEmail: 'user19@example.com', roomNumber: '304', startTime: new Date('2024-03-25T11:00:00.000Z'), endTime: new Date('2024-03-25T13:00:00.000Z') },
        { userEmail: 'user20@example.com', roomNumber: '305', startTime: new Date('2024-03-26T12:00:00.000Z'), endTime: new Date('2024-03-26T14:00:00.000Z') }
      ];
      

    // Insert sample booking data into the database
    // const insertedBookings = await Booking.insertMany(bookingsData);

    // res.status(201).json({ message: 'Sample room and booking data inserted successfully', rooms: insertedRooms, bookings: insertedBookings });
    res.status(201).json({ message: 'Sample room and booking data inserted successfully', rooms: insertedRooms });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to delete all rooms and bookings
router.delete('/delete', async (req, res) => {
    try {
      await Room.deleteMany({});
      await Booking.deleteMany({});
      res.status(200).json({ message: 'All rooms and bookings deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;
