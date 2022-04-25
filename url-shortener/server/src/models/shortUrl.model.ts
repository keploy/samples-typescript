
import mongoose, { Document } from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuv0987654321", 6);

export interface ShortURL extends Document {
  shortId: string;
  url: string;
  
}
var random = nanoid();
const schema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    required: true,
    default: random,
  },
  url: { type: String, required: true },
  ts:{
    type: String,
    default: Math.floor(Date.now()/1000).toString(),
  },
  shorturl: {
    type: String,
    // unique: true,
    // required: true,
    default:"http://localhost:8080/" + random,
  },

});

const shortUrl = mongoose.model<ShortURL>("shortUrl", schema);
export default shortUrl