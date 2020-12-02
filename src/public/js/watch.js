$(() => {
  window.HELP_IMPROVE_VIDEOJS = false;
  var video = document.getElementById("video");
  var ignoreSeek = false;
  var ignorePlay = false;
  var ignorePause = false;

  newVideo();

  // chrome does not allow autoplay with sound
  if (/chrome/i.test(navigator.userAgent)) {
    video.muted = true;
  }

  // video events from server
  socket.on("seek", (user, time) => {
    ignoreSeek = true;
    console.log(user, time);
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
  socket.on("newvideo", () => {
    newVideo();
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
});

function newVideo() {
  $("#subs").attr("src", `subs?t=${Math.random()}`);
  video.src = `video?t=${Math.random()}`;
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
