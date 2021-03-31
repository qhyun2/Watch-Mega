import withSession from "../../../lib/session";
import * as fs from "fs";
import * as RC from "../../../src/RedisConstants";
import { logger, redis } from "../../../src/Instances";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  const url = (await redis.get(RC.REDIS_VIDEO_PATH)).split(":");
  if (url[0] != "file") return res.status(404).send("Not currently watching file");

  const videoPath = url[1];

  await new Promise<void>((resolve) => {
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
        resolve();
      }
    });
  });
});
