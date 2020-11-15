$(function () {
  $("#fileupload").fileupload({
    url: "/uploads",
    maxFileSize: 4000000000,
    acceptFileTypes: /(\.|\/)(mp4|avi|mov|mkv)$/i,
  });
});
