import withSession from "../../../lib/session";
import { join } from "path";
import * as fs from "fs";
import { logger } from "../../../src/Instances";

const root = "data";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  if (req.method != "POST") return res.status(405).send("");
  console.log(typeof req.body);
  if (!req.body || !req.body.src) return res.status(404).send("");
  const url = (req.body.src as string).split(":");
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
});
