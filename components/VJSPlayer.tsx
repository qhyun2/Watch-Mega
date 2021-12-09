import React, { useEffect, useRef, useState } from "react";
import { render } from "react-dom";
import { Box, Container, Paper } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { VolumeUp, VolumeDown, VolumeOff } from "@mui/icons-material";

import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from "video.js";
import "videojs-youtube";
import "videojs-overlay";
import "video.js/dist/video-js.min.css";

const useStyles = makeStyles(() => ({
  bezelText: {
    display: "inline-block",
    padding: "10px 20px",
    fontSize: "175%",
    background: "rgba(0, 0, 0, 0.5)",
    pointerEvents: "none",
    borderRadius: "3px",
  },
  bezelTextWrapper: {
    textAlign: "center",
    position: "absolute",
    left: "0%",
    right: "0%",
    top: "10%",
  },
  bezelIconWrapper: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "55px",
    height: "55px",
    marginLeft: "-27px",
    marginTop: "-27px",
    background: "rgba(0, 0, 0, 0.5)",
    borderRadius: "27px",
    animation: "$fadeout 0.5s linear 1 normal forwards",
    pointerEvents: "none",
  },
  icon: {
    width: "35px",
    height: "35px",
    margin: "10px",
  },
  "@keyframes fadeout": {
    "0%": {
      opacity: "1",
    },
    "100%": {
      opacity: "0",
      webkitTransform: "scale(2)",
      transform: "scale(2)",
    },
  },
}));

// eslint-disable-next-line react/jsx-key
const VOLUME_ICONS = [<VolumeOff fontSize="large" />, <VolumeUp fontSize="large" />, <VolumeDown fontSize="large" />];

const VJSPlayer: React.FC<{
  vjs: React.MutableRefObject<VideoJsPlayer>;
  volume: number;
  cb: () => void;
}> = (props) => {
  const classes = useStyles();
  const playerRef = useRef() as React.MutableRefObject<HTMLVideoElement>;
  const currentTimeout = useRef() as React.MutableRefObject<NodeJS.Timeout>;
  const overlay = useRef() as React.MutableRefObject<HTMLDivElement>;
  const firstUpdate = useRef(true);
  const [volumeIndicator, setVolumeIndicator] = useState(false);
  const prevVolume = useRef(props.volume);
  const [volumeType, setVolumeType] = useState(0);

  if (props.volume != prevVolume.current) {
    if (props.volume == 0) {
      setVolumeType(0);
    } else if (props.volume > prevVolume.current) {
      setVolumeType(1);
    } else {
      setVolumeType(2);
    }
    prevVolume.current = props.volume;
  }

  useEffect(() => {
    if (props.vjs.current) return;
    props.vjs.current = videojs(
      playerRef.current,
      {
        techOrder: ["youtube", "html5"],
        sources: [{ type: "video/mp4", src: "/default.mp4" }],
        controlBar: { volumePanel: false },
        enableSourceset: true,
      } as VideoJsPlayerOptions,
      () => {
        overlay.current = document.createElement("div");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (props.vjs.current as any).overlay({ content: overlay.current });
        props.cb();
      }
    );
  }, [props]);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (overlay.current) {
      render(
        <Box display={volumeIndicator ? "block" : "none"}>
          <div className={classes.bezelTextWrapper}>
            <div className={classes.bezelText + " bezel-text"}>{Math.round(props.volume * 100)}%</div>
          </div>
          <div key={props.volume} className={classes.bezelIconWrapper}>
            <div className={classes.icon}>{VOLUME_ICONS[volumeType]}</div>
          </div>
        </Box>,
        overlay.current
      );
    }
  }, [
    volumeIndicator,
    props.volume,
    volumeType,
    classes.bezelTextWrapper,
    classes.bezelText,
    classes.bezelIconWrapper,
    classes.icon,
  ]);

  useEffect(() => {
    props.vjs.current.volume(props.volume);
    setVolumeIndicator(true);
    if (currentTimeout.current) clearTimeout(currentTimeout.current);
    currentTimeout.current = setTimeout(() => setVolumeIndicator(false), 500);
  }, [props.vjs, props.volume]);

  return (
    <Container maxWidth="md">
      <Paper elevation={12}>
        <div data-vjs-player>
          <video ref={playerRef} className="video-js vjs-fluid vjs-lime" controls preload="auto" />
        </div>
      </Paper>
    </Container>
  );
};

export default VJSPlayer;
