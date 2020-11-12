/* eslint-disable */

window.onload = function () {
  window.HELP_IMPROVE_VIDEOJS = false;
  var socket = io();
  var video = document.getElementById("video");
  var watching = document.getElementById("watching");
  video.src = `./video?t=${Math.random()}`;
  var ignoreSeek = false;
  var ignorePlay = false;
  var ignorePause = false;

  // chrome does not allow autoplay with sound
  if (/chrome/i.test(navigator.userAgent)) {
    video.muted = true;
  }

  // video events from server
  socket.on("seek", (msg) => {
    ignoreSeek = true;
    video.currentTime = msg;
  });
  socket.on("play", (msg) => {
    ignorePlay = true;
    ignoreSeek = true;
    video.currentTime = msg;
    video.play();
  });
  socket.on("pause", () => {
    ignorePause = true;
    video.pause();
  });
  socket.on("newvideo", () => {
    video.src = `./video?t=${Math.random()}`;
  });

  socket.on("watching", (users) => {
    watching.innerText =
      users + " user" + (users == 1 ? "" : "s") + " currently watching";
  });
  // users watching

  video.addEventListener("seeked", (e) => {
    if (ignoreSeek) {
      ignoreSeek = false;
      return;
    }
    socket.emit("seek", video.currentTime);
  });
  video.addEventListener("play", (e) => {
    if (ignorePlay) {
      ignorePlay = false;
      return;
    }
    socket.emit("play", video.currentTime);
  });
  video.addEventListener("pause", (e) => {
    if (ignorePause) {
      ignorePause = false;
      return;
    }
    socket.emit("pause");
  });
};
