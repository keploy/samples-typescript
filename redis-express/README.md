
# Express Redis Sample

## Overview

This API manages book records, built with Express and Redis. It provides routes to add, update, delete, view books, view books by ID, and change task authors.

## Installation

### Prerequisites

Ensure you have the following installed:

- Docker
- Node.js and npm
- Keploy CLI

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

# Installing Keploy

Let's get started by setting up the Keploy alias with this command:

```bash
curl --silent -O -L https://keploy.io/install.sh && source install.sh
```

Clone the repository and move to express-redis folder

```bash
git clone https://github.com/keploy/samples-typescript.git
cd samples-typescript/express-redis
```

## Installing Locally

### Install the dependencies

```bash
npm install
```

### Start Redis-server Container

```bash
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

### Load the Samples and build server:

In case of running application natively, we will have to change the host to localhost in index.ts

```bash
const redisClient = new Redis({
```

If running server on docker

```bash
host: 'redis',
```

If running server locally

```bash
host: 'localhost'
port: 6379
```

### Build the application:

```bash
npm install
npm run build
```

### Start the application

Note: Do not start the application manually; Keploy will start it for you during the recording process.

> redis-ts@1.0.0 start
> node dist/index.js

```bash
Server is running on http://localhost:3000
Connected to Redis server
Sample books loaded into Redis
```

Some sample data is automatically created in Redis.

## Using Docker

Make sure you have docker installed.

```bash
git clone https://github.com/keploy/samples-typescript.git
cd samples-typescript/express-redis
docker compose up
```

### Generate Test Cases

For server running locally.

```bash
sudo -E env PATH=$PATH keploy record -c "npm run start"
```

For the docker container.

```bash
keploy record -c "docker compose up" --containerName "redis-express" -n "keploy-network"
```

The above command will start recording the API calls made to the application and will generate a test case in the `testcases/` directory.

> 💡 You can use Postman,CURL or any other API testing tool to test the API calls.

### Interact with Application

Use Postman, CURL, or any other API testing tool to hit your API routes. This interaction will be recorded by Keploy.

Some curl commands to easily test the application are:

1. "http://localhost:3000/books" to retrieve the data of the books

```bash
curl --location 'http://localhost:3000/books'
```

2. "http://localhost:3000/books/:id" to retrieve the data of a specific book

```bash
curl --location 'http://localhost:3000/books/2'
```

3. "http://localhost:3000/publish" to publish a book

```bash
curl --location 'http://localhost:3000/publish' --header 'Content-Type: application/json' --data '{
    "id":"6",
    "title":"Harry Potter and the Prisoner of Azkaban",
    "author":"J.K. Rowling"
}'
```

4. "http://localhost:3000/books/:id" to delete a book

```bash
curl --location --request DELETE 'http://localhost:3000/books/1'
```

5. "http://localhost:3000/books/:id" to update a book

```bash
curl --location --request PUT 'http://localhost:3000/books/6' --header 'Content-Type: application/json' --data '{
    "title":"Harry Potter and the Half-Blood Prince",
    "author":"J.K. Rowling"
}'
```

### Test the Application using Keploy

For server running locally.

```bash
sudo -E env PATH=$PATH keploy test -c "npm run start" --delay 10
```

For the docker container.

```bash
keploy test -c "docker compose up" --container-name "redis-express" -n "keploy-network"
```

Keploy will replay the recorded interactions and validate the responses against the expected results.

Voila!! Our test cases have passed 🌟
