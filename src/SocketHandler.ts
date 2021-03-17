import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./Instances";
import xss from "xss";
import * as Redis from "ioredis";
import * as path from "path";
import * as RC from "./RedisConstants";

export class SocketServer {
  io: SocketIOServer;
  idToUserName: Map<string, string> = new Map();
  redis: Redis.Redis;
  redisSub: Redis.Redis;

  constructor(http: Server) {
    this.io = new SocketIOServer(http);
    this.redis = new Redis.default(6379, process.env.REDIS_URL);
    this.redis.on("error", (e) => {
      console.log(e);
      console.log(e.trace());
    });
    this.redisSub = new Redis.default(6379, process.env.REDIS_URL);

    this.redisSub.on("error", (e) => {
      console.log(e);
      console.log(e.trace());
    });
    this.redis.set(RC.REDIS_CONNECTIONS, 0);
    this.redis.set(RC.REDIS_VIDEO_PATH, "public/default.mp4");
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
        `${socket.id} from ${socket.handshake.address} has connected. Total ${await this.redis.get(
          RC.REDIS_CONNECTIONS
        )} user(s) connected`
      );

      this.updateWatching();
      Promise.all([this.redis.get(RC.REDIS_PLAYING), this.redis.get(RC.REDIS_VIDEO_PATH)]).then(
        ([playing, videoName]) => {
          socket.emit("info", { playing: playing == RC.RTRUE, videoName: path.basename(videoName) });
        }
      );
      socket.emit("seek", null, await this.redis.get(RC.REDIS_POSITION));

      socket.on("ready", () => {
        Promise.all([this.redis.get(RC.REDIS_PLAYING), this.redis.get(RC.REDIS_POSITION)]).then(([playing, pos]) => {
          if (playing == RC.RTRUE) {
            socket.emit("play", null, pos);
          } else {
            socket.emit("seek", null, pos);
          }
        });
      });

      socket.on("seek", (msg) => {
        const pos = parseFloat(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_POSITION, pos);
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("seek", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} seeked the video to ${pos}`);
      });

      socket.on("play", async (msg) => {
        const pos = parseFloat(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_PLAYING, RC.RTRUE);
        this.redis.set(RC.REDIS_POSITION, pos);
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("play", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} played the video at ${pos}`);
      });
      socket.on("pause", (msg) => {
        const pos = parseInt(msg);
        if (isNaN(pos)) return;
        this.redis.set(RC.REDIS_PLAYING, RC.RFALSE);
        this.redis.set(RC.REDIS_POSITION, pos);
        this.redis.get(RC.REDIS_POSITION).then((pos) => {
          socket.broadcast.emit("pause", this.getName(socket.id), pos);
        });
        logger.info(`${socket.id} paused the video at ${pos}`);
      });

      socket.on("next", () => {
        this.redis.publish(RC.VIDEO_EVENT, RC.VE_NEXTEP);
      });
      socket.on("prev", () => {
        this.redis.publish(RC.VIDEO_EVENT, RC.VE_PREVEP);
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
      if (event == RC.VE_NEWVID) {
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
