import { Request, Response } from "express";
import shortUrl from "../models/shortUrl.model";


export async function createShortUrl(req: Request, res: Response) {
  // Get the url from the request body
  const { url } = req.body;
  const ts = Math.floor(Date.now()/1000);
  var r = shortUrl.schema
    
  // Create a shortUrl
  const newUrl = await shortUrl.create({url,ts});
  // var t = "http://localhost:8080/" + random
  // Return the shortUrl
  return res.send({ts:ts,shortUrl:r.obj.shorturl.default});
}

export async function handleRedirect(req: Request, res: Response) {
  const { shortId } = req.params;

  const short = await shortUrl.findOne({ shortId }).lean();

  if (!short) {
    return res.sendStatus(404);
  }

  return res.redirect(short.url);
}


