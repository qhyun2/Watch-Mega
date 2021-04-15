import { config } from "dotenv";
config();
import { SocketServer } from "./SocketHandler";
import { subscribeRedis } from "./VideoServer";
import { logger } from "./Instances";

const ss = new SocketServer();
ss.subscribeRedis();
subscribeRedis();
logger.info("Socket.io server listening on port " + process.env.SOCKET_IO_PORT);
