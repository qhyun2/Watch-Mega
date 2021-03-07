import Head from "next/head";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";

import "bootstrap/dist/css/bootstrap.css";
import Navbar from "../components/navbar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

import videojs, { VideoJsPlayer } from "video.js";
import "video.js/dist/video-js.min.css";

import $ from "jquery";
import React from "react";
import socketIOClient from "socket.io-client";
import Toastify from "toastify-js";

export default class Home extends React.Component {
  vjs: VideoJsPlayer;
  isInputing;
  socket;
  currentOffset = 0;
  count = 0;
  ignoreSeek = false;
  ignorePlay = false;
  ignorePause = false;
  playingPopup;

  constructor(props) {
    super(props);
    this.state = { playingPopup: false };
    this.socket = socketIOClient();
  }

  componentDidMount(): void {
    $(() => {
      this.vjs = videojs("video", {}, async () => {
        this.vjs.volume(0.8);
        this.newVideo("  c");
        this.initHotkeys();
        this.initSocket();
        this.initVideoListeners();
        this.initButtons();
        await new Promise<void>((resolve, _) => {
          this.socket.on("info", (info) => {
            this.setState({ playingPopup: info.playing });
            resolve();
          });
        });
      });
      this.setState({ playingPopup: true });
    });
  }

  render(): JSX.Element {
    return (
      <div className="bg">
        <Head>
          <title>Watch Mega</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header>
          <Navbar></Navbar>
        </header>
        <Container>
          <Row className="pt-4 justify-content-center">
            <Col xs="1">
              <button className="btn bg-c-secondary text-white h-100 w-100" id="prevep">
                <FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon>
              </button>
            </Col>
            <Col xs="10" className="m-auto">
              <div className="alert alert-dark bg-c-secondary mb-0" role="alert" style={{ borderStyle: "none" }}>
                <h5 className="text-center text-highlight mb-0" id="videoname">
                  YO
                </h5>
              </div>
            </Col>
            <Col xs="1">
              <button className="btn bg-c-secondary text-white h-100 w-100" id="nextep">
                <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
              </button>
            </Col>
          </Row>
          <Row>
            <Col xs="9" className="m-auto pt-4">
              <video id="video" className="video-js vjs-fluid vjs-lime" controls preload="auto">
                <source src="video" type="video/mp4"></source>
              </video>
            </Col>
          </Row>
          <Row>
            <Col xs="4" className="m-auto pt-4">
              <div className="card bg-c-secondary">
                <div className="card-header p-0">
                  <button className="btn bg-c-secondary" id="collapse">
                    <FontAwesomeIcon icon={faAngleRight} fixedWidth></FontAwesomeIcon>
                    <span id="count" className="text-white">
                      {this.count} asdo
                    </span>
                  </button>
                </div>
                <div id="users" className="collapse">
                  <div className="card-body">
                    <table id="userstable" className="table table-dark bg-c-secondary text-dark mb-0">
                      <tbody className="text-white"></tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col xs="2" className="m-auto pt-4 d-flex justify-content-center">
              <div className="form-outline">
                <label className="form-label text-white" htmlFor="suboffset">
                  {" "}
                  Subtitle delay
                </label>
                <div className="input-group">
                  <input
                    className="form-control black-border-solid"
                    id="suboffset"
                    type="number"
                    step="50"
                    value="0"
                  ></input>
                  <div className="input-group-append">
                    <span className="bg-c-secondary text-white black-border-solid input-group-text">ms</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
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
              }}
            >
              <h5 className="mb-0">Start watching</h5>
            </button>
          </div>
        </Modal>
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
            console.log("bork");
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

  seek(amount): void {
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
      this.newVideo(name);
    });

    // users watching
    this.socket.on("watching", (users) => {
      const count = users.count;
      const names = users.usernames;
      $("#count").text(count + ` user${count === 1 ? "" : "s"} currently watching`);
      $("#users-table").children("tbody").text("");
      names.forEach((name) => {
        $("#users-table").children("tbody").append(`<tr><td>${name}</td></tr>`);
      });
      const anon = count - names.length;
      if (anon && names.length > 1) {
        $("#users-table")
          .children("tbody")
          .append(`<tr><td>and ${anon} other user${anon === 1 ? "" : "s"}</td></tr>`);
      }
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

  initButtons(): void {
    $("#collapse").click(() => {
      $("#users").collapse("toggle");
    });

    $("#nextep").click(() => {
      this.socket.emit("next");
    });

    $("#prevep").click(() => {
      this.socket.emit("prev");
    });

    $("#suboffset").on("input", (e) => {
      this.setOffset(e.target.valueAsNumber / 1000);
    });
  }

  // set video src to have a new t param to avoid caching
  newVideo(name) {
    this.vjs.src({ type: "video/mp4", src: `video?t=${Math.random()}` });
    $("#videoname").text(name);
    this.vjs.addRemoteTextTrack({ src: "subs", kind: "subtitles", srclang: "en", label: "English" }, false);
    this.vjs.textTracks()[0].mode = "showing";
  }

  sendNotif(msg) {
    Toastify({
      text: msg,
      duration: 4000,
      newWindow: true,
      close: true,
      gravity: "bottom",
      position: "right",
      stopOnFocus: true,
      backgroundColor: "#6c757d",
    }).showToast();
  }

  setOffset(offset: number): void {
    if (isNaN(offset)) return;
    const change = offset - this.currentOffset;
    this.offsetSubs(change);
    console.log("Set offset to: " + offset);
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
