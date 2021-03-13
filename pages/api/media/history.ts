import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "../../../src/Instances";
import * as RC from "../../../src/RedisConstants";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const start = parseInt(<string>req.query.start) || 0;
  const end = parseInt(<string>req.query.end) || 5;
  if (end <= start) return res.status(400).send("");
  const history = await redis.zrevrange(RC.VIDEO_HISTORY, start, end, "WITHSCORES");
  const response = [];
  for (let i = 0; i < history.length; i += 2) {
    response.push({ name: history[i], timestamp: parseInt(history[i + 1]) });
  }
  res.send({ history: response });
  res.writeHead(200, { "Content-Type": "application/json" });
}
