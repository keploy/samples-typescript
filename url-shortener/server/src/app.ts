import express from "express";
import config from "config";
import bodyParser from "body-parser";
// import cors from "cors";
import routes from "./routes/routes";
import db from "./db";

const app = express();


const port = config.get("port") as number;
// const port = 8080

// parse application/json
app.use(bodyParser.json());

app.listen(port, "0.0.0.0", () => {
  console.log(`Application listening at http://localhost:${port}`);
  db();
  routes(app);
});