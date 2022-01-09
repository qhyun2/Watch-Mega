import { defaultWithSessionRoute } from "../../../lib/withSession";
import { redis } from "../../../src/Instances";
import * as RC from "../../../src/RedisConstants";

export default defaultWithSessionRoute(async (req, res) => {
  const start = parseInt(<string>req.query.start) || 0;
  const end = parseInt(<string>req.query.end) || 5;
  if (end <= start) return res.status(400).send("");
  const history = await redis.zrevrange(RC.VIDEO_HISTORY, start, end, "WITHSCORES");
  const maxPages = Math.ceil((await redis.zcard(RC.VIDEO_HISTORY)) / 5);
  const response = [];

  for (let i = 0; i < history.length; i += 2) {
    const data = JSON.parse(history[i]);
    response.push({
      path: data.path,
      watchPosition: parseFloat(data.watchPosition),
      videoLength: parseFloat(data.videoLength),
      timestamp: parseInt(history[i + 1]),
    });
  }
  res.send({ history: response, maxPages });
});
