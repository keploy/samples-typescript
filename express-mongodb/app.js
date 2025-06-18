require("dotenv").config();

const express = require("express");
const productRoute = require("./routes/product.route.js");
const connectDB = require("./db/connect");
const app = express();
const { generalRateLimiter } = require("./middlewares/rateLimiter.middleware");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(generalRateLimiter);

// routes
app.use("/api/products", productRoute);

app.get("/", (req, res) => {
  res.send("Hello from Node API Server Updated");
});

connectDB(process.env.MONGODB_URL);

module.exports = app;
