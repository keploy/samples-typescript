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

it('should return a list of all students', async () => {
    const mockStudents = [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ];
  
    Student.find.mockResolvedValue(mockStudents);
  
    const response = await request(app).get('/students');
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockStudents);
  });


it('should return a 400 status and error message when an error occurs', async () => {
    const errorMessage = 'Database error';
    Student.find.mockRejectedValue(new Error(errorMessage));
  
    const response = await request(app).get('/students');
  
    expect(response.status).toBe(400);
    expect(response.text).toBe(`Failed to fetch student data as Error: ${errorMessage}`);
  });


it('should successfully register a new student', async () => {
    const newStudent = { name: 'John', email: 'john@example.com' };
  
    Student.prototype.save.mockResolvedValue(newStudent);
  
    const response = await request(app).post('/students').send(newStudent);
  
    expect(response.status).toBe(201);
    expect(response.text).toBe('Student registration successful!');
  });


it('should update student details', async () => {
    const updatedStudent = { name: 'John', email: 'john.updated@example.com' };
    const studentId = '12345';
  
    Student.findByIdAndUpdate.mockResolvedValue(updatedStudent);
  
    const response = await request(app).patch(`/student/${studentId}`).send(updatedStudent);
  
    expect(response.status).toBe(200);
    expect(response.text).toBe(`Student detail updated to \n ${updatedStudent}`);
  });


it('should return a 400 status and error message when registration fails', async () => {
    const newStudent = { name: 'John', email: 'john@example.com' };
    const errorMessage = 'Registration error';
    Student.prototype.save.mockRejectedValue(new Error(errorMessage));
  
    const response = await request(app).post('/students').send(newStudent);
  
    expect(response.status).toBe(400);
    expect(response.text).toBe(`Failed to register Student as Error: ${errorMessage}`);
  });

});