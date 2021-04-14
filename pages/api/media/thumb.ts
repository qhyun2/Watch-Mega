import withSession from "../../../lib/session";
import getInfo from "ffprobe";
import { join } from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";
import { logger } from "../../../src/Instances";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  if (!req.query || !req.query.src) return res.status(404).send("");
  const url = (req.query.src as string).split(":");
  if (url[0] === "file") {
    return fileThumbnail(res, url);
  } else if (url[0] === "youtube") {
    res.redirect(`https://img.youtube.com/vi/${url[1]}/hqdefault.jpg`);
  } else {
    res.status(404).send("");
  }
});

async function fileThumbnail(res, url: string[]): Promise<void> {
  const videoPath = join("data", url[1]);
  if (!existsSync(videoPath)) return res.status(404).send("");

  res.writeHead(200, { "Content-Type": "image/jpeg" });

  // get middle of video
  const info = await getInfo(videoPath, { path: "/usr/bin/ffprobe" });
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
