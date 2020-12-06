import * as fs from "fs";
import * as path from "path";
import { Request, Response } from "express";
import { logger } from "./helpers/Logger";

export function getPath(name: string): string {
  let videoPath = path.join(__dirname, `public/videos/${name}`);
  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = path.join(__dirname, "public/default.mp4");
  }
  return videoPath;
}

export function serveVideo(req: Request, res: Response, videoPath: string): void {
  fs.stat(videoPath, (err, stat) => {
    if (err) {
      logger.error(`Video not found: ${videoPath}`);
    }
    const fileSize = stat.size;
    const range = req.headers.range;

    // browser supports chunk based playback
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");

      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };

      res.writeHead(206, head);
      file.pipe(res);
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

export function serveSubs(req: Request, res: Response, videoPath: string): Promise<void> {
  const subsPath = videoPath + ".vtt";
  if (!fs.existsSync(subsPath)) {
    logger.info(`Subs not found: ${subsPath}`);
    res.sendStatus(404);
    return;
  }
  logger.info(`Serving subs file ${subsPath}`);
  fs.createReadStream(subsPath).pipe(res);
}
