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

```bash
 npm install
 npm run build
```

```bash
root@MacBook-Air express-redis % npm run build

> redis-ts@1.0.0 build
> tsc -b
```

### Start the application:
```bash
npm run start
```

```bash
root@MacBook-Air express-redis % npm run start

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


Observe test run results:
Voila!! Our test cases have passed 🌟

### Test the Application using Keploy

```bash
keploy test -c "npm start"
```

Keploy will replay the recorded interactions and validate the responses against the expected results.

```

Voila! 🎉 You have successfully tested the application using Keploy. Keploy also generates coverage reports for the test-suites.