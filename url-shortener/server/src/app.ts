// require("typescript-sdk/dist/integrations/express/register")
import "typescript-sdk/dist/integrations/express/register";
import express from "express";
import config from "config";
import bodyParser from "body-parser";
// import cors from "cors";
import routes from "./routes/routes";
import db from "./db";

process.env.KEPLOY_MODE = "test"

console.log(process.env.KEPLOY_MODE)


async function main() {
  const app = express();
  
  const port = config.get("port") as number;
  // const port = 8080
  
  // let keploy = new Keploy({
  //   name: "typescript-sdk",
  //   host: "0.0.0.0",
  //   port: port,
  //   delay: 5,
  //   timeout: 60,
  //   filter: {},
  // }, {
  //   licenseKey: "",
  //   url: "http://localhost:8081/api",
  // });
  // parse application/json
  app.use(bodyParser.json());
  // app.use(middleware(keploy));

  app.listen(port, "0.0.0.0", () => {
    console.log(`Application listening at http://localhost:${port}`);
    db();
    routes(app);
    app.emit("listening")
    // keploy.create()
  });
}

main().catch(console.log)

