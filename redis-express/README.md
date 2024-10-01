# Express Redis Sample

## Overview

This API manages books record, built with Express and Redis. It provides routes to add, update, delete, view books, view books by ID, and change task authors.


## Installation

### Prerequisites

Ensure you have the following installed:

- Docker
- Node.js and npm
- Keploy CLI
# Installing Keploy

Let's get started by setting up the Keploy alias with this command:

```sh
curl -O https://raw.githubusercontent.com/keploy/keploy/main/keploy.sh && source keploy.sh
```

Clone the repository and move to express-redis folder

```bash
git clone https://github.com/keploy/samples-typescript.git
cd samples-typescript/express-redis
```


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


const redisClient = new Redis({

    If running server on docker
    host: 'redis',

    If running server locally
    host: 'localhost'
    port: 6379
});


```bash
 npm install
 npm run build
```


> redis-ts@1.0.0 build
> tsc -b
```

### Start the application:
```bash
npm run start
```

```bash

> redis-ts@1.0.0 start
> node dist/index.js

Server is running on http://localhost:3000
Connected to Redis server
Sample books loaded into Redis
```
Some sample data is automatically created in redis.

### Generate Test Cases


```bash
keploy record -c "npm run start"
```



The above command will start recording the API calls made to the application and will generate a test case in the `testcases/` directory.

> 💡 You can use Postman ,CURL or any other API testing tool to test the API calls.


### Interact with Application

Use Postman,CURL or any other API testing tool to hit your API routes. This interaction will be recorded by Keploy.

Some curl commands to easily test the application are 

1. "http://localhost:3000/books" to retrive the data of the books

```bash
curl --location 'http://localhost:3000/books'
```

2. "http://localhost:3000/books/:id" to retrive the data of a specific book

```bash
curl --location 'http://localhost:3000/books/2'
```

3. "http://localhsot:3000/publish" to publish a own book

```bash
curl --location 'http://localhost:3000/publish' \
--header 'Content-Type: application/json' \
--data '{
    "id":"6",
    "title":"Harry Potter and prisnor of Azkaban",
    "author":"JK Rowling"
}'
```

4. "http://localhsot:3000/books/:id" to delete a book

```bash
curl --location --request DELETE 'http://localhost:3000/books/1'
```

5. "http://localhsot:3000/books/:id" to delete a book

```bash
curl --location --request PUT 'http://localhost:3000/books/6' \
--header 'Content-Type: application/json' \
--data '{
    "title":"Harry Potter and Half Blood Prince",
    "author":"JK Rowling"
}'
```


Observe test run results:
Voila!! Our test cases have passed 🌟

### Test the Application using Keploy

```bash
keploy test -c "npm start"
```

Keploy will replay the recorded interactions and validate the responses against the expected results.

```

Voila! 🎉 You have successfully tested the application using Keploy. Keploy also generates coverage reports for the test-suites.