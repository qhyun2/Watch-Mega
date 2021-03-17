import WebTorrent from "webtorrent";
import Logger from "pino";
import * as Redis from "ioredis";

export const tc = new WebTorrent();
export const logger = Logger({
  prettyPrint: { colorize: true, ignore: "pid,hostname", translateTime: "SYS:ddd mmm dd yyyy HH:MM:ss" },
});
export const redis = new Redis.default(6379, process.env.REDIS_URL);
redis.on("error", (e) => {
  console.log(e);
});
