const app = require("./app");
const connectDB = require('./db/connect');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB(process.env.MONGODB_URL);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
