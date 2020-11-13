import express from "express";
import { createServer as createHTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import * as fs from "fs";
import * as path from "path";
import { urlencoded } from "body-parser";
import serveFavicon from "serve-favicon";
import serveIndex from "serve-index";
import fileUpload from "express-fileupload";

import { TClient } from "./TClient";
import { ApiRouter } from "./api";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const io = new SocketServer(http);
const tclient = new TClient();
let videoName = "";
let position = 0;
let connectedUsers = 0;
let playing = false;

// const torrentId =
// "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";
// tclient.download(torrentId);
// setInterval(() => console.log(tclient.getStatus()), 400);

router.get("/", function (req, res) {
  res.render("index");
});

const files = ["success", "fail", "select", "upload", "torrent"];

files.forEach((endpoint) => {
  router.get(`/${endpoint}`, (_, res) => {
    res.render(endpoint);
  });
});

router.use("/api", new ApiRouter(tclient).router);

router.post("/select", (req, res) => {
  if (!req.body.selection || req.body.selection == "") {
    res.status(303).redirect("/fail");
    return;
  }
  videoName = decodeURIComponent(req.body.selection).split("list")[1];
  io.emit("newvideo");
  playing = false;
  position = 0;
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
    "public/videos/",
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
  const videoPath = path.join(__dirname, `public/videos/${videoName}`);
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

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(serveFavicon(path.join(__dirname, "public/favicon.ico")));
app.use(urlencoded({ extended: true }));
app.use(
  "/list",
  serveIndex(path.join(__dirname, "public/videos"), { icons: true })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(router);

setInterval(() => {
  if (playing) position++;
}, 1000);

// video sync
io.on("connection", (socket) => {
  connectedUsers++;
  socket.emit("seek", position);
  io.sockets.emit("watching", connectedUsers);

  if (playing) {
    socket.emit("play", position);
  }

  socket.on("seek", (msg) => {
    socket.broadcast.emit("seek", msg);
    position = msg;
  });
  socket.on("play", (msg) => {
    socket.broadcast.emit("play", msg);
    playing = true;
  });
  socket.on("pause", () => {
    socket.broadcast.emit("pause");
    playing = false;
  });
  socket.on("disconnect", () => {
    connectedUsers--;
    io.sockets.emit("watching", connectedUsers);
  });
});

http.listen(3000, () => {
  console.log(`Server listening on port 3000`);
});
