# Hono - Drizzle - Postgres Sample Todo Example

This is a simple Todo application built using **Hono**, **Drizzle**, **PostgreSQL**, **JWT**, and **TypeScript**. 

## Features

- User authentication with JWT
- CRUD operations for Todo items
 - Drizzle ORM for fast and efficient database operations

## Tech Stack

- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Authentication**: JWT
- **Language**: TypeScript
- **Package Manager**: NPM

## API Endpoints

The application includes the following API routes:

### Public Routes

- POST /auth/register - Register a new user
- POST /auth/login - Log in a user
- POST /auth/logout - Log out a user

### Protected Routes (require authentication)

- POST /todo/add-todo - Create a new todo
- GET /todo/get-todos - Get all todos of a user
- PUT /todo/toggle-todo-status - Toggle a todo status
- DELETE /todo/delete-todo - Delete a todo



## Setup Instructions


1. **Install dependencies**:
    ```sh
    npm install
    ```

2. **Set up the database**:
    Ensure you have PostgreSQL installed and running. Create a new database and update the database connection settings in the `.env` file.


3. **Generate Drizzle models**:
    ```sh
    npx run db:generate
    ```


4. **Run database migrations**:
    ```sh
    npx run db:migrate
    ```

5. **Start the application**:
    ```sh
    npm run dev
    ```


### Note: 
Scripts like `db:generate` and `db:migrate` are defined in the `package.json` file already for your convenience. You can run them using `npm run <script-name>` as shown above.
