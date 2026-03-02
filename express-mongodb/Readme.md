# CRUD API with Keploy

This is a simple RESTful API for managing products. It provides endpoints for basic CRUD (Create, Read, Update, Delete) operations and is integrated with [Keploy](https://keploy.io) to demonstrate automated test case and mock generation.

---

## Features

- **Create Product**: Add a new product to the database.
- **Read Product**: Retrieve a specific product or list all products.
- **Update Product**: Modify the details of an existing product.
- **Delete Product**: Remove a product from the database.

---

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing product data.
- **Mongoose**: MongoDB object modeling for Node.js.
- **Keploy**: Tool for automated API testing and dependency mocking.

---

## Getting Started

### Prerequisites

- **Node.js** installed on your machine.
- **MongoDB** installed and running locally or via Docker.
- **Keploy Binary** (required to record and run tests).

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

### Installation

1. Clone the Repository

```bash
git clone https://github.com/keploy/samples-typescript
cd samples-typescript/crud-API
```

2. Install Dependencies

```bash
npm install
```

3. Install Keploy(Linux/WSL)

```bash
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz" | tar xz -C /tmp
sudo mkdir -p /usr/local/bin
sudo mv /tmp/keploy /usr/local/bin
keploy --version
```

4. Start MongoDB Instance

Ensure MongoDB is running. If you have Docker, you can start a container:

```bash
docker run -p 27017:27017 --name mongodb -d mongo
```

### Keploy Test Workflow

1. Capture Test Cases (Record Mode)

Run the application through Keploy to capture API calls and generate test suites:

```bash
sudo -E env PATH=$PATH keploy record -c "npm run dev"
```

2. Run Test Cases (Test Mode)

Stop the application and run the recorded tests to verify behavior:

```bash
sudo -E env PATH=$PATH keploy test -c "npm run dev" --delay 10
```

### API Endpoints 

•GET /products — Fetch all products
•GET /products/:id — Fetch a product by ID
•POST /products — Create a new product
•PUT /products/:id — Update a product by ID
•DELETE /products/:id — Delete a product by ID
