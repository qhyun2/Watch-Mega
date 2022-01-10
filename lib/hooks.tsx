import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
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
  }, [subtitleDelay, vjs]);

  return [subtitleDelay, setSubtitleDelay];
}

export function useSubtitleEnabled(
  vjs: React.MutableRefObject<VideoJsPlayer>
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);

  useEffect(() => {
    Array.from(vjs.current.textTracks()).forEach((track) => {
      track.mode = subtitleEnabled ? "showing" : "hidden";
    });
  }, [subtitleEnabled, vjs]);

  return [subtitleEnabled, setSubtitleEnabled];
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
  }, [initialValue, key]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("md"));
}
