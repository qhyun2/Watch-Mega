import WebTorrent from "webtorrent";
import * as path from "path";
import { logger } from "./helpers/Logger";

export class TClient {
  client: WebTorrent.Instance;
  constructor() {
    this.client = new WebTorrent();
  }

  download(magnet: string): void {
    this.client.add(magnet, { path: path.join(__dirname, "public/videos/") }, (torrent) => {
      torrent.on("ready", () => {
        logger.info(`${torrent.name} download started`);
      });
      torrent.on("done", () => {
        logger.info(`${torrent.name} download finished`);
        torrent.destroy();
      });

      torrent.on("error", () => {
        logger.info(`${torrent.name} download failed`);
      });
    });
  }

  getStatus(): Record<string, number> {
    const info = {};
    this.client.torrents.forEach((t) => {
      info[t.name] = t.progress;
    });
    return info;
  }
}
