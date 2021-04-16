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
        if (track.cues) {
          Array.from(track.cues).forEach((cue) => {
            cue.startTime += change;
            cue.endTime += change;
          });
        }
      }
    });
    currentOffset.current = offset;
  }, [subtitleDelay]);

  return [subtitleDelay, setSubtitleDelay];
}

export function useSocket(): React.MutableRefObject<SocketIOClient.Socket> {
  const socketRef = useRef() as React.MutableRefObject<SocketIOClient.Socket>;
  useEffect(() => {
    socketRef.current = socketIOClient(process.env.NEXT_PUBLIC_SOCKET_IO_URL);
    return () => {
      socketRef.current.close();
    };
  }, []);
  return socketRef;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const item = window.localStorage.getItem(key);
    setValue(item ? JSON.parse(item) : initialValue);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
}
