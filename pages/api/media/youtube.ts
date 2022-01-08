import { defaultWithSessionRoute } from "../../../lib/withSession";
import axios from "axios";
import { stringify } from "qs";

export default defaultWithSessionRoute(async (req, res) => {
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
