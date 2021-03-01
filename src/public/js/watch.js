var ignoreSeek = false;
var ignorePlay = false;
var ignorePause = false;
var vjs;

$(() => {
  vjs = videojs("video", {}, async () => {
    vjs.volume(0.8);
    newVideo();
    initHotkeys();
    initSocket();
    initVideoListeners();
    initButtons();
    var playingPopup;
    await new Promise((resolve, _) => {
      socket.on("info", (info) => {
        playingPopup = info.playing;
        resolve();
      });
    });
    if (playingPopup) {
      $("#joinroom").modal({ backdrop: "static" });
    }
  });
});

// adapted from https://gist.github.com/buzamahmooza/b940c84b16f0b5719fa994d54c785cab
function initHotkeys() {
  document.addEventListener("keydown", (e) => {
    // user is typing into text box
    if (isInputing) return;

    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      switch (e.key) {
        case "f":
          vjs.isFullscreen() ? vjs.exitFullscreen() : vjs.requestFullscreen();
          e.preventDefault();
          break;
        case "k":
        case " ":
          console.log("bork");
          vjs.paused() ? vjs.play() : vjs.pause();
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
          vjs.volume(Math.min(vjs.volume() + 0.1, 1));
          e.preventDefault();
          break;
        case "ArrowDown":
          vjs.volume(Math.max(vjs.volume() - 0.1, 0));
          e.preventDefault();
          break;
      }
    }
  });
}

function seek(amount) {
  vjs.currentTime(vjs.currentTime() + amount);
}

function initSocket() {
  // video events from server
  socket.on("seek", (user, time) => {
    ignoreSeek = true;
    vjs.currentTime(time);
    if (user) sendNotif(`${user} seeked the video`);
  });
  socket.on("play", (user, time) => {
    ignorePlay = true;
    ignoreSeek = true;
    vjs.currentTime(time);
    vjs.play();
    if (user) sendNotif(`${user} played the video`);
  });
  socket.on("pause", (user, time) => {
    ignorePause = true;
    ignoreSeek = true;
    vjs.pause();
    vjs.currentTime(time);
    if (user) sendNotif(`${user} paused the video`);
  });
  socket.on("newvideo", (name) => {
    newVideo(name);
  });

  // users watching
  socket.on("watching", (users) => {
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

function initVideoListeners() {
  vjs.on("seeked", (e) => {
    if (ignoreSeek) {
      ignoreSeek = false;
      return;
    }
    socket.emit("seek", vjs.currentTime());
  });
  vjs.on("play", (e) => {
    if (ignorePlay) {
      ignorePlay = false;
      return;
    }
    socket.emit("play", vjs.currentTime());
  });
  vjs.on("pause", (e) => {
    if (ignorePause) {
      ignorePause = false;
      return;
    }
    socket.emit("pause", vjs.currentTime());
  });
}

function initButtons() {
  $("#collapse").click(() => {
    $("#users").collapse("toggle");
  });

  $("#nextep").click(() => {
    socket.emit("next");
  });

  $("#prevep").click(() => {
    socket.emit("prev");
  });

  $("#dismiss").click(() => {
    $("#joinroom").modal("hide");
    socket.emit("ready");
  });
  $("#suboffset").on("input", function (e) {
    setOffset(e.target.valueAsNumber / 1000);
  });
}

// set video src to have a new t param to avoid caching
function newVideo(name) {
  vjs.src({ type: "video/mp4", src: `video?t=${Math.random()}` });
  $("#videoname").text(name);
  vjs.addRemoteTextTrack({ src: "subs", kind: "subtitles", srclang: "en", label: "English" }, false);
  vjs.textTracks()[0].mode = "showing";
}

function sendNotif(msg) {
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

var currentOffset = 0;

function setOffset(offset) {
  if (isNaN(offset)) return;
  const change = offset - currentOffset;
  offsetSubs(change);
  console.log("Set offset to: " + offset);
  currentOffset = offset;
}

function offsetSubs(offset) {
  Array.from(vjs.textTracks()).forEach((track) => {
    if (track.mode === "showing") {
      Array.from(track.cues).forEach((cue) => {
        cue.startTime += offset;
        cue.endTime += offset;
      });
    }
  });
}
