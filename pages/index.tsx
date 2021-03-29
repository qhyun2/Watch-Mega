import React from "react";

import Navbar from "../components/navbar";

import videojs, { VideoJsPlayer } from "video.js";
import "videojs-youtube";
import "video.js/dist/video-js.min.css";

import socketIOClient from "socket.io-client";
import Toastify from "toastify-js";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
import { NavigateBefore, NavigateNext, PlayArrow, SkipPrevious, SkipNext, Pause } from "@material-ui/icons";

interface state {
  playingPopup: boolean;
  playing: boolean;
  subtitleDelay: number;
  usernames: string[];
  count: number;
  videoName: string;
}

export default class Index extends React.Component<unknown, state> {
  vjs: VideoJsPlayer;
  isInputing;
  socket: SocketIOClient.Socket;
  currentOffset = 0;
  ignoreSeek = false;
  ignorePlay = false;
  ignorePause = false;

  constructor(props) {
    super(props);

    this.state = {
      playingPopup: false,
      playing: false,
      subtitleDelay: 0,
      usernames: [],
      count: 0,
      videoName: "",
    };

    if (!this.socket) this.socket = socketIOClient();
  }

  componentDidMount(): void {
    this.vjs = videojs(
      "video",
      {
        techOrder: ["youtube", "html5"],
        sources: [{ type: "video/mp4", src: "/default.mp4" }],
      },
      () => {
        this.vjs.volume(0.8);
        this.initHotkeys();
        this.initSocket();
        this.initVideoListeners();
        this.socket.on("info", (info) => {
          this.setState({ playingPopup: info.playing, videoName: info.videoName }, () => {
            this.newVideo();
          });
        });
      }
    );
  }

  componentWillUnmount(): void {
    this.vjs.dispose();
    this.socket.close();
  }

