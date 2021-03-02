import { config } from "dotenv";
config();
import express from "express";
import { json, urlencoded } from "body-parser";
import cookieParser from "cookie-parser";
import { createServer as createHTTPServer } from "http";
import * as path from "path";
import serveFavicon from "serve-favicon";
import serveIndex from "serve-index";
import * as Redis from "ioredis";

import { TClient } from "./TClient";
import { ApiRouter } from "./api";
import { SocketServer } from "./SocketHandler";
import { getPath, serveSubs, serveVideo, subscribeRedis } from "./VideoServer";
import { logger } from "./helpers/Logger";
import { watchingToString } from "./helpers/Aux";
import { auth, login } from "./helpers/Auth";
import * as RC from "./RedisConstants";

const app = express();
const router = express.Router();

const http = createHTTPServer(app);
const ss = new SocketServer(http);

// ---- REDIS ----
const redis = new Redis.default(6379, process.env.REDIS_URL);
ss.subscribeRedis();
subscribeRedis();

// ---- PUG ----
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
async function homepage(_, res) {
  let videoName = path.basename(await redis.get(RC.REDIS_VIDEO_PATH));
  if (videoName == "") videoName = "Select a video...";
  const count = parseInt(await redis.get(RC.REDIS_CONNECTIONS)) + 1;
  res.render("index", { videoName: videoName, count: watchingToString(count) });
}
async function torrent(_, res) {
  res.render("torrent");
}

// ---- AUTHED ROUTER ----
router.use(json());
router.use(cookieParser());
router.use(urlencoded({ extended: true }));
router.use(auth);
router.use(serveFavicon(path.join(__dirname, "public/favicon.ico")));
router.use(express.static(path.join(__dirname, "public")));
router.get("/", homepage);
router.get(`/torrent`, torrent);
router.use("/api", new ApiRouter(new TClient()).router);

// video selection endpoint
const fileSelectCSS = path.join(__dirname, "public/css/fileselect.css");
router.use("/select", serveIndex(path.join(__dirname, "public/videos"), { icons: true, stylesheet: fileSelectCSS }));
router.use("/select", (req, res) => {
  const videoName = getPath(decodeURIComponent(req.path));
  logger.info(`New video selected: ${videoName}`);
  redis.set(RC.REDIS_VIDEO_PATH, videoName);
  redis.set(RC.REDIS_PLAYING, RC.RFALSE);
  redis.set(RC.REDIS_POSITION, 0);
  redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);
  res.status(303).redirect("/");
});
router.get("/video", auth, serveVideo);
router.get("/subs", auth, serveSubs);

// ---- NO AUTH ENDPOINTS ----
app.use(json());
app.post("/login", login);
app.get("/login", (_, res) => {
  res.render("login");
});

app.use(router);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
