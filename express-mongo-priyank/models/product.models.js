const mongoose = require("mongoose");
const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please enter your name"],
    },
    quantity: {
      type: String,
      required: false,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timeStamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
