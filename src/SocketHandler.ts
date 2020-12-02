import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./Logger";
import xss from "xss";

export class SocketServer {
  io: SocketIOServer;
  position = 0;
  connectedUsers = 0;
  playing = false;
  idToUserName: Map<string, string> = new Map();

  constructor(http: Server) {
    setInterval(() => {
      if (this.playing) this.position++;
    }, 1000);

    this.io = new SocketIOServer(http);

    // video sync
    this.io.on("connection", (socket: Socket) => {
      this.connectedUsers++;
      logger.info(`${socket.id} has connected. Total ${this.connectedUsers} user(s) connected`);

      this.updateWatching();
      socket.emit("seek", "Server ", this.position);

      if (this.playing) {
        socket.emit("play", "Server ", this.position);
      }

      socket.on("seek", (msg) => {
        this.position = msg;
        socket.broadcast.emit("seek", this.getName(socket.id), this.position);
        logger.info(`${socket.id} seeked the video`);
      });
      socket.on("play", (msg) => {
        this.playing = true;
        this.position = msg;
        socket.broadcast.emit("play", this.getName(socket.id), this.position);
        logger.info(`${socket.id} played the video`);
      });
      socket.on("pause", () => {
        this.playing = false;
        socket.broadcast.emit("pause", this.getName(socket.id));
        logger.info(`${socket.id} paused the video`);
      });
      socket.on("disconnect", () => {
        this.idToUserName.delete(socket.id);
        this.connectedUsers--;
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

  updateWatching(): void {
    const users = Array.from(this.idToUserName.values());
    this.io.sockets.emit("watching", { count: this.connectedUsers, usernames: users });
  }

  getName(id: string): string {
    if (this.idToUserName.has(id)) {
      return this.idToUserName.get(id);
    }
    return "Anon";
  }
}
