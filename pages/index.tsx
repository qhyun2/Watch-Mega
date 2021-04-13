import React, { useState, useEffect, useRef, MutableRefObject } from "react";

import Navbar from "../components/Navbar";
import ThickSlider from "../components/thickSlider";
import ChatBox from "../components/chat";
import VideoBar from "../components/videoBar";
import PlayingPopup from "../components/playingPopup";
import VJSPlayer from "../components/vjsPlayer";

import { useSubtitleDelay, useSocket } from "../components/hooks";
import { VideoJsPlayer } from "video.js";
import Toastify from "toastify-js";

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
  makeStyles,
} from "@material-ui/core";
import { PlayArrow, SkipPrevious, SkipNext, Pause } from "@material-ui/icons";

// authentication
import { defaultAuth } from "../lib/Auth";
export { defaultAuth as getServerSideProps };

const useStyles = makeStyles((theme) => ({
  sliders: {
    order: 1,
    [theme.breakpoints.down("xs")]: {
      order: 2,
    },
  },
  controls: {
    order: 2,
    [theme.breakpoints.down("xs")]: {
      order: 1,
    },
  },
  toggles: {
    order: 3,
    [theme.breakpoints.down("xs")]: {
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

  const [playingPopup, setplayingPopup] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [subtitleDelay, setSubtitleDelay] = useSubtitleDelay(vjs);
  const [count, setCount] = useState(0);
  const [videoName, setVideoName] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(PLAYBACK_SPEEDS.indexOf(1));
  const [disableControls, setDisableControls] = useState(false);

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

  function onPlayerReady(): void {
    vjs.current.volume(0.8);
    initHotkeys();
    initSocket();
    initVideoListeners();
  }

  function initHotkeys(): void {
    document.addEventListener("keydown", (e) => {
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
            vjs.current.volume(Math.min(vjs.current.volume() + 0.1, 1));
            e.preventDefault();
            break;
          case "ArrowDown":
            vjs.current.volume(Math.max(vjs.current.volume() - 0.1, 0));
            e.preventDefault();
            break;
          case "[":
            setPlaybackSpeed(Math.max(0, playbackSpeed - 1));
            break;
          case "]":
            setPlaybackSpeed(Math.min(PLAYBACK_SPEEDS.length - 1, playbackSpeed + 1));
            break;
        }
      }
    });
  }

  function seek(amount: number): void {
    vjs.current.currentTime(vjs.current.currentTime() + amount);
  }

  function initSocket(): void {
    socket.current.on("info", (info: { playing: boolean; videoName: string }) => {
      setplayingPopup(info.playing);
      setVideoName(info.videoName);
    });
    // video events from server
    socket.current.on("seek", (user: string, time: number) => {
      ignoreSeek.current = true;
      vjs.current.currentTime(time);
      if (user) sendNotif(`${user} seeked the video`);
    });
    socket.current.on("play", (user: string, time: number) => {
      ignorePlay.current = true;
      ignoreSeek.current = true;
      vjs.current.currentTime(time);
      setPlaying(true);
      vjs.current.play();
      if (user) sendNotif(`${user} played the video`);
    });
    socket.current.on("pause", (user: string, time: number) => {
      ignorePause.current = true;
      ignoreSeek.current = true;
      vjs.current.pause();
      setPlaying(false);
      vjs.current.currentTime(time);
      if (user) sendNotif(`${user} paused the video`);
    });
    socket.current.on("newvideo", (name: string) => {
      setVideoName(name);
      setPlaying(false);
    });

    // users watching
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
    });
    vjs.current.on("play", () => {
      if (ignorePlay.current) {
        ignorePlay.current = false;
        return;
      }
      socket.current.emit("play", vjs.current.currentTime());
      setPlaying(true);
    });
    vjs.current.on("pause", () => {
      if (ignorePause.current) {
        ignorePause.current = false;
        return;
      }
      socket.current.emit("pause", vjs.current.currentTime());
      setPlaying(false);
    });
  }

  function renderControls(): JSX.Element {
    const classes = useStyles();
    return (
      <Box pt={4}>
        <Container maxWidth="md">
          <Paper>
            <Box p={4}>
              <FormControl style={{ width: "100%" }}>
                <Grid container justify="center" alignContent="center" spacing={2}>
                  <Grid item sm={3} xs={12} className={classes.sliders}>
                    <Typography>Volume</Typography>
                    <ThickSlider
                      min={0}
                      max={100}
                      defaultValue={80}
                      onChange={(_, value) => vjs.current.volume((value as number) / 100)}
                      valueLabelDisplay="auto"
                      disabled={disableControls}
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
                  <Grid item sm={6} xs={12} className={classes.controls} container justify="center">
                    <Grid item container justify="center" wrap="nowrap">
                      <IconButton onClick={() => socket.current.emit("prev")} disabled={disableControls}>
                        <SkipPrevious fontSize="large" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          vjs.current.paused() ? vjs.current.play() : vjs.current.pause();
                        }}
                        disabled={disableControls}>
                        {playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                      </IconButton>
                      <IconButton onClick={() => socket.current.emit("next")} disabled={disableControls}>
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
        <Box pt={3} style={{ pointerEvents: disableControls ? "none" : "auto" }}>
          <VJSPlayer vjs={vjs} cb={() => onPlayerReady()} />
        </Box>
        {renderControls()}
      </Box>
      <PlayingPopup
        open={playingPopup}
        cb={() => {
          setplayingPopup(false);
          socket.current.emit("ready");
        }}
      />
      <ChatBox userlist={{ count: count, usernames: [] }} />
    </React.Fragment>
  );
};

export default Index;

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
