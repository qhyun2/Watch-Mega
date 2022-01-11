import { createAuthedApiRoute } from "../../../lib/withSession";
import { tc } from "../../../src/Instances";
import * as path from "path";
import { logger } from "../../../src/Instances";
import { processVideos } from "../../../src/VideoProcessor";

const router = createAuthedApiRoute();

router.post((req, res) => {
  const magnet = req.body.magnet;

  // alreadying downloading
  if (tc.torrents.some((t) => t.magnetURI == magnet)) return;

  tc.add(magnet, { path: "data/" }, (torrent) => {
    torrent.once("download", () => {
      logger.info(`${torrent.name} download started`);
    });
    torrent.on("done", () => {
      logger.info(`${torrent.name} download finished`);

      const names: string[] = [];
      torrent.files.forEach(function (file) {
        if (file.path.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)) {
          names.push(path.join("data", file.path));
        }
      });

      torrent.destroy();
      processVideos(names);
    });

    torrent.on("error", () => {
      logger.info(`${torrent.name} download failed`);
    });
  }).on("error", () => {
    logger.warn(`Invalid torrent magnet: ${magnet}`);
  });

  res.status(303).redirect("/torrent");
});

export default router;
