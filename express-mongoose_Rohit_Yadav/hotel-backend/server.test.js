const axios = require('axios');

test('View Bookings - Success', async () => {
  const response = await axios.get('http://localhost:3000/bookings/view', {
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      roomNumber: "1",
      roomType: "A",
      startTime: "2024-03-07T00:00:00Z", // Adjust startTime and endTime if necessary
      endTime: "2024-03-08T00:00:00Z"
    }
  });

  expect(response.status).toBe(200);
  expect(response.data.bookings.length).toBeGreaterThan(0); // Adjusted expectation
});


 

test('Book a Room - Success', async () => {
  const requestBody = {
    userEmail: "test1@eexample.com",
    roomNumber: "13",
    roomType: "A",
    startTime: "2024-04-23T08:00:00Z",
    endTime: "2024-04-23T10:00:00Z"
  };

  const response = await axios.post('http://localhost:3000/bookings/book', requestBody, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  expect(response.status).toBe(201);
  expect(response.data.message).toEqual("Room booked successfully");
});
