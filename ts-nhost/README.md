# ts-nHost

A sample App using Typescript and using nhost.io as Backend as a service

## Setup application

1. Clone the repository and move to ts-nhost folder
2. Create a .env file which should contain HASURA_ADMIN_SECRET and GRAPHQL_ENDPOINT(as mentioned in ts-nhost/sample.env)

### Below are the steps to get HASURA_ADMIN_SECRET and GRAPHQL_ENDPOINT

1. -> Go to https://nhost.io/
2. -> Sign Up/Sign In and create new project
3. -> Go to Hasura Console and open Hasura
4. -> Get the x-hasura-admin-secret and GraphQL Endpoint and name them as HASURA_ADMIN_SECRET and GRAPHQL_ENDPOINT respectively in .env

```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/ts-nhost

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

## Let's install certificates

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

## Capture the test cases

1. **Start recording tests:**
   ```bash
   sudo -E env "PATH=$PATH" keploybin record -c 'ts-node src/app.ts'
   ```

## Let's Generate the test cases

Make API Calls using Hoppscotch, Postman or cURL command. Keploy will capture those calls to generate test suites containing test cases and data mocks.

1. Refer to ts-nhost/api.txt to make api calls.

2. **Observe terminal output:**
   Let's go ahead and create a few more test cases for different endpoints!

## Running the test cases

Before executing the test cases, please ensure to delete the newly created user and drop the 'todos' table from [nhost](https://nhost.io/) to prevent SQL constraints from affecting the tests.

1. **Start the application:**

   ```bash
   ts-node src/app.ts
   ```

2. **Run the recorded tests:**

   ```bash
   sudo -E env "PATH=$PATH" keploybin test -c 'ts-node src/app.ts' --delay 10
   ```

3. **Observe test run results:**
   _Voila!! Our test cases have passed 🌟_

---

# Running the app using docker

Since we have to setup our app using docker(make sure your docker is running)

## Create a custom network for Keploy since we are using the Docker

```bash
docker network create keploy-network
```

## Capture the testcases

We will run the keploy in record mode with docker-compose to start our application:-

```bash
keploy record -c "sudo docker-compose up" --containerName "ts-nhost"

```

#### Let's generate the testcases.

Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or curl command. Keploy with capture those calls to generate the test-suites containing testcases and data mocks.

1. Refer to ts-nhost/api.txt to make api calls

## Running the testcases

```bash
keploy test -c 'sudo docker-compose up' --containerName "ts-nhost" --delay 10
```

_Voila!! Our testcases has passed 🌟_