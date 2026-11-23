import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  author: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
  },
});

export const Book = mongoose.models.Book || mongoose.model("Book", BookSchema);
