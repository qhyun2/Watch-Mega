import * as fs from "fs";
import * as path from "path";
import { Request, Response } from "express";
import { logger } from "./Logger";

export function serveSubs(req: Request, res: Response, name: string): void {
  if (!name) return;
  const videoName = path.basename(name) + ".vtt";
  const filePath = path.join(__dirname, "public/subs", videoName);
  logger.info(`Serving subs for ${videoName}`);
  if (!fs.existsSync(filePath)) {
    // download file
    res.send("not found");
    res.status(404);
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}
