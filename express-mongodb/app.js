require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Product = require("./models/product.model.js");
const productRoute = require("./routes/product.route.js");
const connectDB = require('./db/connect');
const app = express();

// Set up rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per IP
});

// Add rate limiting to all routes
app.use(limiter);

// middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// routes
app.use("/api/products", productRoute);

app.get("/", (req, res) => {
  res.send("Hello from Node API Server Updated");
});

// connectDB(process.env.MONGODB_URL);

module.exports = app;
