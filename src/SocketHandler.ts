import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./helpers/Logger";
import xss from "xss";
import * as Redis from "ioredis";
import * as path from "path";
import * as RC from "./RedisConstants";
import { getPath } from "./VideoServer";

export class SocketServer {
  io: SocketIOServer;
  idToUserName: Map<string, string> = new Map();
  redis: Redis.Redis;
  redisSub: Redis.Redis;

  constructor(http: Server) {
    this.io = new SocketIOServer(http);
    this.redis = new Redis.default(6379, process.env.REDIS_URL);
    this.redisSub = new Redis.default(6379, process.env.REDIS_URL);
    this.redis.set(RC.REDIS_CONNECTIONS, 0);
    this.redis.set(RC.REDIS_POSITION, 0);
    this.redis.set(RC.REDIS_PLAYING, RC.RFALSE);
    this.redis.set(RC.REDIS_VIDEO_PATH, getPath(""));

    setInterval(() => {
      this.redis.get(RC.REDIS_PLAYING).then((playing) => {
        if (playing == RC.RTRUE) {
          this.redis.incr(RC.REDIS_POSITION).catch((e) => {
            console.log(e);
          });
        }
      });
    }, 1000);

    // video sync
    this.io.on("connection", async (socket: Socket) => {
      this.redis.incr(RC.REDIS_CONNECTIONS);
      logger.info(
        `${socket.id} from ${socket.handshake.address} has connected. Total ${await this.redis.get(
          RC.REDIS_CONNECTIONS
        )} user(s) connected`
      );

      this.updateWatching();

      if ((await this.redis.get(RC.REDIS_POSITION)) != "0") {
        socket.emit("seek", "Server ", await this.redis.get(RC.REDIS_POSITION));
      }

      if ((await this.redis.get(RC.REDIS_PLAYING)) == RC.RTRUE) {
        socket.emit("play", "Server ", await this.redis.get(RC.REDIS_POSITION));
      }

      socket.on("seek", (msg) => {
        this.redis.set(RC.REDIS_POSITION, parseInt(msg));
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("seek", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} seeked the video`);
      });

      socket.on("play", async (msg) => {
        this.redis.set(RC.REDIS_PLAYING, RC.RTRUE);
        this.redis.set(RC.REDIS_POSITION, parseInt(msg));
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("play", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} played the video`);
      });
      socket.on("pause", (msg) => {
        this.redis.set(RC.REDIS_PLAYING, RC.RFALSE);
        this.redis.set(RC.REDIS_POSITION, parseInt(msg));
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("pause", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} paused the video`);
      });

      socket.on("next", () => {
        this.redis.publish(RC.VIDEO_EVENT, "nextep");
      });

      socket.on("disconnect", () => {
        this.idToUserName.delete(socket.id);
        this.redis.decr(RC.REDIS_CONNECTIONS);
        this.updateWatching();
      });

      // received username
      socket.on("name", (msg) => {
        msg = xss(String(msg).slice(0, 30)); // cap at 20 chars
        logger.info(`${socket.id} set their username to ${msg}`);
        this.idToUserName.set(socket.id, msg);
        this.updateWatching();
      });
    });
  }

  subscribeRedis(): void {
    this.redisSub.subscribe(RC.VIDEO_EVENT);
    this.redisSub.on("message", (_, event) => {
      if (event == "newvideo") {
        this.newVideo();
      }
    });
  }

  newVideo(): void {
    this.redis.get(RC.REDIS_VIDEO_PATH).then((videoname) => {
      this.io.sockets.emit("newvideo", path.basename(videoname));
    });
  }

  updateWatching(): void {
    const users = Array.from(this.idToUserName.values());
    this.redis.get(RC.REDIS_CONNECTIONS).then((connections) => {
      this.io.sockets.emit("watching", { count: connections, usernames: users });
    });
  }

  getName(id: string): string {
    if (this.idToUserName.has(id)) {
      return this.idToUserName.get(id);
    }
    return "Anon";
  }
}
