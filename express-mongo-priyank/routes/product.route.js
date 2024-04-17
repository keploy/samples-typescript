const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getAProduct,
  createAProduct,
  updateAProduct,
  deleteAProduct,
} = require("../controllers/product.controller");

// routes
router.get("/", getAllProducts);
router.get("/:id", getAProduct);
router.post("/create", createAProduct);
router.put("/:id", updateAProduct);
router.delete("/:id", deleteAProduct);

module.exports = router;
