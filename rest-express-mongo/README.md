# QuickWrites

The QuickWrites is a simple web application built with Express.js for managing notes with user authentication. Users can sign up, log in, create, view, and delete notes.

## Features

- User authentication and authorization using JWT tokens: Sign up, log in, and log out functionality.
- Create, view, and delete notes: Users can create new notes, view their own notes, and delete notes they no longer need.
- Error handling: Proper error handling for authentication failures and other errors.

## Prerequisites

- Node.js >= 18.x
- MongoDB (local or Atlas) with a valid connection URI

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

## Start the server:

```bash
npm start
```

## Running test cases in Keploy:

```bash
sudo -E env PATH=$PATH keploy test -c "npm start" --delay 10
```

## Usage

- Sign up for a new account to get started.
- Log in with your credentials to access your notes.
- Create new notes, view existing ones, and delete notes as needed.
- Log out when you're done.

## Testing

You can run the test suite to ensure the application functions correctly:

```bash
npm test
```
### Postman Test Cases

Here are the test cases written for Postman:

1. Check whether the response status code is 200
pm.test("Response should have status 200", function () {
    pm.response.to.have.status(200);
});

2. Check whether requesting with an unknown user returns 500
pm.test("Unknown user should get a response 500", function () {
    pm.response.to.have.status(500);
});

3. Check whether providing a wrong password returns 500
pm.test("Wrong password should have status code 500", function () {
    pm.response.to.have.status(500);
});
