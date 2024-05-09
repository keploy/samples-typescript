# CRUD API

This is a simple RESTful API for managing products. It provides endpoints for basic CRUD (Create, Read, Update, Delete) operations on products.

## Features

- Create Product: Add a new product to the database.
- Read Product: Retrieve information about a specific product or get a list of all products.
- Update Product: Modify the details of an existing product.
- Delete Product: Remove a product from the database.

## Technologies Used

- Node.js: JavaScript runtime environment.
- Express.js: Web application framework for Node.js.
- MongoDB: NoSQL database for storing product data.
- Mongoose: MongoDB object modeling for Node.js.

## Getting Started

### Prerequisites

- Node.js installed on your machine
- MongoDB installed and running locally or on a remote server

## Installation

1. Clone the repository <br>

```bash
git clone https://github.com/<username>/crud-API.git
```

2. Install dependencies <br>

```bash
cd crud-API
npm install
```

3. Start the server <br>

```bash
npm run dev
```

## Endpoints

- GET /products: Fetch all products.
- GET /products/:id: Fetch a product by ID.
- POST /products: Create a new product.
- PUT /products/:id: Update a product by ID.
- DELETE /products/:id: Delete a product by ID.






