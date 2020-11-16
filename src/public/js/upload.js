$(function () {
  $("#fileupload").fileupload({
    url: "/uploads",
    maxFileSize: 4 * 1000 * 1000 * 1000, // 4GB
    maxChunkSize: 10 * 1000 * 1000, // 10 MB
    acceptFileTypes: /(\.|\/)(mp4|avi|mov|mkv)$/i,
  });
});
