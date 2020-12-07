let video;

$(() => {
  videojs("video").ready(function () {
    video = this;
    var ignoreSeek = false;
    var ignorePlay = false;
    var ignorePause = false;

    // video events to send
    this.on("seeked", (e) => {
      if (ignoreSeek) {
        ignoreSeek = false;
        return;
      }
      socket.emit("seek", video.currentTime());
    });
    this.on("play", (e) => {
      if (ignorePlay) {
        ignorePlay = false;
        return;
      }
      socket.emit("play", video.currentTime());
    });
    this.on("pause", (e) => {
      if (ignorePause) {
        ignorePause = false;
        return;
      }
      socket.emit("pause", video.currentTime());
    });

    // video events from server
    socket.on("seek", (user, time) => {
      sendNotif(`${user} seeked the video`);
      ignoreSeek = true;
      video.currentTime(time);
    });
    socket.on("play", (user, time) => {
      sendNotif(`${user} played the video`);
      ignorePlay = true;
      ignoreSeek = true;
      video.currentTime(time);
      video.play();
    });
    socket.on("pause", (user, time) => {
      sendNotif(`${user} paused the video`);
      ignorePause = true;
      ignoreSeek = true;
      video.currentTime(time);
      video.pause();
    });

    socket.on("newvideo", () => {
      updateVideo(this);
    });
    updateVideo(this);
  });

  // chrome does not allow autoplay with sound
  if (/chrome/i.test(navigator.userAgent)) {
    video.muted(true);
  }

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

  $("#collapse").click(() => {
    $("#users").collapse("toggle");
  });
});

// change src with random t parameter to prevent caching
function updateVideo(video) {
  video.textTracks()[0].src = `subs?t=${Math.random()}`;
  video.src({ type: "video/mp4", src: `video?t=${Math.random()}` });
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
