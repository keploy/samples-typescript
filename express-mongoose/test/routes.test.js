const request = require('supertest');
const express = require('express');
const router = require('../src/routes/routes'); // Adjust the path to your router file
const Student = require('../src/models/students');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(router);

// Mock Mongoose model
jest.mock('../src/models/students.js');

describe('GET /student/:name', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of students with the given name', async () => {
    const mockStudents = [
      { name: 'John', email: 'john@example.com' },
      { name: 'John', email: 'john.doe@example.com' },
    ];

    Student.find.mockResolvedValue(mockStudents);

    const response = await request(app).get('/student/John');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockStudents);
  });

  it('should return a 400 status and error message when an error occurs', async () => {
    const errorMessage = 'Database error';
    Student.find.mockRejectedValue(new Error(errorMessage));

    const response = await request(app).get('/student/John');

    expect(response.status).toBe(400);
    expect(response.text).toBe(`Failed to fetch student data as Error: ${errorMessage}`);
  });
});