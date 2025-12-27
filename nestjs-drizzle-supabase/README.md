# NestJs + Drizzle  +Supabase

Tech Stack -

1. NestJs
2. Postgres
3. Supabase
4. Drizzle

This is a sample application built with **NestJs**, **Drizzle ORM**, and **Supabase (Postgres)**, integrated with [Keploy](https://keploy.io) for automated test case and mock generation.

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, Install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

### To install the dependencies

```bash
npm install
```

Create a .env file
.env requires `DATABASE_URL` for the db ( we have used Postgres)

### Setup Drizzle Migration

```bash
npm run generate
```

### Start the app

```bash
npm run start
```

### To run tests(about 80% of test coverage until now)

```bash
npm run test:cov
```

### Postman Collection of routes

https://dark-sunset-197753.postman.co/workspace/My-Workspace~8503974e-6cc0-4f18-8a0e-1599701fd834/collection/33233997-092cc06c-24ae-40bd-8252-70f74c57abe8?action=share&creator=33233997

### Keploy

Keploy helped generate test cases on various YAML files

```bash
keploy record -c "npm run start"
```

#### Create test cases using

```bash
keploy test -c "npm run start" --delay 10
```
