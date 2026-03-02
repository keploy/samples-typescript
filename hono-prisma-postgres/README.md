# Hono - Prisma - Postgres Sample Application

This is a simple Todo application built using **Hono**, **Prisma**, **PostgreSQL**, **JWT**, and **TypeScript**. The project also integrates with **Keploy** for recording and running test cases. The package manager used is **Bun**.

## Features

- User authentication with JWT
- CRUD operations for Todo items
- API testing with Keploy
- Docker support for containerized deployment

## Tech Stack

- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Language**: TypeScript
- **Package Manager**: Bun
- **Containerization**: Docker

## API Endpoints

### Auth Routes

- GET / - Test response
- POST /register - Register a new user
- POST /login - Log in a user

### Protected Todo Routes (require authentication)

- POST /todos - Create a new todo
- GET /todos - Retrieve all todos
- PUT /todos - Update a todo
- DELETE /todos - Delete a todo

## Setup Instructions

There are two ways to run this application:

### Method 1: Local Development

#### Prerequisites

- Node.js (with Bun installed)
- PostgreSQL installed and running
- Prisma CLI installed globally (npm install -g prisma)
- Keploy installed (Follow [documentation](https://keploy.io/docs/server/installation/) for installation)

#### Steps to Run

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**

   ```bash
   bun install
   ```

3. **Setup .env**
   Create a .env file and add your Postgres database url:

   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/my_pgserver?schema=public"
   ```

4. **Setup Database**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run the Application**
   ```bash
   bun dev
   ```

### Method 2: Docker Deployment

#### Prerequisites

- Docker installed
- Docker Compose v2 installed
- Keploy installed

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

#### Steps to Run

1. **Create Docker Network**

   ```bash
   docker network create keploy-network
   ```

   > **Note:** While this network should be created automatically during installation, this command ensures it exists.

2. **Start the Application**

   ```bash
   docker compose up --build
   ```

## Keploy Integration

Keploy allows you to record and test API requests and responses. There are two methods to use Keploy with this project:

### Method 1: Local Testing

1. **Recording Test Cases**

   ```bash
   keploy record -c "bun dev"
   ```

2. **Running Test Cases**
   ```bash
   keploy test -c "bun dev" --delay 10
   ```

### Method 2: Docker-based Testing

1. **Recording Test Cases**

   ```bash
   keploy record -c "docker compose up" --container-name "hono-prisma-postgres" -n "keploy-network"
   ```

2. **Running Test Cases**
   ```bash
   keploy test -c "docker compose up" --container-name "hono-prisma-postgres" -n "keploy-network"
   ```

## Notes

- Ensure your database is properly configured in the prisma.schema file and the environment variables are set.
- Use the authMiddleware to protect routes requiring user authentication.
- For CORS support, the application includes:
  ```typescript
  app.use("/*", cors());
  ```

## Common Issues

### PrismaClientInitializationError with Keploy Recording

When running Keploy record command with database interactions, you might encounter a PrismaClientInitializationError. This often occurs due to SSL connection issues with PostgreSQL.

#### Symptoms

When executing the Keploy record command, you might encounter database connectivity issues, particularly when making API calls that interact with the database. The PostgreSQL logs typically show SSL-related errors like:

```
2024-12-25 13:42:23.035 IST [123887] [unknown]@[unknown] LOG: could not accept SSL connection: EOF detected
2024-12-25 14:41:45.859 IST [172605] [unknown]@[unknown] LOG: could not accept SSL connection: EOF detected
```

#### Resolution (Ubuntu/Linux)

1. **Access PostgreSQL Configuration**

   ```bash
   sudo nano /etc/postgresql/12/main/postgresql.conf
   ```

2. **Modify SSL Settings**

   - Locate the SSL configuration line
   - Change ssl = on to ssl = off

3. **Restart PostgreSQL**
   ```bash
   sudo service postgresql restart
   ```

#### Important Security Note

⚠️ Disabling SSL should only be done in development environments. For production deployments:

- Keep SSL enabled
- Properly configure SSL certificates
- Follow security best practices for database connections

#### Additional Considerations

- Make sure your database connection string in .env is properly configured
- If you're using a different PostgreSQL version, the configuration file path might vary
- Always backup your configuration files before making changes
