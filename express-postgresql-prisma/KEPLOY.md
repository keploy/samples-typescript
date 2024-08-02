# Running Keploy Test Cases

This document provides step-by-step instructions for running Keploy test cases on your Task Management API.

## Prerequisites

Ensure you have the following installed:

- Docker
- Node.js and npm
- Keploy CLI

## Setup PostgreSQL with Docker

1. **Start PostgreSQL Container:**
    ```bash
    docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
    ```

2. **Database Connection String:**
    ```text
    postgresql://postgres:mysecretpassword@localhost:5432/postgres
    ```

## Migrate Database

Run the migration script to set up the database schema:

```bash
npm run migrate-data
```

## Recording Test Cases

**Optional: Build the Project (if there is no build):**
```bash
npm run build
```

1. **Start Keploy Recording:**
    ```bash
    keploy record -c "npm start"
    ```

2. **Interact with the API:**

   Use Postman or Swagger to hit your API routes. This interaction will be recorded by Keploy.

   - **Swagger:** Open `http://localhost:3000/api/docs` and use the available routes.
   - **Postman:** Send requests to the API endpoints as needed.

**Note: Test Data and Configuration:**
After recording the interactions, a `keploy` folder will be created containing the recorded test data. Additionally, a `keploy.yml` file will be created as the configuration file.

## Running Test Cases

1. **Start Keploy Test:**
    ```bash
    keploy test -c "npm start"
    ```

Keploy will replay the recorded interactions and validate the responses against the expected results.
