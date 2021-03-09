import { Request, Response } from "express";
import * as fs from "fs";
import * as Redis from "ioredis";
import * as RC from "../../../src/RedisConstants";
import { logger } from "../../../src/Instances";

const redis = new Redis.default(6379, process.env.REDIS_URL);

export default async function serve(req: Request, res: Response): Promise<void> {
  const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);

  await new Promise<void>((resolve) => {
    fs.stat(videoPath, (err, stat) => {
      if (err) {
        const error = `Video not found: ${videoPath}`;
        logger.warn(error);
        res.status(404).send(error);
        return;
      }
      const fileSize = stat.size;
      const range = req.headers.range;

      // browser supports chunk based playback
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");

        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = end - start + 1;
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        };

        try {
          const file = fs.createReadStream(videoPath, { start, end });
          res.writeHead(206, head);
          file.pipe(res);
        } catch (error) {
          res.status(400).send(error.stack);
          logger.warn(error.stack);
        }
      } else {
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
        resolve();
      }
    });
  });
}
