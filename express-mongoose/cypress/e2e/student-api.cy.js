/// <reference types="cypress" />

describe('Student API Tests', () => {
    let studentId;
    const baseUrl = 'http://localhost:8000'; // Adjust based on your server URL
  
    beforeEach(() => {
      // Reset state before each test if needed
      cy.request({
        method: 'GET',
        url: `${baseUrl}/students`,
        failOnStatusCode: false
      });
    });
  
    describe('GET Endpoints', () => {
      it('should fetch all students', () => {
        cy.request('GET', `${baseUrl}/students`)
          .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an('array');
          });
      });
  
      it('should fetch student by name and email', () => {
        const queryParams = {
          name: 'John Doe',
          email: 'john@example.com'
        };
  
        cy.request({
          method: 'GET',
          url: `${baseUrl}/student`,
          qs: queryParams
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
        });
      });
  
      it('should fetch student by name parameter', () => {
        const studentName = 'John Doe';
        
        cy.request('GET', `${baseUrl}/student/${studentName}`)
          .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an('array');
          });
      });
    });
  
    describe('POST Endpoints', () => {
      it('should create a new student', () => {
        const newStudent = {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '3939201584'
        };
  
        cy.request('POST', `${baseUrl}/students`, newStudent)
          .then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.eq('Student registration successful!');
          });
      });
  
      it('should fail to create student with invalid data', () => {
        const invalidStudent = {
          // Missing required fields
        };
  
        cy.request({
          method: 'POST',
          url: `${baseUrl}/students`,
          body: invalidStudent,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(400);
        });
      });
  
      it('should make external API post request', () => {
        cy.request('POST', `${baseUrl}/post`)
          .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('data');
          });
      });
    });
  
    describe('PATCH Endpoint', () => {
      beforeEach(() => {
        // Create a test student to update
        const testStudent = {
          name: 'Test Student',
          email: 'test@example.com',
          phone: '3939201524'
        };
  
        cy.request('POST', `${baseUrl}/students`, testStudent)
          .then((response) => {
            expect(response.status).to.eq(201);
          });
      });
  
      it('should update student details', () => {
        // First get a student ID
        cy.request('GET', `${baseUrl}/students`)
          .then((response) => {
            studentId = response.body[0]._id;
            
            const updatedData = {
              name: 'Updated Name',
              email: 'updated@example.com'
            };
  
            cy.request('PATCH', `${baseUrl}/student/${studentId}`, updatedData)
              .then((updateResponse) => {
                expect(updateResponse.status).to.eq(200);
                expect(updateResponse.body).to.include('Student detail updated');
              });
          });
      });
    });
  
    describe('DELETE Endpoint', () => {
      it('should delete a student', () => {
        // First get a student ID
        cy.request('GET', `${baseUrl}/students`)
          .then((response) => {
            studentId = response.body[0]._id;
  
            cy.request('DELETE', `${baseUrl}/student/${studentId}`)
              .then((deleteResponse) => {
                expect(deleteResponse.status).to.eq(200);
                expect(deleteResponse.body).to.include('Deleted student record successfully');
              });
          });
      });
  
      it('should handle deletion of non-existent student', () => {
        const nonExistentId = '507f1f77bcf86cd79943901112345';
        
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/student/${nonExistentId}`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([400, 404, 500]);
          expect(response.body).to.include('Failed to delete Student details');
        });
      });
    });
  
    // Clean up after all tests
    after(() => {
      // Get all students and delete them
      cy.request('GET', `${baseUrl}/students`)
        .then((response) => {
          response.body.forEach(student => {
            cy.request('DELETE', `${baseUrl}/student/${student._id}`);
          });
        });
    });
  
    describe('External API Endpoint', () => {
      it('should fetch external API data', () => {
        cy.request('GET', `${baseUrl}/get`)
          .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.be.an('array');
          });
      });
    });
  });