import React, { useEffect, useRef } from "react";
import { Container, Paper } from "@material-ui/core";

import videojs, { VideoJsPlayer } from "video.js";
import "videojs-youtube";
import "video.js/dist/video-js.min.css";

const VJSPlayer: React.FC<{ vjs: React.MutableRefObject<VideoJsPlayer>; cb: () => void }> = (props) => {
  const playerRef = useRef() as React.MutableRefObject<HTMLVideoElement>;

  useEffect(() => {
    if (props.vjs.current) return;
    props.vjs.current = videojs(
      playerRef.current,
      {
        techOrder: ["youtube", "html5"],
        sources: [{ type: "video/mp4", src: "/default.mp4" }],
        controlBar: { volumePanel: false },
      },
      props.cb
    );
  }, []);

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
