import express from "express";
import { createServer as createHTTPServer } from "http";
import * as path from "path";
import { urlencoded } from "body-parser";
import serveFavicon from "serve-favicon";
import serveIndex from "serve-index";
var upload = require("jquery-file-upload-middleware");
// import fileUpload from "express-fileupload";

import { TClient } from "./TClient";
import { ApiRouter } from "./api";
import { SocketServer } from "./SocketHandler";
import { serveVideo } from "./VideoServer";
import { serveSubs } from "./SubServer";
import { logger } from "./Logger";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const ss = new SocketServer(http);

let videoName = "";

// pub views
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
router.get("/", function (req, res) {
  res.render("index");
});

const files = ["success", "fail", "select", "upload", "torrent"];

files.forEach((endpoint) => {
  router.get(`/${endpoint}`, (_, res) => {
    res.render(endpoint);
  });
});

// api endpoint
const tclient = new TClient();
router.use("/api", new ApiRouter(tclient).router);

router.post("/select", (req, res) => {
  if (!req.body.selection || req.body.selection == "") {
    res.status(303).redirect("/fail");
    return;
  }
  videoName = decodeURIComponent(req.body.selection).split("list")[1];

  logger.info(`New video selected: ${videoName}`);
  ss.io.emit("newvideo");
  ss.playing = false;
  ss.position = 0;
  res.status(303).redirect("/success");
});

// configure upload middleware
upload.configure({
  uploadDir: path.join(__dirname + "/public/videos"),
});

// video endpoint
router.get("/video", (req, res) => {
  serveVideo(req, res, videoName);
});

// subtitles endpoint
router.get("/subs", (req, res) => {
  serveSubs(req, res, videoName);
});

app.use(serveFavicon(path.join(__dirname, "public/favicon.ico")));
app.use(urlencoded({ extended: true }));
app.use("/list", serveIndex(path.join(__dirname, "public/videos"), { icons: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", upload.fileHandler());
app.use(router);

http.listen(3000, () => {
  logger.info(`Server listening on port 3000`);
});
