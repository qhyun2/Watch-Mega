import withSession from "../../../lib/session";
import axios from "axios";
import { stringify } from "qs";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  if (!req.query || !req.query.id) return res.status(404).send("");

  const query = stringify({
    id: req.query.id,
    fields: "items(snippet(title),statistics)",
    part: "snippet",
    key: process.env.YOUTUBE_API_KEY,
  });

  return axios.get(`https://www.googleapis.com/youtube/v3/videos?` + query).then((apiRes) => {
    res.status(200).send(apiRes.data.items[0]?.snippet.title);
  });
});
