import React, { useState, useEffect, useRef, MutableRefObject, useCallback } from "react";

import Navbar from "../components/Navbar";
import ThickSlider from "../components/ThickSlider";
import ChatBox from "../components/Chat";
import VideoBar from "../components/VideoBar";
import PlayingPopup from "../components/PlayingPopup";
import VJSPlayer from "../components/VJSPlayer";
import SyncDebug from "../components/SyncDebug";

import { VideoState } from "../lib/VideoState";
import { useSubtitleDelay, useSocket, useLocalStorage, useIsMobile, useSubtitleEnabled } from "../lib/hooks";
import { VideoJsPlayer } from "video.js";
import Toastify from "toastify-js";
import canAutoPlay from "can-autoplay";

import {
  Box,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { PlayArrow, SkipPrevious, SkipNext, Pause } from "@mui/icons-material";

// authentication
import { defaultServerSidePropsAuth } from "../lib/withSession";
export { defaultServerSidePropsAuth as getServerSideProps };

const useStyles = makeStyles((theme) => ({
  sliders: {
    order: 1,
    [theme.breakpoints.down("lg")]: {
      order: 2,
    },
  },
  controls: {
    order: 2,
    [theme.breakpoints.down("lg")]: {
      order: 1,
    },
  },
  toggles: {
    order: 3,
    [theme.breakpoints.down("lg")]: {
      order: 3,
    },
  },
}));

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 2.5, 3];
const PLAYBACK_LABELS = [0.25, 1, 2, 3];

