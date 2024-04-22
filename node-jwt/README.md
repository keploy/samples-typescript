# Express-Mongo

A simple sample CRUD application to test using Keploy build with Express and MongoDB.

## Setup application
Clone the repository and move to express-mongo folder
```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/node-jwt

# Install the dependencies
npm install
```
# Installing Keploy
Let's get started by setting up the Keploy alias with this command:
```sh
curl -O https://raw.githubusercontent.com/keploy/keploy/main/keploy.sh && source keploy.sh
```
## Using Keploy :

There are 2 ways you can run this sample application.

1. [Natively on Linux/WSL](#natively-on-ubuntuwsl)
2. [Using Docker](#running-sample-app-using-docker)

# Natively on Ubuntu/WSL




## Let's start the Postgres Instance
```zsh
docker-compose up -d
```

## Capture the testcases

```bash
sudo -E env PATH=$PATH keploy record -c 'node app.js'
```

### Let's Generate the testcases.
Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy with capture those calls to generate the test-suites containing testcases and data mocks.

1. Create User

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user",
    "email":"user@keploy.io",
    "password":"1234"
}'
```

we will get the output:

```json
{"message":"User was registered successfully!"}
```

We will get the following output in our terminal

![Testcase](./img/record.png)

Let's go ahead create few more testcases for different endpoints!

2. Create Admin User

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"admin",
    "email":"admin@keploy.io",
    "password":"1234",
    "role":["admin"]
}'
```

we will get the output:

```json
{"message":"User was registered successfully!"}
```

3. User Signin
```bash
curl --location 'http://localhost:8080/api/auth/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user",
    "email":"user@keploy.io",
    "password":"1234"
}'
```

We will get access token once the user has signed in:
```json
{
    "id":1,
    "username":"user",
    "email":"user@keploy.io",
    "roles":["ROLE_USER"],
    "accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzEzNzY0ODY1LCJleHAiOjE3MTM3NjUwNDV9.5LSU1A1jxIbIQFS6Tq26ENNWZBinFt2cJQZ7swpipbc"}
```

4. Access user Content
```sh
curl --location 'http://localhost:8080/api/test/all'
```

We will get:
```
Public Content
```

5. Access user Content
```sh
curl --location 'http://localhost:8080/api/test/user' \
--header 'x-access-token: <TOKEN>'
```

We will get
```
User Content
```
## Running the testcases

```bash
sudo -E env PATH=$PATH keploy test -c 'npm run app.js' --delay 10
```

Our testcases will fail as the Token will generated again when we are using testmode.

![Testcase](./img/test-fail.png)

Let's add the `Etag` and `accessToken` as the noise in the `test-3.yml` on line 45 under `header.Date`. The file would look like:-
```
        noise:
        |   - header.Date
        |   - header.Etag
        |   - body.accessToken
```

Now, let's run the keploy in test mode again:-

![Testrun](./img/test-pass.png)

*Voila!! Our testcases has passed 🌟*

---

# Running sample app using docker

Since we have setup our sample-app using docker, we need to update the postgres host on line 2, in `config/db.config.js`, from `localhost` to `postgres`.

## Capture the testcases
 
We will run the keploy in record mode with docker-compose to start our application:-
```bash
keploy record -c "docker-compose up" --containerName "jwtSqlApp"
```

#### Let's generate the testcases.
Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy with capture those calls to generate the test-suites containing testcases and data mocks.

1. Create User

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user",
    "email":"user@keploy.io",
    "password":"1234"
}'
```

we will get the output:

```json
{"message":"User was registered successfully!"}
```

We will get the following output in our terminal

![Testcase](./img/record.png)

Let's go ahead create few more testcases for different endpoints!

2. Create Admin User

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"admin",
    "email":"admin@keploy.io",
    "password":"1234",
    "role":["admin"]
}'
```

we will get the output:

```json
{"message":"User was registered successfully!"}
```

3. User Signin
```bash
curl --location 'http://localhost:8080/api/auth/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username":"user",
    "email":"user@keploy.io",
    "password":"1234"
}'
```

We will get access token once the user has signed in:
```json
{
    "id":1,
    "username":"user",
    "email":"user@keploy.io",
    "roles":["ROLE_USER"],
    "accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzEzNzY0ODY1LCJleHAiOjE3MTM3NjUwNDV9.5LSU1A1jxIbIQFS6Tq26ENNWZBinFt2cJQZ7swpipbc"}
```

4. Access user Content
```sh
curl --location 'http://localhost:8080/api/test/all'
```

We will get:
```
Public Content
```

5. Access user Content
```sh
curl --location 'http://localhost:8080/api/test/user' \
--header 'x-access-token: <TOKEN>'
```

We will get
```
User Content
```
## Running the testcases

```bash
keploy test -c 'sudo docker-compose up'  --containerName "jwtSqlApp" --delay 10
```

Our testcases will fail as the Token will generated again when we are using testmode.

![Testcase](./img/test-fail.png)

Let's add the `Etag` and `accessToken` as the noise in the `test-3.yml` on line 45 under `header.Date`. The file would look like:-
```
        noise:
        |   - header.Date
        |   - header.Etag
        |   - body.accessToken
```

Now, let's run the keploy in test mode again:-

![Testrun](./img/test-pass.png)

*Voila!! Our testcases has passed 🌟*