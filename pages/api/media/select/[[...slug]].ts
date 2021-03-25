import type { NextApiRequest, NextApiResponse } from "next";
import * as path from "path";
import * as fs from "fs";
import { setVideo } from "../../../../src/VideoServer";

function getPath(name: string): string {
  let videoPath = path.join("data", name);

  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = "public/default.mp4";
  }
  return videoPath;
}

export default async function select(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method != "POST") return res.status(405).send("");
  if (!req.body.src) return res.status(400).send("No src included");
  const url = (req.body.src as string).split(":");
  if (url.length != 2) return res.status(400).send("Invalid src format");

  if (url[0] == "youtube") {
    if (url[1].length > 11) return res.status(400).send("Invalid youtube video id");
    if (/[#&?]/.test(url[1])) return res.status(400).send("Invalid youtube video id");
    setVideo(req.body.src);
  } else if (url[0] == "file") {
    console.log(url[1]);
    setVideo("file:" + getPath(url[1]));
  } else {
    return res.status(400).send("Unknown format");
  }
  res.status(200).send("");
}
