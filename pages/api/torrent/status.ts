import type { NextApiRequest, NextApiResponse } from "next";
import { tc } from "../../../src/Instances";

export default function status(req: NextApiRequest, res: NextApiResponse) {
  const info = [];
  tc.torrents.forEach((t) => {
    info.push({ name: t.name, value: t.progress, id: t.magnetURI });
  });
  res.status(200).send(info);
}
