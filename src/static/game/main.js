var VIEW_CONFIG = {
  width: 1280,
  height: 648,
  sidebarWidth: 154
};
var gameInstance = null;

// Capture switch browser to disable accidental unload
function confirmExit() {
  return "";
}
window.onbeforeunload = confirmExit;

function goBack() {
  location.href = location.origin;
}

function reloadEmulator() {
  var shouldReload = confirm("Are you sure you want to restart the emulator");
  if (shouldReload) {
    gameInstance.reloadEmulator();
  }
}

function settingsChange(type, event) {
  switch (type) {
    case "turbo":
      gameInstance.setTurbo(event.target.checked);
  }
}

document.addEventListener("DOMContentLoaded", onLoad);

function onLoad(event) {
  var canvas = document.getElementById("canvas");
  gameInstance = new Game(canvas);
  gameInstance.start();

  // The switch doesn't send a 'b' press event but rather just returns to the last site
  var backCapture = document.getElementById("backCapture");
  var backCaptureDidInit = false;
  function recMessage(msg) {
    if (msg.data === "loaded") {
      if (!backCaptureDidInit) {
        backCaptureDidInit = true;
      }
      backCapture.src = "frame?x" + Math.random();
    }
  }
  window.addEventListener("message", recMessage);
}
