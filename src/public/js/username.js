function usernameSubmit() {
  let input = $("#username-input").val().trim();
  if (input) {
    $("#username-btn-text").text(input);
    socket.emit("name", input);
  }

  $("#username-input").val("");
  $("#username-input").removeClass("username-shown");
  $("#username-input").attr("disabled", "disabled");
  $("#username-btn").show();
}

$(() => {
  $("#username-btn").click(function () {
    $("#username-btn").hide();
    $("#username-input").addClass("username-shown");
    $("#username-input").removeAttr("disabled");
    setTimeout(() => $("#username-input").focus(), 110);
  });

  $("#username-input").blur(usernameSubmit);
  $("#username-input").keyup(function (e) {
    if (e.keyCode == 13) {
      usernameSubmit();
    }
  });
});
