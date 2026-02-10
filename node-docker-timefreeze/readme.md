Of course. Here is the updated README content, incorporating the instruction to run the `./test_time_endpoint.sh` script.

---

# Node.js JWT Application

This is a simple Node.js application using Express.js to demonstrate JWT authentication and a time-sensitive endpoint.

## Running the Application with Docker

### 1. Build the Docker image

```bash
docker build -t node-jwt-app .
```

### 2. Run the Docker container

```bash
docker run -p 8080:8080 --name my-node-app node-jwt-app
```

### 3. Test the Endpoints

You can test the endpoints using `curl`.

**Test the `/login` endpoint:**

```bash
curl -X POST http://localhost:8080/login
```

**Test the time-sensitive `/check-time` endpoint:**

A helper script is provided to automatically send the current timestamp.

```bash
./test_time_endpoint.sh
```

### 4. Stop and remove the container when done

```bash
docker stop my-node-app
docker rm my-node-app
```

## Testing with Keploy

Keploy can be used to record and replay API calls as tests.

### Record Test Cases

Use the `keploy record` command to capture API calls and generate test cases. While this is running, you can use `curl` or run the `./test_time_endpoint.sh` script to generate tests.

```bash
keploy record -c "docker run -p 8080:8080 --network keploy-network --name my-node-app node-jwt-app" --container-name=my-node-app
```

### Run Recorded Test Cases with Time Freezing

To replay the recorded tests, use the `keploy test` command. The `--freezeTime` flag is essential for testing the `/check-time` endpoint, as it ensures the application's clock is set to the time of the original request, allowing the test to pass reliably.

```bash
keploy test -c "docker run -p 8080:8080 --network keploy-network --name my-node-app node-jwt-app" --container-name=my-node-app --freezeTime
```