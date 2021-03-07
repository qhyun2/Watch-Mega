let torrentTable, torrentTemplate;

$(() => {
  torrentTable = document.querySelector("tbody");
  torrentTemplate = document.querySelector("#torrentrow");
});

function updateTable(torrents) {
  // clear table
  torrentTable.innerHTML = "";

  // add rows
  for (const [name, value] of Object.entries(torrents)) {
    let templateCopy = torrentTemplate.content.cloneNode(true);
    let progress = Math.ceil(value * 100);
    let progressText = `${progress}%`;
    let td = templateCopy.querySelectorAll("td");
    let progressBar = td[1].children[0].children[0];

    td[0].textContent = name;
    progressBar.style = "width: " + progressText;
    progressBar.textContent = progressText;

    torrentTable.appendChild(templateCopy);
  }
}

setInterval(() => {
  axios.get("/api/torrent/status").then((res) => {
    updateTable(res.data);
  });
}, 1000);
