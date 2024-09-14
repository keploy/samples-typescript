
test('test_get_students_success', async () => {
  const mockStudents = [{ name: 'John Doe', email: 'john@example.com' }];
  Student.find.mockResolvedValue(mockStudents);
  const response = await request(app).get('/students');
  expect(response.status).toBe(200);
  expect(response.body).toEqual(mockStudents);
});

test('test_get_student_by_name_and_email_failure', async () => {
  Student.find.mockRejectedValue(new Error('Database error'));
  const response = await request(app).get('/student?name=Jane Doe&email=jane@example.com');
  expect(response.status).toBe(400);
  expect(response.text).toBe('Failed to fetch student data as Error: Database error');
});

test('test_post_student_success', async () => {
  const newStudent = { name: 'John Doe', email: 'john@example.com' };
  Student.prototype.save = jest.fn().mockResolvedValue(newStudent);
  const response = await request(app).post('/students').send(newStudent);
  expect(response.status).toBe(201);
  expect(response.text).toBe('Student registration successful!');
});

test('test_delete_student_failure', async () => {
  Student.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));
  const response = await request(app).delete('/student/123');
  expect(response.status).toBe(500);
  expect(response.text).toBe('Failed to delete Student details as Error: Database error');
});




