import * as fs from "fs";
import * as path from "path";
import { Request, Response } from "express";

export function serveVideo(req: Request, res: Response, videoName: string): void {
  let videoPath = path.join(__dirname, `public/videos/${videoName}`);
  if (!videoName) {
    videoPath = path.join(__dirname, "public/default.mp4");
  }
  console.log(videoPath);
  fs.stat(videoPath, (err, stat) => {
    // file not found
    if (err !== null && err.code === "ENOENT") {
      res.sendStatus(404);
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