  renderPlayingPopup(): JSX.Element {
    return (
      <Dialog open={this.state.playingPopup}>
        <DialogContent>
          <Box pb={2} px={2} display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h4">Welcome to WatchMega</Typography>
            <Box p={2}>
              <Typography variant="subtitle1" align="center">
                The video is already playing
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                this.setState({ playingPopup: false });
                this.socket.emit("ready");
              }}>
              Start watching
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  renderVideoBar(): JSX.Element {
    return (
      <Box pt={4}>
        <Container maxWidth="lg">
          <Grid container justify="space-evenly" spacing={2}>
            <Grid item xs={1} container justify="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={() => this.socket.emit("prev")}
                style={{ padding: "5px" }}>
                <NavigateBefore fontSize="large" />
              </Button>
            </Grid>
            <Grid item xs={10} container justify="center">
              <Paper
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#680e8b",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}>
                <Box mx={3}>
                  <Typography variant="h6" align="center" noWrap>
                    {this.state.videoName.split(":").pop().split("/").pop()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={1} container justify="flex-start">
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => this.socket.emit("next")}
                  style={{ padding: "5px" }}>
                  <NavigateNext fontSize="large" />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  renderPlayer(): JSX.Element {
    return (
      <Box pt={4}>
        <Container maxWidth="md">
          <Paper elevation={12}>
            <video id="video" className="video-js vjs-fluid vjs-lime" controls preload="auto" />
          </Paper>
        </Container>
      </Box>
    );
  }

  renderSubOffset(): JSX.Element {
    return (
      <TextField
        id="standard-number"
        label="Subtitle delay (ms)"
        type="number"
        inputProps={{ step: "50" }}
        onChange={(e) => this.setOffset(parseInt(e.target.value))}
      />
    );
  }

  renderControls(): JSX.Element {
    return (
      <Box pt={4}>
        <Container maxWidth="md">
          <Paper>
            <Box p={4}>
              <FormControl style={{ width: "100%" }}>
                <Grid container justify="center" alignContent="center" spacing={2}>
                  <Grid item lg={3} md={6} xs={12}>
                    <FormGroup>
                      <FormControlLabel control={<Switch disabled />} label="Disable Mouse" />
                      <FormControlLabel control={<Switch disabled />} label="Ready Check" />
                      <FormControlLabel control={<Switch disabled />} label="Autoplay" />
                    </FormGroup>
                  </Grid>
                  <Grid item lg={3} md={6} xs={12}>
                    <Typography>Volume</Typography>
                    <Slider
                      min={0}
                      max={100}
                      defaultValue={80}
                      onChange={(_, value) => this.vjs.volume((value as number) / 100)}
                      valueLabelDisplay="auto"
                    />
                    <Typography>Playback Speed</Typography>
                    <Slider
                      min={0.25}
                      max={3}
                      defaultValue={1}
                      step={null}
                      marks={[
                        { value: 0.25, label: "0.25x" },
                        { value: 0.5 },
                        { value: 0.75 },
                        { value: 1, label: "1x" },
                        { value: 1.1 },
                        { value: 1.2 },
                        { value: 1.3 },
                        { value: 1.4 },
                        { value: 1.5 },
                        { value: 1.75 },
                        { value: 2, label: "2x" },
                        { value: 2.5 },
                        { value: 3, label: "3x" },
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => v + "x"}
                      onChange={(_, value) => this.vjs.playbackRate(value as number)}
                      onBlur={(e) => this.socket.emit("playbackrate", e.target.nodeValue)}
                    />
                  </Grid>
                  <Grid item container justify="center" md={6} xs={12}>
                    <Grid item container justify="center" wrap="nowrap">
                      <IconButton onClick={() => this.socket.emit("prev")}>
                        <SkipPrevious fontSize="large" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          this.vjs.paused() ? this.vjs.play() : this.vjs.pause();
                        }}>
                        {this.state.playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                      </IconButton>
                      <IconButton onClick={() => this.socket.emit("next")}>
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
                          onChange={(e) => this.setOffset(parseInt(e.target.value))}
                        />
                      </Container>
                    </Grid>
                  </Grid>
                </Grid>
              </FormControl>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  render(): JSX.Element {
    return (
      <React.Fragment>
        <header>
          <Navbar page="Watch" />
        </header>
        <Box>
          {this.renderVideoBar()}
          {this.renderPlayer()}
          {this.renderControls()}
        </Box>
        {this.renderPlayingPopup()}
      </React.Fragment>
    );
  }

  // adapted from https://gist.github.com/buzamahmooza/b940c84b16f0b5719fa994d54c785cab
  initHotkeys(): void {
    document.addEventListener("keydown", (e) => {
      // user is typing into text box
      if (this.isInputing) return;

      if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case "f":
            this.vjs.isFullscreen() ? this.vjs.exitFullscreen() : this.vjs.requestFullscreen();
            e.preventDefault();
            break;
          case "k":
          case " ":
            this.vjs.paused() ? this.vjs.play() : this.vjs.pause();
            e.preventDefault();
            break;
          case "l":
            this.seek(10);
            e.preventDefault();
            break;
          case "ArrowRight":
            this.seek(5);
            e.preventDefault();
            break;
          case "j":
            this.seek(-10);
            e.preventDefault();
            break;
          case "ArrowLeft":
            this.seek(-5);
            e.preventDefault();
            break;
          case "ArrowUp":
            this.vjs.volume(Math.min(this.vjs.volume() + 0.1, 1));
            e.preventDefault();
            break;
          case "ArrowDown":
            this.vjs.volume(Math.max(this.vjs.volume() - 0.1, 0));
            e.preventDefault();
            break;
        }
      }
    });
  }

  seek(amount: number): void {
    this.vjs.currentTime(this.vjs.currentTime() + amount);
  }

  initSocket(): void {
    // video events from server
    this.socket.on("seek", (user, time) => {
      this.ignoreSeek = true;
      this.vjs.currentTime(time);
      if (user) this.sendNotif(`${user} seeked the video`);
    });
    this.socket.on("play", (user, time) => {
      this.ignorePlay = true;
      this.ignoreSeek = true;
      this.vjs.currentTime(time);
      this.setState({ playing: true });
      this.vjs.play();
      if (user) this.sendNotif(`${user} played the video`);
    });
    this.socket.on("pause", (user, time) => {
      this.ignorePause = true;
      this.ignoreSeek = true;
      this.vjs.pause();
      this.setState({ playing: false });
      this.vjs.currentTime(time);
      if (user) this.sendNotif(`${user} paused the video`);
    });
    this.socket.on("newvideo", (name) => {
      this.setState({ videoName: name, playing: false }, () => this.newVideo());
    });

    // users watching
    this.socket.on("watching", (msg) => {
      this.setState({ usernames: msg.usernames, count: msg.count });
    });
  }

  initVideoListeners(): void {
    this.vjs.on("seeked", () => {
      if (this.ignoreSeek) {
        this.ignoreSeek = false;
        return;
      }
      this.socket.emit("seek", this.vjs.currentTime());
    });
    this.vjs.on("play", () => {
      if (this.ignorePlay) {
        this.ignorePlay = false;
        return;
      }
      this.socket.emit("play", this.vjs.currentTime());
      this.setState({ playing: true });
    });
    this.vjs.on("pause", () => {
      if (this.ignorePause) {
        this.ignorePause = false;
        return;
      }
      this.socket.emit("pause", this.vjs.currentTime());
      this.setState({ playing: false });
    });
  }

  // set video src to have a new t param to avoid caching
  newVideo(): void {
    if (!this.state.videoName) return;
    const url = new URL(this.state.videoName);

    if (url.protocol === "file:") {
      this.vjs.src({ type: "video/mp4", src: `/api/media?t=${Math.random()}` });
      this.vjs.addRemoteTextTrack({ src: "api/media/subs", kind: "subtitles", srclang: "en", label: "English" }, false);
      this.vjs.textTracks()[0].mode = "showing";
    } else if (url.protocol === "youtube:") {
      let videoID = url.pathname;
      while (videoID[0] === "/") videoID = videoID.substr(1);
      this.vjs.src({ type: "video/youtube", src: `http://www.youtube.com/watch?v=${videoID}&rel=0` });
    } else {
      throw "Unknown protocol: " + url.protocol;
    }
  }

  sendNotif(msg): void {
    Toastify({
      text: msg,
      duration: 4000,
      newWindow: true,
      gravity: "bottom",
      position: "right",
      stopOnFocus: true,
      backgroundColor: "#6c757d",
    }).showToast();
  }

  setOffset(offset: number): void {
    offset /= 1000;
    if (isNaN(offset)) return;
    const change = offset - this.currentOffset;
    this.offsetSubs(change);
    this.currentOffset = offset;
  }

  offsetSubs(offset: number): void {
    Array.from(this.vjs.textTracks()).forEach((track) => {
      if (track.mode === "showing") {
        Array.from(track.cues).forEach((cue) => {
          cue.startTime += offset;
          cue.endTime += offset;
        });
      }
    });
  }
}
