import express from "express";
import { createServer as createHTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import * as fs from "fs";
import * as path from "path";
import { urlencoded } from "body-parser";
import serveFavicon from "serve-favicon";
import serveIndex from "serve-index";
import fileUpload from "express-fileupload";

import { TClient } from "./download";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const io = new SocketServer(http);
const tclient = new TClient();
let videoName = "";
let position = 0;
let connectedUsers = 0;
let playing = false;

// tclient.download(magnetURI);
// setInterval(() => console.log(tclient.getStatus()), 400);

router.get("/", function (req, res) {
  res.render("index", { title: "Hey", message: "Hello there!" });
});

// router.get("/", (_, res) => {
//   res.sendFile(path.join(__dirname, "public/index.html"));
// });

const files = ["success", "fail", "select", "upload"];

files.forEach((endpoint) => {
  router.get(`/${endpoint}`, (_, res) => {
    res.render(endpoint);
  });
});

router.post("/select", (req, res) => {
  if (!req.body.selection || req.body.selection == "") {
    res.status(303).redirect("/fail");
    return;
  }
  videoName = path.basename(decodeURIComponent(req.body.selection));
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
