import * as fs from "fs";
import * as path from "path";
import Redis from "ioredis";
import * as RC from "./RedisConstants";
import getInfo from "ffprobe";
import { path as ffprobePath } from "ffprobe-static";
import { logger } from "./Instances";

const redis = new Redis(6379, process.env.REDIS_URL);
const redisSub = new Redis(6379, process.env.REDIS_URL);

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
  const url = (await redis.get(RC.REDIS_VIDEO_PATH)).split(":");
  if (url[0] != "file") return;
  getInfo(url[1], { path: ffprobePath })
    .then((info) => {
      redis.set(RC.REDIS_PLAYING, RC.RFALSE);
      redis.set(RC.REDIS_POSITION, 0);
      redis.set(RC.REDIS_VIDEO_LENGTH, info.streams[0].duration);
    })
    .catch((err) => {
      logger.error(err);
    });
}

export function setVideo(path: string): void {
  logger.info(`New video selected: ${path}`);
  redis.set(RC.REDIS_VIDEO_PATH, path);
  redis.zcard(RC.VIDEO_HISTORY).then((size) => {
    if (size > RC.VIDEO_HISTORY_SIZE) redis.zpopmin(RC.VIDEO_HISTORY);
  });
  redis.zadd(RC.VIDEO_HISTORY, Date.now(), path.replace("data/", ""));
  redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);
}

async function seekEpisode(n: number): Promise<void> {
  try {
    const url = (await redis.get(RC.REDIS_VIDEO_PATH)).split(":");
    if (url[0] != "file") return;
    const videoName = path.basename(url[1]);
    const currentDir = path.dirname(url[1]);
    const dir = await fs.promises.readdir(currentDir);
    const files = dir.filter((f) => f.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)).sort();
    const nextIdx = files.indexOf(videoName) + n;
    if (0 > nextIdx || nextIdx >= files.length) {
      throw "Out of range";
    }
    setVideo("file:" + path.join(currentDir, files[nextIdx]));
  } catch (error) {
    logger.warn(`Could not load next episode: ${error}`);
  }
}
