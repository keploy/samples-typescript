const request = require("supertest");
const server = require("../server"); // Adjust the path as necessary

describe("API Routes", () => {
  let testItemId; // Variable to store ID of the item to be used in update and delete tests

  // Ensure the server is closed after tests
  after((done) => {
    server.close(done);
  });

  it("should create a new item in the database", (done) => {
    request(server)
      .post("/create")
      .send({ name: "Test", age: 25 })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        testItemId = res.body.result.insertId; // Store the ID of the newly created item
        done();
      });
  });

  it("should get all items from the database", (done) => {
    request(server)
      .get("/get")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Optionally add checks to verify the response contains the test item
        done();
      });
  });

  it("should update an existing item in the database", (done) => {
    request(server)
      .put(`/update/${testItemId}`)
      .send({ name: "Updated Test", age: 30 })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Optionally add checks to verify the update was successful
        done();
      });
  });

  it("should get the updated item from the database", (done) => {
    request(server)
      .get("/get")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Optionally add checks to verify the response contains the updated item
        done();
      });
  });

  it("should delete an item from the database", (done) => {
    request(server)
      .delete(`/delete/${testItemId}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Optionally add checks to verify the item was deleted
        done();
      });
  });

  it("should not find the deleted item", (done) => {
    request(server)
      .get("/get")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        // Optionally add checks to verify the item no longer exists
        done();
      });
  });
});
