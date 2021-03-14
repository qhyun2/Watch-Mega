import type { NextApiRequest, NextApiResponse } from "next";
import * as path from "path";
import * as fs from "fs";

export default async function select(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const reqPath = req.query.slug ? path.join("data", ...(<string[]>req.query.slug)) : "data";

  if ((await fs.promises.stat(reqPath)).isFile()) {
    res.status(400).send("");
    return;
  }

  const files = await fs.promises.readdir(reqPath);
  const response = [];

  for (const file of files) {
    const info = await fs.promises.stat(path.join(reqPath, file));
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
}
