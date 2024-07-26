# Express-Mongo

A simple sample CRUD application to test using Keploy build with Express and MongoDB.

## Install Keploy
Install keploy via one-click:-

```bash
curl --silent -O -L https://keploy.io/install.sh && source install.sh
```

## Setup application
Clone the repository and move to express-mongo folder
```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/express-mongoose

# Install the dependencies
npm install
```

### Let's start the MongoDB Instance
```zsh
docker-compose up -d mongo
```

> **Since we have setup our sample-app natively, we need to update the mongoDB host on line 41, in `db/connection.js`, from `mongodb://mongoDb:27017/Students` to `mongodb://127.0.0.1:27017/keploy`.**

### Capture the testcases

```bash
sudo -E env PATH=$PATH keploy record -c 'node src/app.js'
```

#### Let's generate the testcases.
Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy with capture those calls to generate the test-suites containing testcases and data mocks.

```bash
curl --request POST \
--url http://localhost:8000/students \
   --header 'content-type: application/json' \
   --data '{
    "name":"John Do",
    "email":"john@xyiz.com",
    "phone":"0123456799"
    }'
```

we will get the output:

```
Student registration successful!
```

We will get the following output in our terminal

![Testcase](./img/testcase-node.png)

## Running the testcases

```bash
sudo -E env PATH=$PATH keploy test -c 'npm run src/app.js' --delay 10
```

Our testcases will fail as the Keep-Alive connection won't be available when we are using testmode, this happen because in test mode the Keploy uses the `Mocks.yml`, which was generated in the record mode.

![Testcase](./img/testrun-node-fail.png)

Let's add the `connection` and `keep-alive` as the noise in the test-1.yml on line 42 under `header.Date`. The file would look like:-
```
        noise:
        |   - header.Date
        |   - header.Keep-Alive
        |   - header.Connection
```

Now, let's run the keploy in test mode again:-

![Testrun](./img/testrun-node-pass.png)

*Voila!! Our testcases has passed 🌟*

---

# Running sample app using docker

Keploy can be used on Linux & Windows through Docker, and on MacOS by the help of [Colima](https://docs.keploy.io/docs/server/macos/installation/#using-colima).

## Create Keploy Alias
We need create an alias for Keploy:
```bash
alias keploy='sudo docker run --pull always --name keploy-v2 -p 16789:16789 --privileged --pid=host -it -v $(pwd):$(pwd) -w $(pwd) -v /sys/fs/cgroup:/sys/fs/cgroup -v /sys/kernel/debug:/sys/kernel/debug -v /sys/fs/bpf:/sys/fs/bpf -v /var/run/docker.sock:/var/run/docker.sock --rm ghcr.io/keploy/keploy'
```

## Capture the testcases
 
We will run the keploy in record mode with docker-compose to start our application:-
```bash
keploy record -c "docker compose up" --containerName "nodeMongoApp"
```

#### Let's generate the testcases.
Make API Calls using [Hoppscotch](https://hoppscotch.io), [Postman](https://postman.com) or cURL command. Keploy with capture those calls to generate the test-suites containing testcases and data mocks.

```bash
curl --request POST \
--url http://localhost:8000/students \
   --header 'content-type: application/json' \
   --data '{
    "name":"John Doe",
    "email":"john@xyz.com",
    "phone":"0123456798"
    }'
```

we will get the output:

```
Student registration successful!
```

We will get the following output in our terminal

![Testcase](./img/testcase-node.png)


## Running the testcases

```bash
keploy test -c "docker compose up --node-app" --containerName "nodeMongoApp" --delay 10
```

Our testcases will fail as the Keep-Alive connection won't be available when we are using testmode, this happen because in test mode the Keploy uses the `Mocks.yml`, which was generated in the record mode.

![Testcase](./img/testrun-node-fail.png)

Let's add the `connection` and `keep-alive` as the noise in the test-1.yml on line 42 under `header.Date`. The file would look like:-
```
        noise:
        |   - header.Date
        |   - header.Keep-Alive
        |   - header.Connection
```

Now, let's run the keploy in test mode again:-

![Testrun](./img/testrun-node-pass.png)

*Voila!! Our testcases has passed 🌟*

## Create Unit Testcase with Keploy

### Prequiste
AI model API_KEY to use:

- OpenAI's GPT-4o.
- Alternative LLMs via [litellm](https://github.com/BerriAI/litellm?tab=readme-ov-file#quick-start-proxy---cli).

### Setup 

Get API key from [OpenAI](https://platform.openai.com/) or API Key from other LLM

```bash
export API_KEY=<LLM_MODEL_API_KEY>
```

### Generate Unit tests

Let's check the current code coverage of out application : - 

```bash
npm test
```
We got around 31.5% of code coverage.

![Npm Test](./img/node-utg.png?raw=true)

Now, let's run keploy to create testcases.

```bash
keploy gen --sourceFilePath="/home/sonichigi.linux/samples-typescript/express-mongoose/src/routes/routes.js" --testFilePath="/home/sonichigi.linux/samples-typescript/express-mongoose/test/routes.test.js" --testCommand="npm test" --coverageReportPath="/home/sonichigi.linux/samples-typescript/express-mongoose/coverage/cobertura-coverage.xml"
```

With the above command, Keploy will generate new testcases in the our `routes.test.js` and will increase code coverage upto 58%.

![Keploy Mux UTG](./img/node-utg-codecov.png?raw=true)
