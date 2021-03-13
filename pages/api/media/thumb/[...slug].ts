import type { NextApiRequest, NextApiResponse } from "next";
import getInfo from "ffprobe";
import { path as ffprobePath } from "ffprobe-static";
import { join } from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";
import { logger } from "../../../../src/Instances";

export default async function select(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const videoPath = join("data", ...(<string[]>req.query.slug));

  if (!existsSync(videoPath)) {
    res.status(404).send("");
    return;
  }

  res.writeHead(200, { "Content-Type": "image/jpeg" });

  // get middle of video
  const info = await getInfo(videoPath, { path: ffprobePath });
  let middle = info.streams[0].duration / 2;
  if (isNaN(middle)) middle = 300;

  const ow = 384;
  const oh = 216;

  const ffmpeg = spawn("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    middle.toString(),
    "-i",
    videoPath,
    "-filter:v",
    `scale=w=max(${ow}\\,a*${oh}):h=max(${oh}\\,${ow}/a),crop=${ow}:${oh}`,
    "-vframes",
    "1",
    "-f",
    "image2",
    "-",
  ]);

  ffmpeg.stdout.pipe(res);
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (data) => {
    logger.error("Thumbnail generation error: " + data);
  });
}
