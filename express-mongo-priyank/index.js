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
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
connectDB();

app.listen(process.env.PORT, () => {
  console.log("server is running");
});
// Export the app instance and connectDB function for testing
module.exports = { app, connectDB };
