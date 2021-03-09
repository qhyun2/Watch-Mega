import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import * as Redis from "ioredis";
import { logger } from "../../../../src/Logger";
import * as RC from "../../../../src/RedisConstants";

const redis = new Redis.default(6379, process.env.REDIS_URL);

function getPath(name: string): string {
  let videoPath = path.join("data", name);

  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = "public/default.mp4";
  }
  return videoPath;
}

export default async function select(req: Request, res: Response) {
  const videoName = getPath(path.join(...(<string[]>req.query.slug)));
  logger.info(`New video selected: ${videoName}`);
  redis.set(RC.REDIS_VIDEO_PATH, videoName);
  redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);
  res.status(303).redirect("/");
}
