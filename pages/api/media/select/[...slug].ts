import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import * as RC from "../../../../src/RedisConstants";
import { redis, logger } from "../../../../src/Instances";
import { setVideo } from "../../../../src/VideoServer";

function getPath(name: string): string {
  let videoPath = path.join("data", name);

  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = "public/default.mp4";
  }
  return videoPath;
}

export default async function select(req: Request, res: Response): Promise<void> {
  setVideo(getPath(path.join(...(<string[]>req.query.slug))));
  res.status(303).redirect("/");
}
