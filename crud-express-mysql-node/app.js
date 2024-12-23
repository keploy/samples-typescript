const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

// Config dotenv
dotenv.config();

// Initialise expressJS
const app = express();

// Initialise body parser
app.use(bodyParser.json());

// ENV variables for initialising database.
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "sample_app",
  port: process.env.MYSQL_PORT || 3307
};

// Initialise MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Function to handle MySQL queries
const queryDatabase = (query, params, res, successMessage) => {
  pool.query(query, params, (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (successMessage) {
      res.json({ message: successMessage, result });
    } else {
      res.json(result);
    }
  });
};

// Route for getting all the items from DB.
app.get("/get", (req, res) => {
  queryDatabase("SELECT * FROM my_table", [], res);
});

// Route for updating items in DB.
app.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { name, age } = req.body;

  if (!name || !age) {
    return res.status(400).json({ message: "Name and age are required" });
  }

  const updateQuery = "UPDATE my_table SET name = ?, age = ? WHERE id = ?";
  queryDatabase(updateQuery, [name, age, id], res, "Record updated successfully.");
});

// Route for deleting records in DB.
app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM my_table WHERE id = ?";
  queryDatabase(deleteQuery, [id], res, "Record deleted successfully.");
});

// Route for adding items to DB.
app.post("/create", (req, res) => {
  const { name, age } = req.body;

  if (!name || !age) {
    return res.status(400).json({ message: "Name and age are required" });
  }

  const insertQuery = "INSERT INTO my_table (name, age) VALUES(?, ?)";
  queryDatabase(insertQuery, [name, age], res, "Values inserted successfully.");
});

module.exports = app;
