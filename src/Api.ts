import { Router } from "express";
import { TClient } from "./TClient";

export class ApiRouter {
  tclient: TClient;
  router: Router;

  constructor(tclient: TClient) {
    this.tclient = tclient;

    this.router = Router();

    this.router.get("/torrent/status", (_, res) => {
      res.send(tclient.getStatus());
    });

    this.router.post("/torrent/start", (req, res) => {
      tclient.download(req.body.magnet);
      res.status(303).redirect("/torrent");
    });

    this.router.post("/torrent/stop", (req, res) => {
      tclient.delete(req.body.magnet);
      res.status(303).redirect("/torrent");
    });
  }
}
