const request = require('supertest');
const { app, mongoConnection ,Course} = require('../app');
const mongoose = require("mongoose");

beforeAll(async () => {
  await mongoConnection();
});

// After running the tests, close the MongoDB connection
afterAll(async () => {
  await mongoose.connection.close();
});


describe("Courses API", () => {
  // Test case for getting all courses
  it("should get all courses", async () => {

    const res = await request(app).get("/courses").expect(200);

    expect(res.body).toHaveProperty('courses');
    expect(Array.isArray(res.body.courses)).toBe(true)

  })

  // Test case for creating a course
  it("should create a new course", async () => {
    const newCourse = {
      title: "New Course",
      description: "Description of the new course",
      price: 99.99,
      published: true
    };
    const res = await request(app)
      .post("/courses")
      .send(newCourse)
      .expect(200);

    expect(res.body).toHaveProperty("message", "Course created successfully");
    expect(res.body).toHaveProperty('courseId');
  });


  // Test case for updating an existing course
it("should update an existing course", async () => {
  const existingCourse = await Course.findOne({ title: "Test Course" });
  const updatedCourseData = {
    description: "Updated description",
    price: 200,
    published: false
  };

  const res = await request(app)
    .put(`/courses/${existingCourse._id}`)
    .send(updatedCourseData)
    .expect(200);

  expect(res.body).toHaveProperty("message", "Course updated successfully");

  // Fetch the updated course from the database and verify its updated properties
  const updatedCourse = await Course.findById(existingCourse._id);
  expect(updatedCourse.description).toBe(updatedCourseData.description);

});


})
