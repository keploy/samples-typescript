const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller.js");
const { validateProduct } = require("../middlewares/validation.middleware.js");
const { sanitizeInput } = require("../middlewares/sanitization.middleware.js");
const { authenticate } = require("../middlewares/auth.middleware.js");

// Get all products
router.get("/", authenticate, getProducts);

// Get a single product by ID
router.get("/:id", authenticate, getProduct);

// create a new product
router.post(
  "/",
  authenticate,
  sanitizeInput,
  validateProduct("create"),
  createProduct
);

// update a product
router.put(
  "/:id",
  authenticate,
  sanitizeInput,
  validateProduct("update"),
  updateProduct
);

// delete a product
router.delete("/:id", authenticate, deleteProduct);

module.exports = router;
