/* eslint-disable */
let torrentTable, torrentTemplate;

window.onload = () => {
  torrentTable = document.querySelector("tbody");
  torrentTemplate = document.querySelector("#torrentrow");
};

function updateTable(torrents) {
  for (const [name, value] of Object.entries(torrents)) {
    console.log(name, value);
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

setTimeout(
  () =>
    updateTable({
      asd: 0.04,
      aaaa: 0.52,
      wdwdwokw: 0.892,
      waaa: 1,
      waa: 0,
    }),
  1000
);
