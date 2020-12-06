import * as fs from "fs";
import { Request, Response } from "express";
import { logger } from "./helpers/Logger";

export async function serveSubs(req: Request, res: Response, name: string): Promise<void> {
  if (!name) {
    res.sendStatus(200);
    return;
  }

  const subsPath = name + ".vtt";
  if (!fs.existsSync(subsPath)) {
    logger.info("Subs not found");
  }
  logger.info(`Serving subs file ${subsPath}`);
  fs.createReadStream(subsPath).pipe(res);
}
