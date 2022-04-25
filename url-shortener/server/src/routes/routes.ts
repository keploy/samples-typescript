import { Express, Request, Response } from "express";
import middleware from "typescript-sdk/dist/integerations/express";
import Keploy from "typescript-sdk/dist/src/keploy";
import {
  createShortUrl,
  handleRedirect,

  // getShortUrl,
} from "../controller/shortUrl.controller";
import validateResourse from "../middleware/validateResourse";
import shortUrlSchema from "../schema/createShortUrl.schema";

function routes(app: Express, keploy: Keploy) {
  app.get("/healthcheck", (req: Request, res: Response) => {
    return res.send("App is healthy");
  });

  app.post("/url", middleware(keploy),validateResourse(shortUrlSchema), createShortUrl);

  app.get("/:shortId", handleRedirect);

  // app.get("/api/url/:shortId", getShortUrl);

 
}

export default routes;