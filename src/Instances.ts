import WebTorrent from "webtorrent";
import * as path from "path";
import { logger } from "./Logger";
import { processVideos } from "./VideoProcessor";

export const tc = new WebTorrent();
