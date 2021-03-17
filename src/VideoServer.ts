import * as fs from "fs";
import * as path from "path";
import * as Redis from "ioredis";
import * as RC from "./RedisConstants";
import getInfo from "ffprobe";
import { path as ffprobePath } from "ffprobe-static";
import { logger } from "./Instances";

const redis = new Redis.default(6379, process.env.REDIS_URL);
redis.on("error", (e) => {
  console.log(e);
  console.log(e.trace());
});
const redisSub = new Redis.default(6379, process.env.REDIS_URL);
redisSub.on("error", (e) => {
  console.log(e);
  console.log(e.trace());
});

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
      redis.set(RC.REDIS_PLAYING, RC.RFALSE);
      redis.set(RC.REDIS_POSITION, 0);
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
