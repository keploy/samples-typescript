const express = require("express");

const app = express();

app.get("/get", (req, res) => {
  res.send("this route will manage get requests from the mysql database.");
});

app.get("/update", (req, res) => {
  res.send("this route will manage update requests from the mysql database.");
});

app.get("/delete", (req, res) => {
  res.send("this route will manage delete requests from the mysql database.");
});

app.get("/create", (req, res) => {
  res.send("this route will manage create requests from the mysql database.");
});

app.listen(3000, () => {
  console.log("hello world!");
});
