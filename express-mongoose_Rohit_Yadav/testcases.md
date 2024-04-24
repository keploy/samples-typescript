#   Test Case 1: Book a Room

```javascript

pm.test("Book a Room - Success", function () {
    pm.sendRequest({
        url: 'http://your-api-url/book',
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                userEmail: "test@example.com",
                roomNumber: "101",
                roomType: "single",
                startTime: "2024-04-23T08:00:00Z",
                endTime: "2024-04-23T10:00:00Z"
            })
        }
    }, function (err, res) {
        pm.expect(res).to.have.status(201);
        pm.expect(res.json().message).to.eql("Room booked successfully");
    });
});

```

#   Test Case 2: Edit a Booking

```bash
pm.test("Edit a Booking - Success", function () {
    pm.sendRequest({
        url: 'http://your-api-url/edit/<booking_id>',
        method: 'PUT',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                userEmail: "new_email@example.com",
                roomNumber: "101",
                startTime: "2024-04-23T09:00:00Z",
                endTime: "2024-04-23T11:00:00Z"
            })
        }
    }, function (err, res) {
        pm.expect(res).to.have.status(200);
        pm.expect(res.json().message).to.eql("Booking updated successfully");
    });
});
```

#  Test Case 3: Cancel a Booking

```bash
pm.test("Cancel a Booking - Success", function () {
    pm.sendRequest({
        url: 'http://your-api-url/cancel/<booking_id>',
        method: 'DELETE',
        header: {
            'Content-Type': 'application/json'
        }
    }, function (err, res) {
        pm.expect(res).to.have.status(200);
        pm.expect(res.json().message).to.eql("Booking cancelled successfully");
    });
});

```
#  Test Case 4: View Bookings


```bash
pm.test("View Bookings - Success", function () {
    pm.sendRequest({
        url: 'http://your-api-url/view',
        method: 'GET',
        header: {
            'Content-Type': 'application/json'
        },
        params: {
            roomNumber: "101",
            roomType: "single",
            startTime: "2024-04-23T00:00:00Z",
            endTime: "2024-04-24T00:00:00Z"
        }
    }, function (err, res) {
        pm.expect(res).to.have.status(200);
        pm.expect(res.json().bookings.length).to.be.above(0); // Assuming there are bookings for the specified criteria
    });
});
```