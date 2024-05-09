# QuickWrites

The QuickWrites is a simple web application built with Express.js for managing notes with user authentication. Users can sign up, log in, create, view, and delete notes.

## Features

- User authentication: Sign up, log in, and log out functionality with JWT tokens.
- Create, view, and delete notes: Users can create new notes, view their own notes, and delete notes they no longer need.
- Secure authentication: JWT tokens are used for user authentication and authorization.
- Error handling: Proper error handling for authentication failures and other errors.

## Prerequisites

- Node.js installed on your machine
- MongoDB Atlas account or a local MongoDB database.

## Start the server:

`npm start`

## Running test cases in Keploy:

`keploy test -c "CMD_TO_RUN_APP" --delay 10`

## Usage

- Sign up for a new account to get started.
- Log in with your credentials to access your notes.
- Create new notes, view existing ones, and delete notes as needed.
- Log out when you're done.

## Testing

You can run the test suite to ensure the application functions correctly:
`npm test`

### Postman Test Cases

Here are the test cases written for Postman:

1.  **Checks whether the response status code is 200, indicating a successful request**: pm.test("Response should have status 200", function () { pm.response.to.have.status(200); });
2.  . **Checks whether requesting with an unknown user should result in a response with a status code of 500, possibly indicating an internal server error.** pm.test("Unknown user should get a response 500", function () { pm.response.to.have.status(500); });
3.  **Checks whether providing a wrong password results in a response with a status code of 500.** pm.test("Wrong password should have status code 500", function () { pm.response.to.have.status(500); });
