import React, { useState, useRef, useEffect } from "react";
import { VideoJsPlayer } from "video.js";
import socketIOClient from "socket.io-client";

export function useSubtitleDelay(
  vjs: React.MutableRefObject<VideoJsPlayer>
): [number, React.Dispatch<React.SetStateAction<number>>] {
  const [subtitleDelay, setSubtitleDelay] = useState(0);
  const currentOffset = useRef(0);

  useEffect(() => {
    const offset = subtitleDelay / 1000;
    if (isNaN(offset)) return;
    const change = offset - currentOffset.current;
    Array.from(vjs.current.textTracks()).forEach((track) => {
      if (track.mode === "showing") {
        Array.from(track.cues).forEach((cue) => {
          cue.startTime += change;
          cue.endTime += change;
        });
      }
    });
    currentOffset.current = offset;
  }, [subtitleDelay]);

  return [subtitleDelay, setSubtitleDelay];
}

export function useSocket(): React.MutableRefObject<SocketIOClient.Socket> {
  const socketRef = useRef<SocketIOClient.Socket>();
  useEffect(() => {
    socketRef.current = socketIOClient();
    return () => {
      socketRef.current.close();
    };
  }, []);
  return socketRef;
}
