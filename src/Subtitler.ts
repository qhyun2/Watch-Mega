import OpenSubtitles from "opensubtitles-api";
import Axios from "axios";
import * as fs from "fs";
import srt2vtt from "srt-to-vtt";
import { logger } from "./Instances";

const OS = new OpenSubtitles({
  ssl: true,
  useragent: "TemporaryUserAgent",
  username: process.env.OPEN_SUBS_USER,
  password: process.env.OPEN_SUBS_PASS,
});

export function getSubs(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getSubUrl(filePath)
      .then((url) => {
        logger.info(`Downloading subs: ${url}`);
        downloadSubs(url, filePath + ".vtt");
        resolve();
      })
      .catch((e) => {
        reject(`Error getting subs: ${e}`);
      });
  });
}

export function downloadSubs(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    Axios({
      url,
      method: "GET",
      responseType: "stream",
    })
      .then((res) => {
        // convert srt encoded subs to vtt before writing to file
        res.data.pipe(srt2vtt()).pipe(writer);
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
}

export function getSubUrl(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    OS.search({
      sublanguageid: "eng",
      path: filePath,
      limit: 2,
    })
      .then(async (subtitles) => {
        try {
          resolve(subtitles.en[0].url);
        } catch {
          reject(`Subs not found for ${filePath}`);
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
}

// open subs example response
// {
//   en: [
//     {
//       url:
//         "https://dl.opensubtitles.org/en/download/src-api/...",
//       langcode: "en",
//       downloads: 13403,
//       lang: "English",
//       encoding: "UTF-8",
//       id: "1954855337",
//       filename: "BoJack.Horseman.S02E05.Chickens.1080p.NF.WEBRip.DD5.1.x264-SNEAkY-eng.srt",
//       date: "2015-08-17 18:56:07",
//       score: 9,
//       fps: 25,
//       format: "srt",
//       utf8:
//         "https://dl.opensubtitles.org/en/download/subencoding-utf8/...",
//       vtt:
//         "https://dl.opensubtitles.org/en/download/subformat-vtt/src-api/...",
//     },
//   ];
// }
