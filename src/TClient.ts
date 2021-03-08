import WebTorrent from "webtorrent";
import * as path from "path";
import { logger } from "./helpers/Logger";
import { processVideos } from "./helpers/VideoProcessor";

export class TClient {
  client: WebTorrent.Instance;
  constructor() {
    this.client = new WebTorrent();
  }

  download(magnet: string): void {
    // alreadying downloading
    if (this.client.torrents.some((t) => t.magnetURI == magnet)) return;

    this.client
      .add(magnet, { path: path.join(__dirname, "public/videos/") }, (torrent) => {
        torrent.on("ready", () => {
          logger.info(`${torrent.name} download started`);
        });
        torrent.on("done", () => {
          logger.info(`${torrent.name} download finished`);

          const names: string[] = [];
          torrent.files.forEach(function (file) {
            if (file.path.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)) {
              names.push(path.join(__dirname, "public", "videos", file.path));
            }
          });

          torrent.destroy();
          processVideos(names);
        });

        torrent.on("error", () => {
          logger.info(`${torrent.name} download failed`);
        });
      })
      .on("error", () => {
        logger.warn(`Invalid torrent magnet: ${magnet}`);
      });
  }

  getStatus(): { name: string; value: number; id: string }[] {
    const info = [];
    this.client.torrents.forEach((t) => {
      info.push({ name: t.name, value: t.progress, id: t.magnetURI });
    });
    return info;
  }

  delete(magnet: string): void {
    this.client.torrents.forEach((t) => {
      if (t.magnetURI == magnet) {
        t.destroy({ destroyStore: true });
      }
    });
  }
}
