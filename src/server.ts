import express from "express";
import { createServer as createHTTPServer } from "http";
import * as path from "path";
import { urlencoded } from "body-parser";
import serveFavicon from "serve-favicon";
import serveIndex from "serve-index";
import * as Redis from "ioredis";

import { TClient } from "./TClient";
import { ApiRouter } from "./api";
import { SocketServer } from "./SocketHandler";
import { getPath, serveSubs, serveVideo } from "./VideoServer";
import { logger } from "./helpers/Logger";
import { watchingToString } from "./helpers/Aux";
import * as RC from "./RedisConstants";

const app = express();
const router = express.Router();
const http = createHTTPServer(app);
const ss = new SocketServer(http);
const redis = new Redis.default();

let videoName = getPath("");

// pub views
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

router.get("/", async (_, res) => {
  let videoName = await redis.get(RC.REDIS_VIDEO_NAME);
  if (videoName == "") videoName = "Select a video...";
  const count = parseInt(await redis.get(RC.REDIS_CONNECTIONS)) + 1;
  res.render("index", { videoName: videoName, count: watchingToString(count) });
});

router.get(`/torrent`, (_, res) => {
  res.render("torrent");
});

// video selection endpoint
const fileSelectCSS = path.join(__dirname, "public/css/fileselect.css");
app.use("/select", serveIndex(path.join(__dirname, "public/videos"), { icons: true, stylesheet: fileSelectCSS }));
app.use("/select", (req, res) => {
  videoName = getPath(decodeURIComponent(req.path));
  logger.info(`New video selected: ${videoName}`);
  redis.set(RC.REDIS_VIDEO_NAME, path.basename(videoName));
  redis.set(RC.REDIS_PLAYING, RC.RFALSE);
  redis.set(RC.REDIS_POSITION, 0);
  ss.newVideo();
  res.status(303).redirect("/");
});

// api endpoint
const tclient = new TClient();
router.use("/api", new ApiRouter(tclient).router);

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

app.use(express.static(path.join(__dirname, "public")));
app.use(router);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
