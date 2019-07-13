function sendData(data, location) {
  location = "/" + (location || "");
  var url = window.location.origin + location;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify({
    data: data
  }));
}

function startRom(filename) {
  var startRom = confirm("Start rom?");
  if (!startRom) {
    return;
  }
  location.href = window.location.origin + "/game?game=" + encodeURIComponent(filename);
}
