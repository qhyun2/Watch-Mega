$(() => {
  $("#submit").click((e) => {
    e.preventDefault();
    loading();
    axios({
      method: "post",
      url: "/login",
      data: {
        password: $("#password").val(),
      },
    })
      .then((res) => {
        if (res.data.status == "rejected") {
          $("#password").addClass("is-invalid");
        } else if (res.data.status == "accepted") {
          console.log("going home");
          window.location = "/";
        }
      })
      .catch((e) => {
        $("#password").addClass("is-invalid");
        console.log(e);
      })
      .finally(() => {
        done();
      });
  });

  $("#password").blur(() => {
    $("#password").removeClass("is-invalid");
  });
});

function loading() {
  $("#submit").attr("disabled", true);
  $("#spinner").show();
}

function done() {
  $("#submit").attr("disabled", false);
  $("#spinner").hide();
}
