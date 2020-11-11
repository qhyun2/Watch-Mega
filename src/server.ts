import express from "express";
import { createServer as createHTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import * as fs from "fs";
import * as path from "path";
import { urlencoded } from "body-parser";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serveIndex = require("serve-index");
import fileUpload from "express-fileupload";
import { basename } from "path";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const io = new SocketServer(http);
let videoName = "";

router.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "/../public/index.html"));
});

const files = ["success", "fail", "select", "upload"];

files.forEach((endpoint) => {
  router.get(`/${endpoint}`, (_, res) => {
    res.sendFile(path.join(__dirname, `/../public/${endpoint}.html`));
  });
});

router.post("/select", (req, res) => {
  if (!req.body.selection || req.body.selection == "") {
    res.status(303).redirect("/fail");
    return;
  }
  videoName = path.basename(decodeURIComponent(req.body.selection));
  console.log(videoName);
  res.status(303).redirect("/success");
});

router.post("/upload", function (req, res) {
  if (
    !req.files ||
    Object.keys(req.files).length === 0 ||
    path.extname(req.files.video.name) != ".mp4"
  )
    return res.status(303).redirect("/fail");

  const saveLocation = path.join(
    __dirname,
    "/../public/videos/",
    req.files.video.name
  );

  // Use the mv() method to save file
  req.files.video.mv(saveLocation, function (err) {
    if (err) return res.status(500).send(err);
    res.status(303).redirect("/success");
  });
});

router.get("/video", (req, res) => {
  if (videoName == "") {
    res.sendStatus(404);
    return;
  }
  const videoPath = path.join(__dirname, `/../public/videos/${videoName}`);
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
});

app.use(urlencoded({ extended: true }));
app.use("/list", serveIndex("public/videos", { icons: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(router);

// video sync
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
