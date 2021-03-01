import * as fs from "fs";
import * as path from "path";
import * as Redis from "ioredis";
import { Request, Response } from "express";
import "ffprobe";
import { path as ffprobePath } from "ffprobe-static";
import { logger } from "./helpers/Logger";
import * as RC from "./RedisConstants";
import getInfo from "ffprobe";

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
    }
  });
}

export async function serveSubs(req: Request, res: Response): Promise<void> {
  const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);
  const subsPath = videoPath + ".vtt";
  res.contentType("text/vtt");
  if (!fs.existsSync(subsPath)) {
    logger.warn(`Subs not found: ${subsPath}`);
    res.send("WEBVTT");
    res.status(200);
    return;
  }
  logger.info(`Serving subs file ${subsPath}`);
  fs.createReadStream(subsPath).pipe(res);
}

export function subscribeRedis(): void {
  redisSub.subscribe(RC.VIDEO_EVENT);

  redisSub.on("message", (_, event) => {
    switch (event) {
      case RC.VE_NEWVID:
        newVideo();
        break;
      case RC.VE_NEXTEP:
        seekEpisode(1);
        break;
      case RC.VE_PREVEP:
        seekEpisode(-1);
        break;
    }
  });
}

async function newVideo(): Promise<void> {
  const currentVideo = await redis.get(RC.REDIS_VIDEO_PATH);
  getInfo(currentVideo, { path: ffprobePath })
    .then((info) => {
      redis.set(RC.REDIS_VIDEO_LENGTH, info.streams[0].duration);
    })
    .catch((err) => {
      logger.error(err);
    });
}

function getEpisodes(): Promise<string[]> {
  return redis
    .get(RC.REDIS_VIDEO_PATH)
    .then((currentVideo) => {
      const currentDir = path.dirname(currentVideo);
      return fs.promises.readdir(currentDir);
    })
    .then((files) => {
      return files.filter((f) => f.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)).sort();
    });
}

function setVideo(path: string): Promise<void> {
  return redis
    .set(RC.REDIS_VIDEO_PATH, path)
    .then(() => {
      redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);
    })
    .then(() => {
      logger.info(`Loaded video: ${path}`);
    });
}

async function seekEpisode(n: number): Promise<void> {
  try {
    const videoPath = await redis.get(RC.REDIS_VIDEO_PATH);
    const videoName = path.basename(videoPath);
    const currentDir = path.dirname(videoPath);
    const files = await getEpisodes();
    const nextIdx = files.indexOf(videoName) + n;
    if (0 > nextIdx || nextIdx >= files.length) {
      throw "Out of range";
    }
    setVideo(path.join(currentDir, files[nextIdx]));
  } catch (error) {
    logger.warn(`Could not load next episode: ${error}`);
  }
}
