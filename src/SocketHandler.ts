import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

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
      this.updateWatching();

      socket.emit("seek", this.position);

      if (this.playing) {
        socket.emit("play", this.position);
      }

      socket.on("seek", (msg) => {
        socket.broadcast.emit("seek", msg);
        this.position = msg;
      });
      socket.on("play", (msg) => {
        socket.broadcast.emit("play", msg);
        this.playing = true;
      });
      socket.on("pause", () => {
        socket.broadcast.emit("pause");
        this.playing = false;
      });
      socket.on("disconnect", () => {
        this.idToUserName.delete(socket.id);
        this.connectedUsers--;
        this.updateWatching();
      });

      // received username
      socket.on("name", (msg) => {
        this.idToUserName.set(socket.id, String(msg));
        console.log(this.idToUserName);
        console.log(Array.from(this.idToUserName.values()));
        this.updateWatching();
      });
    });
  }

  updateWatching(): void {
    const users = Array.from(this.idToUserName.values());
    this.io.sockets.emit("watching", { count: this.connectedUsers, usernames: users });
  }
}
