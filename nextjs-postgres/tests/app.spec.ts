import { test, expect } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api/users';  // Application is running on port 3000

test.describe('User API Tests', () => {

    // Test GET request (Fetch all users)
    test('GET /api/users should return a list of all users', async ({ request }) => {
        const response = await request.get(apiUrl);
        expect(response.status()).toBe(200);  // Ensure status code is 200
        const body = await response.json();
        expect(body.users).toBeInstanceOf(Array);
    });
    test('POST /api/users should create a new user', async ({ request }) => {
        const newUser = {
            name: 'John Do',
            email: 'johndoee@xyz.com'
        };
    
        const response = await request.post(apiUrl, {
            data: newUser
        });
    
        expect(response.status()).toBe(200);  // Ensure status code is 200
        const body = await response.json();
        expect(body.users[0]).toHaveProperty('id');  // Check if the first user in the array has an ID
        expect(body.users[0].name).toBe(newUser.name);
        expect(body.users[0].email).toBe(newUser.email);
    });
    

    // Test PUT request (Update an existing user)
    test('PUT /api/users should update an existing user', async ({ request }) => {
        // First, create a new user to update
        const newUser = {
            name: 'Jane Doe',
            email: 'janedoe@example.com'
        };
    
        let response = await request.post(apiUrl, {
            data: newUser
        });
    
        // Check if the POST request was successful
        expect(response.status()).toBe(200); // Ensure status code is 200
        const createdUser = await response.json();
        expect(createdUser.users).toHaveLength(1);
        const userId = createdUser.users[0].id;
    
        // Prepare the updated user data
        const updatedUser = {
            id: userId,
            name: 'John Deo',
            email: 'updated@example.com'
        };
    
        // Make the PUT request to update the user
        response = await request.put(apiUrl, {
            data: updatedUser
        });
    
        // Check if the PUT request was successful
        expect(response.status()).toBe(200);
        const body = await response.json();
    
        // Check if the updated fields match the new values
        expect(body.users[0].name).toBe(updatedUser.name);
        expect(body.users[0].email).toBe(updatedUser.email);
    });    

    // Test DELETE request (Delete a user)
    test('DELETE /api/users should delete a user', async ({ request }) => {
        // First, create a user to delete
        const newUser = {
            name: 'Mark Doe',
            email: 'markdoe@example.com'
        };
    
        let response = await request.post(apiUrl, {
            data: newUser
        });
    
        // Check if the response body is empty or invalid
        if (!response.ok()) {
            console.error('Failed to create user', await response.text());
            expect(response.ok()).toBe(true);  // Fail the test if the response is not OK
        }
    
        const createdUser = await response.json();
        if (!createdUser || !createdUser.users || createdUser.users.length === 0) {
            console.error('Invalid response format:', createdUser);
            throw new Error('Created user response format is invalid');
        }
    
        const userId = createdUser.users[0].id;  // Accessing the ID of the newly created user
    
        // Delete the created user
        response = await request.delete(apiUrl, {
            data: { id: userId }  // Sending the ID of the user to be deleted
        });
    
        // Check if the delete response is valid
        expect(response.status()).toBe(200);  // Ensure status code is 200
        const body = await response.json();
        expect(body.users[0].id).toBe(userId);  // Ensure the correct user is deleted
    });       

});
