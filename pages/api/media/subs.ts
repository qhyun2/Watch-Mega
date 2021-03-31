import withSession from "../../../lib/session";
import * as fs from "fs";
import { redis } from "../../../src/Instances";
import * as RC from "../../../src/RedisConstants";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  const url = (await redis.get(RC.REDIS_VIDEO_PATH)).split(":");

  if (url[0] != "file") {
    return res.status(200).send("");
  }

  const subsPath = url[1] + ".vtt";
  res.setHeader("Content-Type", "text/vtt");
  if (!fs.existsSync(subsPath)) {
    return sendEmpty(res);
  }

  fs.createReadStream(subsPath).pipe(res);
});

async function sendEmpty(res): Promise<void> {
  res.send("WEBVTT");
  res.status(200);
}
