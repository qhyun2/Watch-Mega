import { config } from "dotenv";
config();
import Next from "next";
import express from "express";
import { createServer as createHTTPServer } from "http";
import { SocketServer } from "./SocketHandler";
import { subscribeRedis } from "./VideoServer";
import { logger } from "./Instances";

const dev = process.env.NODE_ENV !== "production";
const next = Next({ dev: dev });
next.prepare().then(() => {
  const app = express();
  const http = createHTTPServer(app);
  const ss = new SocketServer(http);

  ss.subscribeRedis();
  subscribeRedis();

  app.all("*", (req, res) => next.getRequestHandler()(req, res));

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
});
