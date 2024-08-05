# ts-nHost

A sample App using Typescript and using nhost.io as Backend as a service

## Setup application

1. Clone and Install packages

```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/ts-nhost

# Install the dependencies
npm install
```

2. Create a `.env` file which should contain `HASURA_ADMIN_SECRET` and `GRAPHQL_ENDPOINT` (as mentioned in ts-nhost/sample.env)

### Prequistes

1. -> Go to https://nhost.io/
2. -> Sign Up/Sign In and create new project
3. -> Go to Hasura Console and open Hasura
4. -> Get the x-hasura-admin-secret and GraphQL Endpoint and name them as HASURA_ADMIN_SECRET and GRAPHQL_ENDPOINT respectively in .env

## Installing Keploy

Let's get started by setting up the Keploy alias with this command:

```sh
curl -O https://raw.githubusercontent.com/keploy/keploy/main/keploy.sh && source keploy.sh
```

## Using Keploy :

There are 2 ways you can run this sample application.

1. [Natively on Linux/WSL](#natively-on-ubuntuwsl)
2. [Using Docker](#running-sample-app-using-docker)

# Natively on Ubuntu/WSL

<!--
1. **Install required packages:**

   ```sh
   sudo apt-get install -y --no-install-recommends ca-certificates curl
   ```

   This command installs necessary packages without additional recommended packages.

2. **Download CA certificate:**

   ```sh
   curl -o ca.crt https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/ca.crt
   ```

   This command downloads the CA certificate to `ca.crt`.

3. **Download setup script:**

   ```sh
   curl -o setup_ca.sh https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/setup_ca.sh
   ```

   This command downloads the setup script to `setup_ca.sh`.

4. **Make the setup script executable:**

   ```sh
   chmod +x setup_ca.sh
   ```

   This command changes the permissions of `setup_ca.sh` to make it executable.

5. **Run the setup script:**
   ```sh
   source ./setup_ca.sh
   ```
   This command executes the setup script in the current shell.

   -->

## Capture the test cases

1. **Start recording tests:**
   ```bash
   sudo -E env "PATH=$PATH" keploy record -c 'ts-node src/app.ts'
   ```

## Let's Generate the test cases

Make API Calls using Hoppscotch, Postman or cURL command. Keploy will capture those calls to generate test suites containing test cases and data mocks.

1. Create User
```bash
curl --request POST \
      --url http://localhost:3000/users \
      --header 'Host: localhost:3000' \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --data '{
        "email": "arpit@gmail.com",
        "password": "123456789",
        "locale": "en",
        "displayName": "Arpit"
      }'
```

2. Get User
```bash
    curl --request GET \
      --url http://localhost:3000/users \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --header 'Host: localhost:3000'
```

3. Delete user
```bash
    curl --request DELETE \
      --url http://localhost:3000/users/<ID> \
      --header 'Host: localhost:3000' \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json'
```

Voila we have captured our api calls!

## Running the test cases

Before executing the test cases, please ensure to delete the newly created user and drop the 'todos' table from [nhost](https://nhost.io/) to prevent SQL constraints from affecting the tests.

2. **Run the recorded tests:**

   ```bash
   sudo -E env "PATH=$PATH" keploy test -c 'ts-node src/app.ts' --delay 10
   ```
   _Voila!! Our test cases have passed 🌟_

   <img width="809" alt="image" src="https://github.com/user-attachments/assets/beeff37c-c636-48ed-a513-06db50e60f66">


---

# Running the app using docker

Since we have to setup our app using docker(make sure your docker is running)

## Capture the testcases

We will run the keploy in record mode with docker-compose to start our application:-

```bash
keploy record -c "sudo docker-compose up" --containerName "ts-nhost"

```

#### Let's generate the testcases.

Make API Calls using Hoppscotch, Postman or cURL command. Keploy will capture those calls to generate test suites containing test cases and data mocks.

1. Create User
```bash
curl --request POST \
      --url http://localhost:3000/users \
      --header 'Host: localhost:3000' \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --data '{
        "email": "arpit@gmail.com",
        "password": "123456789",
        "locale": "en",
        "displayName": "Arpit"
      }'
```

2. Get User
```bash
    curl --request GET \
      --url http://localhost:3000/users \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --header 'Host: localhost:3000'
```

3. Delete user
```bash
    curl --request DELETE \
      --url http://localhost:3000/users/<ID> \
      --header 'Host: localhost:3000' \
      --header 'User-Agent: curl/8.6.0' \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json'
```

## Running the testcases
Let's run our captured test cases
```bash
keploy test -c 'sudo docker-compose up' --containerName "ts-nhost" --delay 10
```

_Voila!! Our testcases has passed 🌟_
