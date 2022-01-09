import { logger } from "./Instances";
import { promises as fsPromises } from "fs";
import { exec } from "child_process";

export async function encodeVideo(path: string): Promise<void> {
  const startTime = process.hrtime()[0];

  logger.info(`Encoding video: ${path}`);
  const tempFileName = path + ".temp.mp4";
  const cmdLineFlags = "-c:v libx264 -c:a aac -crf 25 -preset veryfast -f mp4 -movflags +faststart -pix_fmt yuv420p";
  const command = `ffmpeg -i "${path}" ${cmdLineFlags} "${tempFileName}"`;
  logger.info(`Encoding with command: ${command}`);
  await new Promise<void>((resolve, reject) => {
    exec(command, (error, stderr) => {
      if (error || stderr) {
        reject(error);
      }
      resolve();
    });
  });
  await fsPromises.unlink(path);
  await fsPromises.rename(tempFileName, path.replace(/\.[^.]+$/, ".mp4"));
  logger.info(`Encoding finished in ${process.hrtime()[0] - startTime} second(s)`);
}
