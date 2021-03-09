import type { NextApiRequest, NextApiResponse } from "next";
import { tc } from "../../../src/Instances";

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(405).send("");
  tc.torrents.forEach((t) => {
    if (t.magnetURI == req.body.magnet) {
      t.destroy({ destroyStore: true });
    }
  });
  res.status(303).redirect("/torrent");
}
