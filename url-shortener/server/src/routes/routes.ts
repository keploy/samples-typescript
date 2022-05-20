import { Express, Request, Response } from "express";
// import middleware from "typescript-sdk/dist/integerations/express";

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
    res.set('Type', 'foo-bar');
    console.log(res.getHeaders());
    return res.send("App is healthy");
  });

  app.post("/url", validateResourse(shortUrlSchema), createShortUrl);

  app.get("/:shortId", handleRedirect);

  app.post("/foo/:pokemon/bar/:level", function(req: Request, res: Response){
    const { pokemon, level } = req.params;

    res.set('Name', 'Michael');
    res.set('country', 'United States');
    res.json({pokemon:pokemon,level:level})
  })

  // app.get("/api/url/:shortId", getShortUrl);

 
}

export default routes;