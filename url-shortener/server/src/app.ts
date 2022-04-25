import express from "express";
import config from "config";
import bodyParser from "body-parser";
// import cors from "cors";
import routes from "./routes/routes";
import db from "./db";
import middleware from "typescript-sdk/dist/integerations/express"
import Keploy from "typescript-sdk/dist/src/keploy";

const app = express();


const port = config.get("port") as number;
// const port = 8080

let keploy = new Keploy({
  name: "ts-url-shortner",
  host: "0.0.0.0",
  port: port,
  delay: 5,
  timeout: 60,
  filter: {},
}, {
  licenseKey: "",
  url: "http://localhost:8081/api",
})
// parse application/json
app.use(bodyParser.json());
// app.use(middleware(keploy));

app.listen(port, "0.0.0.0", () => {
  console.log(`Application listening at http://localhost:${port}`);
  db();
  routes(app, keploy);
});