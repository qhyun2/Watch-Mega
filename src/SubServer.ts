import * as fs from "fs";
import * as path from "path";
import { Request, Response } from "express";

export function serveSubs(req: Request, res: Response, name: string): void {
  const videoName = path.basename(name) + ".vtt";
  const filePath = path.join(__dirname, "public/subs", videoName);
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    // download file
    res.send("not found");
    res.status(404);
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}
