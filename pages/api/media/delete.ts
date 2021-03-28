import type { NextApiRequest, NextApiResponse } from "next";
import { join } from "path";
import * as fs from "fs";
import { logger } from "../../../src/Instances";

const root = "data";

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method != "POST") return res.status(405).send("");
  if (!req.query || !req.query.src) return res.status(404).send("");
  const url = (req.query.src as string).split(":");
  if (url.length != 2) return res.status(404).send("");
  if (url[0] !== "file") return res.status(404).send("");
  let path = url[1];
  if (path.indexOf("\0") !== -1) return res.status(400).send("");
  path = join(root, path);
  if (path.indexOf(root) !== 0) return res.status(400).send("");
  logger.info(`Deleting ${path}`);
  return fs.promises
    .rm(path, { recursive: true })
    .then(() => {
      res.status(200).send("");
    })
    .catch((e) => {
      res.status(400).send(e);
    });
}
