import React from "react";
import "bootstrap/dist/css/bootstrap.css";

import Navbar from "../components/navbar";
import UserList from "../components/userlist";

import videojs, { VideoJsPlayer } from "video.js";
import "video.js/dist/video-js.min.css";

import socketIOClient from "socket.io-client";
import Toastify from "toastify-js";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

import {
  Box,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  Typography,
  Button,
  Fade,
  Container,
  Paper,
} from "@material-ui/core";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";

interface state {
  playingPopup: boolean;
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
      subtitleDelay: 0,
      usernames: [],
      count: 0,
      videoName: "",
    };

    if (!this.socket) this.socket = socketIOClient();
  }

  componentDidMount(): void {
    this.vjs = videojs("video", {}, async () => {
      this.vjs.volume(0.8);
      this.newVideo();
      this.initHotkeys();
      this.initSocket();
      this.initVideoListeners();
      await new Promise<void>((resolve, _) => {
        this.socket.on("info", (info) => {
          this.setState({ playingPopup: info.playing, videoName: info.videoName });
          resolve();
        });
      });
    });
  }

  componentWillUnmount(): void {
    this.vjs.dispose();
    this.socket.close();
  }

  renderPlayingPopup(): JSX.Element {
    return (
      <Fade in={this.state.playingPopup}>
        <Dialog open={true}>
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
      </Fade>
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
                    {this.state.videoName}
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
            <video id="video" className="video-js vjs-fluid vjs-lime" controls preload="auto">
              <source src="api/media" type="video/mp4"></source>
            </video>
          </Paper>
        </Container>
      </Box>
    );
  }

  renderSubOffset(): JSX.Element {
    return (
      <Box pt={2}>
        <Container maxWidth="md">
          <Grid container justify="center">
            <Grid item xs={2}>
              <TextField
                id="standard-number"
                label="Subtitle delay (ms)"
                type="number"
                inputProps={{ step: "50" }}
                onChange={(e) => this.setOffset(parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  render(): JSX.Element {
    return (
      <React.Fragment>
        <header>
          <Navbar page="Watch" socket={this.socket} />
        </header>
        {this.renderVideoBar()}
        {this.renderPlayer()}
        <Container maxWidth="md">
          <UserList usernames={this.state.usernames} count={this.state.count}></UserList>
        </Container>
        {this.renderSubOffset()}
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
      this.vjs.play();
      if (user) this.sendNotif(`${user} played the video`);
    });
    this.socket.on("pause", (user, time) => {
      this.ignorePause = true;
      this.ignoreSeek = true;
      this.vjs.pause();
      this.vjs.currentTime(time);
      if (user) this.sendNotif(`${user} paused the video`);
    });
    this.socket.on("newvideo", (name) => {
      this.setState({ videoName: name });
      this.newVideo();
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
    });
    this.vjs.on("pause", () => {
      if (this.ignorePause) {
        this.ignorePause = false;
        return;
      }
      this.socket.emit("pause", this.vjs.currentTime());
    });
  }

  // set video src to have a new t param to avoid caching
  newVideo(): void {
    this.vjs.src({ type: "video/mp4", src: `/api/media?t=${Math.random()}` });
    this.vjs.addRemoteTextTrack({ src: "api/media/subs", kind: "subtitles", srclang: "en", label: "English" }, false);
    this.vjs.textTracks()[0].mode = "showing";
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
