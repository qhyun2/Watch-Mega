import WebTorrent from "webtorrent";
import * as path from "path";

export class TClient {
  client: WebTorrent.Instance;
  constructor() {
    this.client = new WebTorrent();
  }

  download(magnet: string): boolean {
    this.client.add(
      magnet,
      { path: path.join(__dirname, "public/videos/") },
      (torrent) => {
        torrent.on("done", function () {
          console.log(`${torrent.name} download finished`);
          torrent.destroy();
        });

        torrent.on("error", function () {
          console.log(`${torrent.name} download failed`);
        });
      }
    );
    return true;
  }

  getStatus(): Record<string, number> {
    const info = {};
    this.client.torrents.forEach((t) => {
      info[t.name] = t.progress;
    });
    return info;
  }
}
