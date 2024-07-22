import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import todoRoutes from "./routes/todoRoutes";
import userRoutes from "./routes/userRoutes";

const app: Application = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/todos", todoRoutes);

app.use("/users", userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is live at Port: ${PORT}🚀`);
});
