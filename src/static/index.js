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

function reloadEmulator() {
  var shouldReload = confirm("Are you sure you want to restart the emulator");
  if (shouldReload) {
    gameInstance.reloadEmulator();
  }
  document.getElementById("dummy").focus();
}

function settingsChange(type, event) {
  switch(type) {
    case "turbo":
      gameInstance.setTurbo(event.target.checked);
  }
  document.getElementById("dummy").focus();
}

function onVirtualKey(key) {
  onKey({keyCode: key});
}

function onKey(event) {
  if (!gameInstance) {
    return;
  }
  gameInstance.keyPress(event);
}

function onKeyDown(event) {
  if (!gameInstance) {
    return;
  }
  gameInstance.keyDown(event);
}

function onKeyUp(event) {
  if (!gameInstance) {
    return;
  }
  gameInstance.keyUp(event);
}

document.addEventListener('DOMContentLoaded', onLoad);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('keypress', onKey);

function onLoad(event) {
  document.getElementById("dummy").focus();

  var canvas = document.getElementById('canvas');
  gameInstance = new Game(canvas);
  gameInstance.start();

  // The switch doesn't send a 'b' press event but rather just returns to the last site
  // This hack captures the b button to only go back inside the iframe with instantly loads a new instance
  // We can abuse this by sending a button press event when it happens
  var backCapture = document.getElementById("backCapture");
  var backCaptureDidInit = false;
  function recMessage(msg) {
    if (msg.data === "loaded") {
      if (!backCaptureDidInit) {
        backCaptureDidInit = true;
      } else {
        onKey({keyCode: 90});
      }
      backCapture.src = "frame?x" + Math.random()
    }
  }
  window.addEventListener("message", recMessage);
}
