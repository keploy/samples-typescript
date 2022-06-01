// require("typescript-sdk/dist/integrations/express/register")
// import "typescript-sdk/dist/integrations/express/register";
import express from "express";
import config from "config";
import bodyParser from "body-parser";
// import cors from "cors";
import routes from "./routes/routes";
import db from "./db";
import Keploy from "typescript-sdk";
import middleware from "typescript-sdk/dist/integrations/express/middleware"

async function main() {
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
  });
  // parse application/json
  app.use(bodyParser.json());
  // @ts-ignore
  // app.use(middleware(() =>  keploy.create().then( x => x)));
  // keploy.create();
  app.use(middleware(keploy));

   app.listen(port, "0.0.0.0", () => {
     console.log(`Application listening at http://localhost:${port}`);
     db();
     routes(app);
     keploy.create()
   });
}

main().catch(console.log)

