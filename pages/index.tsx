import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import "bootstrap/dist/css/bootstrap.css";

import Head from "next/head";
import Navbar from "../components/navbar";
import UserList from "../components/userlist";
import style from "../styles/custom.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import videojs, { VideoJsPlayer } from "video.js";
import "video.js/dist/video-js.min.css";

import socketIOClient from "socket.io-client";
import Toastify from "toastify-js";

// authentication
import { defaultAuth } from "../src/Auth";
export { defaultAuth as getServerSideProps };

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

  renderSubOffset(): JSX.Element {
    return (
      <Row>
        <Col xs="2" className="m-auto pt-4 d-flex justify-content-center">
          <div className="form-outline">
            <label className="form-label text-white" htmlFor="suboffset">
              Subtitle delay
            </label>
            <div className="input-group">
              <input
                className={"form-control " + style.blackBorderSolid}
                id="suboffset"
                type="number"
                step="50"
                value={this.state.subtitleDelay}
                onChange={(e) => {
                  this.setState({ subtitleDelay: e.target.valueAsNumber });
                  this.setOffset(e.target.valueAsNumber);
                }}></input>
              <div className="input-group-append ">
                <span className={"bg-c-secondary text-white input-group-text " + style.blackBorderSolid}>ms</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  renderPlayingPopup(): JSX.Element {
    return (
      <Modal show={this.state.playingPopup} className="fade text-white" backdrop="static" centered>
        <div className="bg-c-secondary modal-body d-flex flex-column justify-content-center">
          <h2 className="text-center p-3">Welcome to WatchMega</h2>
          <p className="text-center">The video is already playing</p>
          <button
            className="btn btn-success p-2"
            type="button"
            onClick={() => {
              this.setState({ playingPopup: false });
              this.socket.emit("ready");
            }}>
            <h5 className="mb-0">Start watching</h5>
          </button>
        </div>
      </Modal>
    );
  }

  render(): JSX.Element {
    return (
      <div className="bg">
        <Head>
          <title>Watch Mega</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header>
          <Navbar page="Watch" socket={this.socket} />
        </header>
        <Container>
          <Row className="pt-4 justify-content-center">
            <Col xs="1">
              <button
                className="btn bg-c-secondary text-white h-100 w-100"
                id="prevep"
                onClick={() => this.socket.emit("prev")}>
                <FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon>
              </button>
            </Col>
            <Col xs="10" className="m-auto">
              <div className="alert alert-dark bg-c-secondary mb-0" role="alert" style={{ borderStyle: "none" }}>
                <h5 className="text-center text-highlight mb-0" id="videoname" style={{ minHeight: "1em" }}>
                  {this.state.videoName}
                </h5>
              </div>
            </Col>
            <Col xs="1">
              <button
                className="btn bg-c-secondary text-white h-100 w-100"
                id="nextep"
                onClick={() => this.socket.emit("next")}>
                <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
              </button>
            </Col>
          </Row>
          <Row>
            <Col xs="9" className="m-auto pt-4">
              <video id="video" className="video-js vjs-fluid vjs-lime" controls preload="auto">
                <source src="api/media" type="video/mp4"></source>
              </video>
            </Col>
          </Row>
          <UserList usernames={this.state.usernames} count={this.state.count}></UserList>
          {this.renderSubOffset()}
        </Container>
        {this.renderPlayingPopup()}
      </div>
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
