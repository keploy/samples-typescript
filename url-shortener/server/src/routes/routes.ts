import { Express, Request, Response } from "express";
import {
  createShortUrl,
  handleRedirect,

  // getShortUrl,
} from "../controller/shortUrl.controller";
import validateResourse from "../middleware/validateResourse";
import shortUrlSchema from "../schema/createShortUrl.schema";

function routes(app: Express) {
  app.get("/healthcheck", (req: Request, res: Response) => {
    res.set('Type', 'foo-bar');
    res.set('country-1', 'United States');
    console.log("in route handler", res.getHeaders());
    return res.json({"field": "App is healthy", "opacity": Math.random()});
  });

  app.post("/url", validateResourse(shortUrlSchema), createShortUrl);

  app.get("/:shortId", handleRedirect);

  app.post("/foo/:pokemon/bar/:level", function(req: Request, res: Response){
    const { pokemon, level } = req.params;

    res.set('Name', 'Michael');
    res.set('country', 'United States');
    res.set('country-1', 'United States');
    // res.statusCode =201;
    res.json({pokemon:pokemon,level:level})
  })

}

export default routes;