# Node.js API with Large and Small Payloads

This is a simple Node.js server built with Express that provides two API endpoints for testing responses with different payload sizes.

- `/small-payload`: Returns a **10KB** text payload.
- `/large-payload`: Returns a **500KB** text payload.

This project is designed to be used for performance testing, load testing, or for integration with E2E testing tools like Keploy.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

You will need the following software installed on your system:

- **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
- **npm** (Node Package Manager): This is included with the Node.js installation.

### Installation

1.  **Clone the repository** (or download the source code) to your local machine.

2.  **Navigate to the project directory**:
    ```bash
    cd samples-typescript/node-bigpayload
    ```

3.  **Install the dependencies**:
    This command will read the `package.json` file and install the required libraries (like Express).
    ```bash
    npm install
    ```

---

## ▶️ Running and Recording the Application

Once the dependencies are installed, you can start the server with the following command:

```bash

sudo -E env PATH=$PATH usr/local/bin/keploy record -c "node server.js" --bigRequest 

(You can remove --bigRequest to record it for smaller size payloads)

You should see a confirmation message in your terminal indicating that the server is running:

🧑‍💻 Server is running on http://localhost:3000

The API is now live and ready to accept requests.

🧪 Testing the Endpoints
You can use a tool like curl or any API client (like Postman or Insomnia) to test the endpoints.

Small Payload (10KB)
# Make a request to the endpoint
curl http://localhost:3000/small-payload

# Verify the size of the response (should be 10240 bytes)
curl -s http://localhost:3000/small-payload | wc -c

Large Payload (500KB)
# Make a request to the endpoint (output will be large)
curl http://localhost:3000/large-payload

# Verify the size of the response (should be 512000 bytes)
curl -s http://localhost:3000/large-payload | wc -c

```

## Run test using Keploy

```bash
sudo -E env PATH=$PATH usr/local/bin/keploy record -c "node server.js"  &> testlogs.txt
```