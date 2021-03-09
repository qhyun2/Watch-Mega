import { logger } from "./Instances";
import { promises as fsPromises } from "fs";
import MediaInfoFactory from "mediainfo.js/dist/mediainfo";
import type { MediaInfo, ReadChunkFunc, ResultObject } from "mediainfo.js/dist/types";
import { exec } from "child_process";

export async function encodeVideo(path: string): Promise<void> {
  const startTime = process.hrtime()[0];

  logger.info(`Encoding video: ${path}`);
  const codecInfo = await getCodecInfo(path);
  const videoCodec = "-c:v " + (codecInfo.video === "AVC" ? "copy" : "libx264");
  const audioCodec = "-c:a " + (codecInfo.audio === "AAC" ? "copy" : "aac");
  const settings = "-crf 22 -preset faster -f mp4";
  const command = `ffmpeg -i "${path}" ${videoCodec} ${settings} ${audioCodec} "${path + ".mp4"}"`;
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
  await fsPromises.rename(path + ".mp4", path);
  logger.info(`Encoding finished in ${process.hrtime()[0] - startTime} second(s)`);
}

interface CodecInfo {
  video: string;
  audio: string;
}

export async function getCodecInfo(path: string): Promise<CodecInfo> {
  let fileHandle: fsPromises.FileHandle | undefined;
  let fileSize: number;
  let mediainfo: MediaInfo | undefined;

  const readChunk: ReadChunkFunc = async (size, offset) => {
    const buffer = new Uint8Array(size);
    await (fileHandle as fsPromises.FileHandle).read(buffer, 0, size, offset);
    return buffer;
  };

  try {
    fileHandle = await fsPromises.open(path, "r");
    fileSize = (await fileHandle.stat()).size;
    mediainfo = (await MediaInfoFactory()) as MediaInfo;
    const result = <ResultObject>await mediainfo.analyzeData(() => fileSize, readChunk);
    const tracks = result.media.track;
    const video = tracks.find((x) => x["@type"] == "Video");
    const audio = tracks.find((x) => x["@type"] == "Audio");

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { video: video.Format, audio: audio.Format };
  } finally {
    fileHandle && (await fileHandle.close());
    mediainfo && mediainfo.close();
  }
}
