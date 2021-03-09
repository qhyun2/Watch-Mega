import { Request, Response } from "express";
import * as fs from "fs";
import * as Redis from "ioredis";
import * as RC from "../../../src/RedisConstants";
import { logger } from "../../../src/Instances";

const redis = new Redis.default(6379, process.env.REDIS_URL);

export default async function handler(req, res): Promise<void> {
  const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);
  const subsPath = videoPath + ".vtt";
  res.contentType("text/vtt");
  if (!fs.existsSync(subsPath)) {
    logger.warn(`Subs not found: ${subsPath}`);
    res.send("WEBVTT");
    res.status(200);
  } else {
    logger.info(`Serving subs file ${subsPath}`);
    fs.createReadStream(subsPath).pipe(res);
  }
}
