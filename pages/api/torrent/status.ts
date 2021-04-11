import withSession from "../../../lib/session";
import { tc } from "../../../src/Instances";

interface Torrent {
  name: string;
  value: number;
  id: string;
}

export default withSession((req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  const info: Torrent[] = [];
  tc.torrents.forEach((t) => {
    info.push({ name: t.name, value: t.progress, id: t.magnetURI });
  });
  res.status(200).send(info);
});
