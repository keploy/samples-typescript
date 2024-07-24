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
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "user",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "mysql_db",
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
  res.send("this route will manage get requests from the mysql database.");
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
  res.send("this route will manage create requests from the mysql database.");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`listening at port ${port}`);
});
