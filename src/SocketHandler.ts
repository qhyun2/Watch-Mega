import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./Instances";
import * as Redis from "ioredis";
import * as RC from "./RedisConstants";
import { VideoState } from "../lib/VideoState";

export class SocketServer {
  io: SocketIOServer;
  redis: Redis.Redis;
  redisSub: Redis.Redis;

  constructor(http: Server) {
    this.io = new SocketIOServer(http);
    this.redis = new Redis.default(6379, process.env.REDIS_URL);
    this.redisSub = new Redis.default(6379, process.env.REDIS_URL);
    this.redis.set(RC.REDIS_CONNECTIONS, 0);
    this.redis.set(RC.REDIS_VIDEO_PATH, "file:public/default.mp4");
    this.redis.publish(RC.VIDEO_EVENT, RC.VE_NEWVID);

    setInterval(() => {
      Promise.all([
        this.redis.get(RC.REDIS_PLAYING),
        this.redis.get(RC.REDIS_POSITION),
        this.redis.get(RC.REDIS_VIDEO_LENGTH),
      ]).then(([playing, position, length]) => {
        if (playing == RC.RTRUE) this.redis.incrbyfloat(RC.REDIS_POSITION, 1);
        if (parseFloat(position) >= parseInt(length) - 1) this.redis.set(RC.REDIS_PLAYING, RC.RFALSE);
      });
    }, 1000);

    // video sync
    this.io.on("connection", async (socket: Socket) => {
      this.redis.incr(RC.REDIS_CONNECTIONS);
      logger.info(
        `${socket.handshake.address} has connected. Total ${await this.redis.get(
          RC.REDIS_CONNECTIONS
        )} user(s) connected`
      );

      this.updateWatching();
      this.sync();

      socket.on("seek", (msg) => {
        const pos = parseFloat(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_POSITION, pos);
        logger.info(`${socket.handshake.address} seeked the video to ${pos}`);
        this.sync();
      });
      socket.on("play", async (msg) => {
        const pos = parseFloat(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_PLAYING, RC.RTRUE);
        this.redis.set(RC.REDIS_POSITION, pos);
        logger.info(`${socket.handshake.address} played the video at ${pos}`);
        this.sync();
      });
      socket.on("pause", (msg) => {
        const pos = parseFloat(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_PLAYING, RC.RFALSE);
        this.redis.set(RC.REDIS_POSITION, pos);
        logger.info(`${socket.handshake.address} paused the video at ${pos}`);
        this.sync();
      });
      socket.on("next", () => {
        this.redis.publish(RC.VIDEO_EVENT, RC.VE_NEXTEP);
      });
      socket.on("prev", () => {
        this.redis.publish(RC.VIDEO_EVENT, RC.VE_PREVEP);
      });
      socket.on("reqsync", () => {
        this.sync();
      });
      socket.on("disconnect", () => {
        this.redis.decr(RC.REDIS_CONNECTIONS);
        this.updateWatching();
      });
    });
  }

  sync(): void {
    Promise.all([
      this.redis.get(RC.REDIS_PLAYING),
      this.redis.get(RC.REDIS_POSITION),
      this.redis.get(RC.REDIS_VIDEO_PATH),
    ]).then(([playing, position, name]) => {
      const isPaused = playing === RC.RFALSE;
      this.io.sockets.emit("state", { isPaused, position: parseFloat(position), name } as VideoState);
    });
  }

  subscribeRedis(): void {
    this.redisSub.subscribe(RC.VIDEO_EVENT);
    this.redisSub.on("message", (_, event) => {
      if (event == RC.VE_NEWVID) {
        this.sync();
      }
    });
  }

  updateWatching(): void {
    this.redis.get(RC.REDIS_CONNECTIONS).then((connections) => {
      this.io.sockets.emit("watching", { count: connections });
    });
  }
}
