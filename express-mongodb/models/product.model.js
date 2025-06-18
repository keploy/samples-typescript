const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price cannot be negative"],
      max: [1000000, "Price exceeds maximum allowed value (1,000,000)"],
      set: (v) => Math.round(v * 100) / 100,
    },
    image: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: "Invalid URL format",
      },
    },
    category: {
      type: String,
      enum: ["Electronics", "Clothing", "Food", "Other"],
      default: "Other",
      index: true,
    },
    sku: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: [6, "SKU must be at least 6 characters"],
      maxlength: [20, "SKU cannot exceed 20 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v; // Remove version key
        ret.id = ret._id; // Map _id to id
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Virtual for formatted price
ProductSchema.virtual("formattedPrice").get(function () {
  return `$${this.price.toFixed(2)}`;
});

// Virtual for inventory status
ProductSchema.virtual("inStock").get(function () {
  return this.quantity > 0;
});

// Indexes for frequently queried fields
ProductSchema.index({ name: "text" });
ProductSchema.index({ price: 1 });

// Middleware for data validation
ProductSchema.pre("validate", function (next) {
  if (this.price > 1000 && this.quantity > 1000) {
    this.invalidate(
      "price",
      "High-value products cannot have quantity > 1000",
      this.price
    );
  }
  next();
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