const Index: React.FC = () => {
  const socket = useSocket();
  const vjs = useRef() as MutableRefObject<VideoJsPlayer>;

  const ignoreSeek = useRef(false);
  const ignorePlay = useRef(false);
  const ignorePause = useRef(false);
  const firstPlay = useRef(true);

  const [playingPopup, setplayingPopup] = useState(false);
  const [subtitleDelay, setSubtitleDelay] = useSubtitleDelay(vjs);
  const [subtitleEnabled, setSubtitleEnabled] = useSubtitleEnabled(vjs);
  const [count, setCount] = useState(0);
  const [videoName, setVideoName] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(PLAYBACK_SPEEDS.indexOf(1));

  const [videoState, setVideoState] = useState<VideoState>({ isPaused: true, position: 0, name: "" });

  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // local state
  const [disableControls, setDisableControls] = useState(false);
  const [volume, setVolume] = useLocalStorage("volume", 0.7);

  const classes = useStyles();
  const isMobile = useIsMobile();

  const updateCurrentTime = useCallback(() => {
    ignoreSeek.current = true;
    vjs.current.currentTime(videoState.position);
  }, [videoState.position]);

  const handleHotkeys = useCallback(
    (e) => {
      if (disableControls) return;

      if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case "f":
            vjs.current.isFullscreen() ? vjs.current.exitFullscreen() : vjs.current.requestFullscreen();
            e.preventDefault();
            break;
          case "k":
          case " ":
            vjs.current.paused() ? vjs.current.play() : vjs.current.pause();
            e.preventDefault();
            break;
          case "l":
            seek(10);
            e.preventDefault();
            break;
          case "ArrowRight":
            seek(5);
            e.preventDefault();
            break;
          case "j":
            seek(-10);
            e.preventDefault();
            break;
          case "ArrowLeft":
            seek(-5);
            e.preventDefault();
            break;
          case "ArrowUp":
            setVolume((vol) => Math.min(vol + 0.05, 1));
            e.preventDefault();
            break;
          case "ArrowDown":
            setVolume((vol) => Math.max(vol - 0.05, 0));
            e.preventDefault();
            break;
          case "[":
            setPlaybackSpeed((speed) => Math.max(0, speed - 1));
            break;
          case "]":
            setPlaybackSpeed((speed) => Math.min(PLAYBACK_SPEEDS.length - 1, speed + 1));
            break;
          case "o":
            setShowDebugOverlay((value) => !value);
            break;
          case "c":
            setSubtitleEnabled((value) => !value);
            break;
        }
      }
    },
    [disableControls, setVolume, setSubtitleEnabled]
  );

  // new video
  useEffect(() => {
    if (!videoName) return;
    const url = new URL(videoName);

    if (url.protocol === "file:") {
      vjs.current.src({ type: "video/mp4", src: `/api/media?t=${Math.random()}` });
      vjs.current.addRemoteTextTrack(
        { src: "api/media/subs", kind: "subtitles", srclang: "en", label: "English" },
        false
      );
      vjs.current.textTracks()[0].mode = "showing";
    } else if (url.protocol === "youtube:") {
      let videoID = url.pathname;
      while (videoID[0] === "/") videoID = videoID.substr(1);
      vjs.current.src({
        type: "video/youtube",
        src: `http://www.youtube.com/watch?v=${videoID}&rel=0&modestbranding=1`,
      });
    } else {
      throw "Unknown protocol: " + url.protocol;
    }
  }, [videoName]);

  useEffect(() => {
    // TODO tighten threshold for updating postition once new watchers joining does not cause state broadcast
    if (Math.abs(videoState.position - vjs.current.currentTime()) > 2) updateCurrentTime();
    if (videoState.isPaused !== vjs.current.paused()) {
      if (videoState.isPaused) {
        pause();
      } else {
        if (firstPlay.current) {
          canAutoPlay.video().then(({ result }) => {
            if (result === true) {
              firstPlay.current = false;
              play();
            } else {
              setplayingPopup(true);
            }
          });
        } else {
          play();
        }
      }
    }
  }, [updateCurrentTime, videoState, videoName]);

  useEffect(() => {
    document.addEventListener("keydown", handleHotkeys);
    return () => {
      document.removeEventListener("keydown", handleHotkeys);
    };
  }, [vjs, handleHotkeys]);

  function play(): void {
    ignorePlay.current = true;
    vjs.current.play();
  }

  function pause(): void {
    ignorePause.current = true;
    vjs.current.pause();
  }

  function seek(amount: number): void {
    vjs.current.currentTime(vjs.current.currentTime() + amount);
  }

  function initSocket(): void {
    socket.current.on("state", (state: VideoState) => {
      console.log("got state:", state);
      setVideoName(state.name);
      setVideoState(state);
    });
    socket.current.on("watching", (msg: { count: number }) => {
      setCount(msg.count);
    });
  }

  function initVideoListeners(): void {
    vjs.current.on("seeked", () => {
      if (ignoreSeek.current) {
        ignoreSeek.current = false;
        return;
      }
      socket.current.emit("seek", vjs.current.currentTime());
      console.log("seeked", vjs.current.currentTime());
    });
    vjs.current.on("play", () => {
      if (ignorePlay.current) {
        ignorePlay.current = false;
        return;
      }
      socket.current.emit("play", vjs.current.currentTime());
      console.log("play", vjs.current.currentTime());
    });
    vjs.current.on("pause", () => {
      if (ignorePause.current) {
        ignorePause.current = false;
        return;
      }
      socket.current.emit("pause", vjs.current.currentTime());
    });

    // don't focus fullscreen button after it is used
    vjs.current.on("fullscreenchange", () => {
      if (document.activeElement.classList.contains("vjs-fullscreen-control"))
        (document.activeElement as HTMLElement).blur();
    });
  }

  function renderControls(): JSX.Element {
    return (
      <Box pt={isMobile ? 0 : 4}>
        <Container maxWidth="md" style={isMobile ? { padding: 0 } : undefined}>
          <Paper>
            <Box p={4}>
              <FormControl style={{ width: "100%" }}>
                <Grid container justifyContent="center" alignContent="center" spacing={2}>
                  <Grid item sm={3} xs={12} className={classes.sliders}>
                    <Typography>Volume</Typography>
                    <ThickSlider
                      min={0}
                      max={100}
                      value={Math.round(volume * 100)}
                      onChange={(_, value) => setVolume((value as number) / 100)}
                      valueLabelDisplay="auto"
                    />
                    <Typography>Playback Speed</Typography>
                    <ThickSlider
                      disabled={disableControls}
                      marks={PLAYBACK_LABELS.map((v) => ({ value: PLAYBACK_SPEEDS.indexOf(v), label: v + "x" }))}
                      max={PLAYBACK_SPEEDS.length - 1}
                      min={0}
                      onChange={(_, value) => {
                        setPlaybackSpeed(value as number);
                        vjs.current.playbackRate(PLAYBACK_SPEEDS[value as number]);
                      }}
                      onChangeCommitted={(_, value) => socket.current.emit("playbackrate", value as number)}
                      value={playbackSpeed}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => PLAYBACK_SPEEDS[v] + "x"}
                    />
                  </Grid>
                  <Grid item sm={6} xs={12} className={classes.controls} container justifyContent="center">
                    <Grid item container justifyContent="center" wrap="nowrap">
                      <IconButton onClick={() => socket.current.emit("prev")} disabled={disableControls} size="large">
                        <SkipPrevious fontSize="large" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          vjs.current.paused() ? vjs.current.play() : vjs.current.pause();
                        }}
                        disabled={disableControls}
                        size="large">
                        {videoState.isPaused ? <PlayArrow fontSize="large" /> : <Pause fontSize="large" />}
                      </IconButton>
                      <IconButton onClick={() => socket.current.emit("next")} disabled={disableControls} size="large">
                        <SkipNext fontSize="large" />
                      </IconButton>
                    </Grid>
                    <Grid item>
                      <Container maxWidth="xs">
                        <TextField
                          id="standard-number"
                          label="Subtitle delay (ms)"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          type="number"
                          inputProps={{ step: "50" }}
                          value={subtitleDelay}
                          onChange={(e) => setSubtitleDelay(parseInt(e.target.value))}
                          disabled={disableControls}
                        />
                      </Container>
                    </Grid>
                  </Grid>
                  <Grid item sm={3} xs={12} className={classes.toggles}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            color="primary"
                            checked={disableControls}
                            onChange={(e) => setDisableControls(e.target.checked)}
                          />
                        }
                        label="Disable Controls"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            color="primary"
                            checked={subtitleEnabled}
                            onChange={(e) => setSubtitleEnabled(e.target.checked)}
                            disabled={disableControls}
                          />
                        }
                        label="Subtitles"
                      />
                      <FormControlLabel
                        control={<Switch color="primary" disabled={disableControls || true} />}
                        label="Ready Check"
                      />
                      <FormControlLabel
                        control={<Switch color="primary" disabled={disableControls || true} />}
                        label="Autoplay"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </FormControl>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <React.Fragment>
      <header>
        <Navbar page="Watch" />
      </header>
      <Box>
        <VideoBar name={videoName} />
        <Box pt={isMobile ? 0 : 3} style={{ pointerEvents: disableControls ? "none" : "auto" }}>
          <VJSPlayer
            vjs={vjs}
            volume={volume}
            cb={() => {
              initSocket();
              initVideoListeners();
            }}
          />
        </Box>
        {renderControls()}
      </Box>
      <PlayingPopup
        open={playingPopup}
        cb={() => {
          // TODO fix seeking issues with youtube player
          setplayingPopup(false);
          socket.current.emit("reqsync");
          vjs.current.one("play", () => {
            updateCurrentTime();
          });
        }}
      />
      <ChatBox userlist={{ count: count, usernames: [] }} />
      {showDebugOverlay && <SyncDebug videoState={videoState} vjs={vjs.current} videoName={videoName} />}
    </React.Fragment>
  );
};

export default Index;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendNotif(msg: string): void {
  Toastify({
    text: msg,
    duration: 4000,
    newWindow: true,
    gravity: "bottom",
    position: "left",
    stopOnFocus: true,
    backgroundColor: "#6c757d",
  }).showToast();
}
