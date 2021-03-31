import withSession from "../../../lib/session";
import { join } from "path";
import * as fs from "fs";

const root = "data";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();
  if (!req.query || !req.query.src) return res.status(404).send("");
  const url = (req.query.src as string).split(":");
  if (url.length != 2) return res.status(404).send("");
  if (url[0] !== "file") return res.status(404).send("");
  let path = url[1];
  if (path.indexOf("\0") !== -1) return res.status(400).send("");
  path = join(root, path);
  if (path.indexOf(root) !== 0) return res.status(400).send("");

  if ((await fs.promises.stat(path)).isFile()) {
    res.status(400).send("");
    return;
  }

  const files = await fs.promises.readdir(path);
  const response = [];

  for (const file of files) {
    const info = await fs.promises.stat(join(path, file));
    let type;
    if (info.isDirectory()) {
      type = "folder";
    } else if (file.match(/.(mov|mpeg|mkv|mp4|wmv|flv|avi)$/i)) {
      type = "media";
    } else {
      type = "other";
    }
    response.push({ name: file, size: info.size, added: info.ctimeMs, type });
  }

  res.setHeader("Content-Type", "application/json");
  res.send({ files: response });
});
