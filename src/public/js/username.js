var isInputing = false;

function doUsernameSubmit() {
  usernameSubmit($("#username-input").val().trim());
}

function usernameSubmit(name) {
  isInputing = false;
  if (name) {
    $("#username-btn-text").text(name);
    Cookies.set("username", name, { sameSite: "strict" });
    if (window.location.pathname == "/") {
      socket.emit("name", name);
    }
  }

  $("#username-input").val("");
  $("#username-input").removeClass("username-shown");
  $("#username-input").attr("disabled", "disabled");
  $("#username-btn").show();
}

$(() => {
  $("#username-btn").click(function () {
    isInputing = true;
    $("#username-btn").hide();
    $("#username-input").addClass("username-shown");
    $("#username-input").removeAttr("disabled");
    setTimeout(() => $("#username-input").focus(), 110);
  });

  $("#username-input").blur(doUsernameSubmit);
  $("#username-input").keyup(function (e) {
    if (e.keyCode == 13) {
      doUsernameSubmit();
    }
  });

  const username = Cookies.get("username");
  if (username) {
    usernameSubmit(username);
  } else {
    setTimeout(() => $("#username-btn-text").text("Set Username"), 300);
  }
});
