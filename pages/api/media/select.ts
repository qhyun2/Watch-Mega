import { createAuthedApiRoute } from "../../../lib/withSession";
import * as path from "path";
import * as fs from "fs";
import { setVideo } from "../../../src/VideoServer";

const router = createAuthedApiRoute();

function getPath(name: string): string {
  let videoPath = path.join("data", name);

  // default file
  const exists = fs.existsSync(videoPath) && fs.statSync(videoPath).isFile();

  if (!exists) {
    videoPath = "public/default.mp4";
  }
  return videoPath;
}

router.post(async (req, res) => {
  if (!req.body.src) return res.status(400).send("No src included");
  const url = (req.body.src.path as string).split(":");
  if (url.length != 2) return res.status(400).send("Invalid src format");

  const position = req.body.src.watchPosition || 0;

  if (url[0] == "youtube") {
    if (url[1].length > 11) return res.status(400).send("Invalid youtube video id");
    if (/[#&?]/.test(url[1])) return res.status(400).send("Invalid youtube video id");
    setVideo(req.body.src as string, position);
  } else if (url[0] == "file") {
    setVideo("file:" + getPath(url[1]), position);
  } else {
    return res.status(400).send("Unknown format");
  }
  res.status(200).send("");
});

export default router;
