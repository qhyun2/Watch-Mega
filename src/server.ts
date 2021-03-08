import { config } from "dotenv";
config();
import express from "express";
import { json, urlencoded } from "body-parser";
import cookieParser from "cookie-parser";
import { createServer as createHTTPServer } from "http";
import * as path from "path";
import serveIndex from "serve-index";
import * as Redis from "ioredis";

import { TClient } from "./TClient";
import { ApiRouter } from "./Api";
import { SocketServer } from "./SocketHandler";
import { getPath, serveSubs, serveVideo, subscribeRedis } from "./VideoServer";
import { logger } from "./Logger";
import { auth, login } from "./Auth";
import * as RC from "./RedisConstants";

const dev = process.env.NODE_ENV !== "production";
import Next from "next";
const next = Next({ dev: dev });
next.prepare().then(() => {
  const nextHandler = next.getRequestHandler();

  const app = express();
  const router = express.Router();

  const http = createHTTPServer(app);
  const ss = new SocketServer(http);

  // ---- REDIS ----
  const redis = new Redis.default(6379, process.env.REDIS_URL);
  ss.subscribeRedis();
  subscribeRedis();

  // ---- AUTHED ROUTER ----
  router.use(json());
  router.use(cookieParser());
  router.use(urlencoded({ extended: true }));
  router.use(auth);

  router.get("/video", auth, serveVideo);
  router.get("/subs", auth, serveSubs);
  router.use("/api", new ApiRouter(new TClient()).router);

  // video selection endpoint
  router.use("/select", serveIndex("data", { icons: true, stylesheet: "public/fileselect.css" }));
  router.use("/select", (req, res) => {
    const videoName = getPath(decodeURIComponent(req.path));
    logger.info(`New video selected: ${videoName}`);
    redis.set(RC.REDIS_VIDEO_PATH, videoName);
    redis.set(RC.REDIS_PLAYING, RC.RFALSE);
    redis.set(RC.REDIS_POSITION, 0);
    redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);
    res.status(303).redirect("/");
  });

  router.get("*", (req, res) => nextHandler(req, res));

  // ---- NO AUTH ENDPOINTS ----
  app.use(json());
  app.post("/login", login);
  app.use(router);

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
});
