import { encodeVideo } from "./Encoder";
import { logger } from "./Instances";
import { getSubs } from "./Subtitler";

export async function processVideos(paths: string[]): Promise<void> {
  logger.info("Beginning to process videos");
  for (const videoPath of paths) {
    logger.info(`Processing: ${videoPath}`);
    await getSubs(videoPath).catch((e) => logger.error(e));
    await encodeVideo(videoPath);
  }
}
