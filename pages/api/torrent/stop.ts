import withSession from "../../../lib/session";
import { tc } from "../../../src/Instances";

export default withSession((req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  if (req.method != "POST") return res.status(405).send("");
  tc.torrents.forEach((t) => {
    if (t.magnetURI == req.body.magnet) {
      t.destroy({ destroyStore: true });
    }
  });
  res.status(303).redirect("/torrent");
});
