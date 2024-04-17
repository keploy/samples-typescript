const express = require("express");
const mongoose = require("mongoose");
const productRoute = require("./routes/product.route");
const Product = require("./models/product.models");
require("dotenv").config();
const app = express();

// middlewares
app.use(express.json()); // to pass the json in body
app.use(express.urlencoded({ extended: false })); // to create data using form mode in postman

// routes
app.use("/api/products", productRoute);

// mongo connection
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

app.listen(process.env.PORT, () => {
  console.log("server is running");
});
