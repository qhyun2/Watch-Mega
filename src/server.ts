import { config } from "dotenv";
config();
import express from "express";
import { json, urlencoded } from "body-parser";
import cookieParser from "cookie-parser";
import { createServer as createHTTPServer } from "http";
import serveIndex from "serve-index";
import { TClient } from "./TClient";
import { ApiRouter } from "./Api";
import { SocketServer } from "./SocketHandler";
import { subscribeRedis } from "./VideoServer";
import { logger } from "./Logger";

const dev = process.env.NODE_ENV !== "production";
import Next from "next";
const next = Next({ dev: dev });
next.prepare().then(() => {
  const app = express();
  const http = createHTTPServer(app);
  const ss = new SocketServer(http);

  ss.subscribeRedis();
  subscribeRedis();

  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use("/oldapi", new ApiRouter(new TClient()).router);
  app.use("/api/media/select", serveIndex("data", { icons: true, stylesheet: "public/fileselect.css" }));
  app.all("*", (req, res) => next.getRequestHandler()(req, res));

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
});
