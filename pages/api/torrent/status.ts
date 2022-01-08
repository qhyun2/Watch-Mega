import { defaultWithSessionRoute } from "../../../lib/withSession";
import { tc } from "../../../src/Instances";

interface Torrent {
  name: string;
  value: number;
  id: string;
}

export default defaultWithSessionRoute((req, res) => {
  const info: Torrent[] = [];
  tc.torrents.forEach((t) => {
    info.push({ name: t.name, value: t.progress, id: t.magnetURI });
  });
  res.status(200).send(info);
});
