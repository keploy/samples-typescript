# Sample app with Bun.js and MongoDB

This is a sample app to test Keploy integration capabilities using [Bun.js](https://bun.sh) and MongoDB.

## Prerequisite

We first need to install bun.js.

```bash
# Bun.js is supported on macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash
```

## Setup app

Now that we have bun installed, we will setup our application

```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/bun-mongo

# Install the dependencies
bun install
```

# Using Keploy

There are two ways to use Keploy:-

1. [Natively on Linux/WSL](#natively-on-ubuntuwsl)
2. [Using Docker](#running-sample-app-using-docker)

## Natively on Ubuntu/WSL

Keploy can be installed on Linux directly and on Windows with the help of WSL. Based on your system architecture, install the keploy latest binary release from here:-

#### Linux

1. AMD Architecture

```bash
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz" | tar xz -C /tmp

sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin && keploy --version
```

<details>
<Summary> 2. ARM Architecture </Summary>

```bash
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_arm64.tar.gz" | tar xz -C /tmp

sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin && keploy --version
```

</details>

#### Windows Subsystem for Linux (WSL)

On Windows, WSL is required to run Keploy Binary. You must be running Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11 to use the commands below.

```bash
wsl --install
```

Once installed download and Install "Keploy Binary" :

```bash
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz" | tar xz -C /tmp

sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin && keploy --version
```

### Let's start the MongoDB Instance

```bash
docker-compose up -d mongo
```

> **Since we have setup our sample-app natively, we need to update the mongoDB host on line 41, in `supabun.ts`, from `mongodb://mongoDb-bun:27017/keploy` to `mongodb://localhost:27017/keploy`.**

### Capture the testcases

```bash
sudo -E env PATH=$PATH keploy record -c 'bun run supabun.ts'
```

Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy will capture those calls to generate the test-suites containing testcases and data mocks.

1. Generate the testcases

```bash
curl --request POST localhost:4200/save
```

we will get the output:

```
{"success":true}
```

1. Fetch the data

```json
curl --request GET localhost:4200/fetch
```

this will provide us with the output:-
```
{"success":{"_id":"6513cfec0bc1a17a36c06337","name":"Cow","sound":"Moo","__v":0}}
```
We will get the following output in our terminal

![Testcase](./img/testcase-bun.png)

---

# Running sample app using docker

Keploy can be used on Linux & Windows through Docker, and on MacOS by the help of [Colima](https://docs.keploy.io/docs/server/macos/installation/#using-colima).

## Create Network (if it doesn't already exist)

This creates a new docker network isolated from others (named keploy-network)

```bash
docker network create keploy-network
```

## Create Keploy Alias

Now, we need create an alias for Keploy:

```bash
alias keploy='sudo docker run --pull always --name keploy-v2 --network keploy-network -p 16789:16789 --privileged --pid=host -it -v $(pwd):$(pwd) -w $(pwd) -v /sys/fs/cgroup:/sys/fs/cgroup -v /sys/kernel/debug:/sys/kernel/debug -v /sys/fs/bpf:/sys/fs/bpf -v /var/run/docker.sock:/var/run/docker.sock --rm ghcr.io/keploy/keploy'
```

## Let's start the MongoDB Instance

```bash
docker-compose up -d
```

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

## Capture the testcases

1. We first need to build dockerimage of our application:-

```bash
docker build -t bun-app:1.0 .
```

1. Now we will run the keploy in record mode:-

```bash
keploy record -c "docker run -p 4200:4200 --name bunMongoApp --network keploy-network bun-app:1.0"
```

### Let's generate the testcases.

Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy will capture those calls to generate the test-suites containing testcases and data mocks.

```bash
curl --request POST localhost:4200/save
```

we will get the output:

```
{"success": true}
```

2. Fetch the data

```bash
curl --request GET localhost:4200/fetch
```

this will provide us with the output:-

```
{"success": {"_id":"6513cfec0bc1a17a36c06337","name":"Cow","sound":"Moo","__v":0}}
```

We will get the following output in our terminal

![Testcase](./img/testcase-bun.png)

# Running the testcases

This is a Work-in-Progress(WIP) and depends on this issue by oven/bun & elysia:- https://github.com/elysiajs/elysia/issues/231
