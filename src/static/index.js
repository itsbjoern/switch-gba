var SIZE_MODIFIER = 2;

var KEY_MAP = {
  32: 0, // a
  90: 1, // b
  39: 4, // right
  37: 5, // left
  38: 6, // up
  40: 7, // down
  8:  2, // select
  13: 3, // start
  83: 8, // r
  65: 9, // l
};

// Capture switch browser to disable accidental unload
window.onbeforeunload = confirmExit;
function confirmExit() {
    return "";
}

var lastStagger = new Date();
function sendDebug(data) {
  var currStagger = new Date();
  if (currStagger - lastStagger < 1500) {
    return;
  }
  var url = window.location.origin + '/debug';
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify({
    data: data
  }));
}


var ws = new WebSocket('ws://' + window.location.host + '/ws');
var connected = false;

document.addEventListener('DOMContentLoaded', onLoad);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener("mousemove", mouseMove);

function onLoad(event) {
  // Handle incoming websocket message callback
  ws.onmessage = function(event) {
    if (event.data instanceof Blob) {
      updateFrame(event.data)
    } else {
      try {
        var json = JSON.parse(event.data);
        switch (json.event) {
          case 'metadata': return setCanvas(json.width, json.height);
          case 'last log': return displayMessage(json.data);
          case 'all logs': return addGameEvent(json);
        }
      } catch (err) {

      }
    }
  };

  ws.onopen = function() {
    connected = true;
  }

  ws.onclose = function() {
    connected = false;
  }

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

function addGameEvent(json) {
  for (var message of json.data)
    displayMessage(message);
}

function displayMessage(message) {
  var parent = document.getElementById('commands');
  var child = document.createElement('p');
  var html = "<p>" + message + "</p>";
  child.innerHTML = html;
  if (parent.childNodes.length === 0) {
    parent.appendChild(child);
  } else {
    parent.insertBefore(child, parent.childNodes[0])
  }
}

function onVirtualKey(key) {
  onKey({keyCode: key});
}

function onKey(event) {
  if (KEY_MAP[event.keyCode] !== undefined) {
    ws.send("press-" + KEY_MAP[event.keyCode]);
  }
}

function onKeyDown(event) {
  if (KEY_MAP[event.keyCode] !== undefined) {
    ws.send("down-" + KEY_MAP[event.keyCode]);
  }
}

function onKeyUp(event) {
  if (KEY_MAP[event.keyCode] !== undefined) {
    ws.send("up-" + KEY_MAP[event.keyCode]);
  }
}

function mouseMove(evt) {
  // sendDebug({x: evt.clientX, y: evt.clientY});
}

function updateFrame(frame) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var img = new Image();
  img.onload = function() {
    context.drawImage(img, 0, 0, img.width * SIZE_MODIFIER, img.height * SIZE_MODIFIER);
  }
  img.src = URL.createObjectURL(frame);
}

function setCanvas(width, height) {
  var canvas = document.getElementById('canvas');
  canvas.width = width * SIZE_MODIFIER;
  canvas.height = height * SIZE_MODIFIER;
}
