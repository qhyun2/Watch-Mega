$(() => {
  window.HELP_IMPROVE_VIDEOJS = false;
  var video = document.getElementById("video");
  var ignoreSeek = false;
  var ignorePlay = false;
  var ignorePause = false;

  newVideo();

  // most browsers do not allow autoplay with sound
  // TODO something better than this
  video.volume = 0;

  // video events from server
  socket.on("seek", (user, time) => {
    ignoreSeek = true;
    video.currentTime = time;
    sendNotif(`${user} seeked the video`);
  });
  socket.on("play", (user, time) => {
    ignorePlay = true;
    ignoreSeek = true;
    video.currentTime = time;
    video.play();
    sendNotif(`${user} played the video`);
  });
  socket.on("pause", (user) => {
    ignorePause = true;
    video.pause();
    sendNotif(`${user} paused the video`);
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

  $("#collapse").click(() => {
    $("#users").collapse("toggle");
  });
  initHotkeys();
});

// adapted from
// https://gist.github.com/buzamahmooza/b940c84b16f0b5719fa994d54c785cab
function initHotkeys() {
  document.addEventListener("keydown", (e) => {
    // user is typing into text box
    if (isInputing) return;

    if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      switch (e.key) {
        case "f":
          toggleFullScreen();
          e.preventDefault();
          break;
        case "k":
        case " ":
          if (video.paused) video.play();
          else video.pause();
          e.preventDefault();
          break;
        case "l":
          video.currentTime += 10;
          e.preventDefault();
          break;
        case "ArrowRight":
          video.currentTime += 5;
          e.preventDefault();
          break;
        case "j":
          video.currentTime -= 10;
          e.preventDefault();
          break;
        case "ArrowLeft":
          video.currentTime -= 5;
          e.preventDefault();
          break;
        case "ArrowUp":
          video.volume = Math.min(video.volume + 0.1, 1);
          e.preventDefault();
          break;
        case "ArrowDown":
          video.volume = Math.max(video.volume - 0.1, 0);
          e.preventDefault();
          break;
      }
    }
  });
}

function toggleFullScreen() {
  if (document.fullscreenElement != video) {
    if (video.requestFullscreen) video.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// set sub and video src to have a new t param to avoid caching
function newVideo(name) {
  $("#subs").attr("src", `subs?t=${Math.random()}`);
  video.src = `video?t=${Math.random()}`;
  $("#videoname").text(name);
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
