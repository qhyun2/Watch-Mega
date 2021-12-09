import React from "react";
import { VideoJsPlayer } from "video.js";
import { VideoState } from "../lib/VideoState";

const SyncDebug: React.FC<{ videoState: VideoState; vjs: VideoJsPlayer; videoName: string }> = (props) => {
  const [, forceUpdate] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate(Date.now()), 117);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!props.vjs) return null;

  return (
    <div style={{ position: "fixed", bottom: 10, left: 10 }}>
      <div>
        <div style={{ color: "orangered" }}>Server state:</div>
        position: {props.videoState.position.toFixed(2)}
        <br />
        paused: {`${props.videoState.isPaused}`}
        <br />
        {/* name: {props.videoState.name}
        <br /> */}
        <div style={{ color: "lightblue" }}>Client state:</div>
        position: {props.vjs.currentTime().toFixed(2)}
        <br />
        paused: {`${props.vjs.paused()}`}
        <br />
        ready: {`${props.vjs.readyState()}`}
        <br />
        {/* name: {props.videoName}
        <br /> */}
      </div>
    </div>
  );
};

export default SyncDebug;
