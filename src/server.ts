import express from "express";
import { createServer as createHTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import * as fs from "fs";
import * as path from "path";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const io = new SocketServer(http);
const videoPath = path.join(__dirname + "/../public/videos/test.mp4");

router.get("/", (_, res) => {
  res.sendFile(path.join(__dirname + "/../public/index.html"));
});

router.get("/video", (req, res) => {
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
});

app.use(router);

io.on("connection", (socket) => {
  socket.on("seek", (msg) => {
    socket.broadcast.emit("seek", msg);
  });
  socket.on("play", () => {
    socket.broadcast.emit("play");
  });
  socket.on("pause", () => {
    socket.broadcast.emit("pause");
  });
});

http.listen(3000, () => {
  console.log(`Server listening on port 3000`);
});
