# Task Management API

## Overview

This API manages personal or team tasks, built with Express, PostgreSQL, and Prisma. It provides routes to add, update, delete, view tasks, view tasks by ID, and change task priority.

## Features

- **ORM: Prisma**
- **Database: PostgreSQL**
- **RESTful routes for managing tasks**
- **Validation middleware**
- **Swagger documentation**

## Middlewares

- **validateInputAdd:** Validates input for adding a task.
- **validateInputUpdate:** Validates input for updating a task.
- **validateInputParam:** Validates input parameters (ID).
- **validateInputChangePriority:** Validates input for changing task priority.

## Installation

1. Clone the repository:
    ```bash
    https://github.com/keploy/samples-typescript.git
    cd samples-typescript/express-postgresql-prisma
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    ```bash
    cp .env.example .env
    ```

4. Update the `.env` file with your PostgreSQL connection string:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
    ```

5. Migrate the database:
    ```bash
    npm run generate
    npm run migrate init
    ```

6. Start the server:
    ```bash
    npm run dev
    ```

## API Routes

### - Add Task

- **URL:** `/add`
- **Method:** `POST`
- **Description:** Add a new task.
- **Request Body:**
    ```json
    {
      "title": "Task Title",
      "description": "Task Description",
      "priority": 1
    }
    ```

### - Update Task

- **URL:** `/update/:id`
- **Method:** `PUT`
- **Description:** Update an existing task by ID.
- **Request Params:** `id` (task ID)
- **Request Body:**
    ```json
    {
      "title": "Updated Task Title",
      "description": "Updated Task Description",
      "priority": 2
    }
    ```

### - Delete Task

- **URL:** `/delete/:id`
- **Method:** `DELETE`
- **Description:** Delete a task by ID.
- **Request Params:** `id` (task ID)


### - View All Tasks

- **URL:** `/view`
- **Method:** `GET`
- **Description:** View all tasks.


### - View Task by ID

- **URL:** `/view/:id`
- **Method:** `GET`
- **Description:** View a task by ID.
- **Request Params:** `id` (task ID)


### - Change Task Priority

- **URL:** `/change-priority/:id`
- **Method:** `PUT`
- **Description:** Change the priority of a task by ID.
- **Request Params:** `id` (task ID)
- **Request Body:**
    ```json
    {
      "priority": 3
    }
    ```
