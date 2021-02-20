import * as fs from "fs";
import * as path from "path";
import * as Redis from "ioredis";
import { Request, Response } from "express";
import { logger } from "./helpers/Logger";
import * as RC from "./RedisConstants";

const redis = new Redis.default(6379, process.env.REDIS_URL);
const redisSub = new Redis.default(6379, process.env.REDIS_URL);

export function getPath(name: string): string {
  let videoPath = path.join(__dirname, "public/videos", name);

  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = path.join(__dirname, "public/default.mp4");
  }
  return videoPath;
}

export async function serveVideo(req: Request, res: Response): Promise<void> {
  const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);
  fs.stat(videoPath, (err, stat) => {
    if (err) {
      logger.error(`Video not found: ${videoPath}`);
    }
    const fileSize = stat.size;
    const range = req.headers.range;

    // browser supports chunk based playback
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");

      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  });
}

export async function serveSubs(req: Request, res: Response): Promise<void> {
  const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);
  const subsPath = videoPath + ".vtt";
  if (!fs.existsSync(subsPath)) {
    logger.info(`Subs not found: ${subsPath}`);
    res.sendStatus(404);
    return;
  }
  logger.info(`Serving subs file ${subsPath}`);
  fs.createReadStream(subsPath).pipe(res);
}

export function subscribeRedis(): void {
  redisSub.subscribe(RC.VIDEO_EVENT);

  redisSub.on("message", (_, event) => {
    if (event == "nextep") {
      nextEpisode();
    }
  });
}

async function nextEpisode(): Promise<void> {
  const currentVideo = await redis.get(RC.REDIS_VIDEO_PATH);
  const videoName = path.basename(currentVideo);
  const currentDir = path.dirname(currentVideo);
  fs.promises
    .readdir(currentDir)
    .then((files) => {
      files = files.filter((f) => f.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)).sort();
      const nextIdx = files.indexOf(videoName) + 1;
      if (nextIdx >= files.length) {
        throw "End of season";
      } else {
        return new Promise((resolve, _) => {
          redis.set(RC.REDIS_VIDEO_PATH, path.join(currentDir, files[nextIdx])).then(() => {
            resolve(files[nextIdx]);
          });
        });
      }
    })
    .then(async (name) => {
      await redis.publish(RC.VIDEO_EVENT, "newvideo");
      return name;
    })
    .then((name) => {
      logger.info(`Loaded next episode: ${name}`);
    })
    .catch((error) => {
      logger.warn(`Could not load next episode: ${error}`);
    });
}
