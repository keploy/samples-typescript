import mongoose from "mongoose";

export async function DB() {
  try {
    await mongoose.connect("");
  } catch (error) {
    console.log("DataBase Error" + error);
  } finally {
    mongoose.disconnect();
  }
}
