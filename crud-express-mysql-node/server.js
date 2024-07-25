// Require modules
const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

// Config dotenv
dotenv.config();

// Initialise body parser
app.use(bodyParser.json());

// Initialise expressJS
const app = express();

// ENV variables for initialising database.
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost", // default host is set to 'localhost'
  user: process.env.MYSQL_USER || "user", // default user is set to 'user'
  password: process.env.MYSQL_PASSWORD || "password", // default password is set to 'password'
  database: process.env.MYSQL_DATABASE || "mysql_db", // default database is set to 'mysql_db'
};

// Initialise MySQL
const connection = mysql.createConnection(dbConfig);

// Establish connection for MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log("MySQL connection established.");
});

// Route for getting all the items from DB.
app.get("/get", (req, res) => {
  connection.query(`SELECT * FROM my_table`, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Route for updating items in DB.
app.put("/update/:id", (req, res) => {
  res.send("this route will manage update requests from the mysql database.");
});

// Route for deleting records in DB.
app.delete("/delete/:id", (req, res) => {
  res.send("this route will manage delete requests from the mysql database.");
});

// Route for adding items to DB.
app.post("/create", (req, res) => {
  const { name, age } = req.body;

  // Check if all the params are given or not, if not, then return error.
  if (!name || !age) {
    return res.status(400).json({ message: "Name and age are required" });
  }

  // Insert all the values in the table if all params are provided.
  connection.query(
    `INSERT INTO my_table (name, age) VALUES(?, ?)`,
    [name, age],
    (err, result) => {
      if (err) throw err;
      res.json({ message: "Values inserted successfully.", result });
    }
  );
});

// Default port is '3000' unless specified in the `.env` file.
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`listening at port ${port}`);
});
