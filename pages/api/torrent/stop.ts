import { defaultWithSessionRoute } from "../../../lib/withSession";
import { tc } from "../../../src/Instances";

export default defaultWithSessionRoute((req, res) => {
  if (req.method != "POST") return res.status(405).send("");
  tc.torrents.forEach((t) => {
    if (t.magnetURI == req.body.magnet) {
      t.destroy({ destroyStore: true });
    }
  });
  res.status(303).redirect("/torrent");
});
