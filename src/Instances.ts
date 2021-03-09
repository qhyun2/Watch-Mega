import WebTorrent from "webtorrent";
import Logger from "pino";

export const tc = new WebTorrent();
export const logger = Logger({
  prettyPrint: { colorize: true, ignore: "pid,hostname", translateTime: "SYS:ddd mmm dd yyyy HH:MM:ss" },
});
