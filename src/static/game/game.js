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

class SocketConnection {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.messageHandler = null;
    this.connected = false;

    this.timeoutInSeconds = 10;
    this.timeout = null;

    this.disconnect = this.disconnect.bind(this);
    this.onOpen = this.onOpen.bind(this);
  }

  send(data) {
    if (!this.socket) {
      return;
    }
    this.socket.send(data);
  }

  connect() {
    this.socket = new WebSocket('ws://' + this.url + '/ws');
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onmessage = this.messageHandler;
  }

  disconnect() {
    this.socket.close();
    this.socket = null;
  }

  onOpen() {
    this.connected = true;
    this.timeout = setTimeout(this.disconnect, this.timeoutInSeconds * 1000);
  }

  onClose() {
    this.connected = false;
    clearTimeout(this.timeout);
  }

  resetTimeout() {
    if (this.socket === null) {
      this.connect();
    } else {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(this.disconnect, this.timeoutInSeconds * 1000);
    }
  }

  setMessageHandler(messageHandler) {
    this.messageHandler = messageHandler;
    if (this.socket) {
      this.socket.onmessage = this.messageHandler;
    }
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.socketConnection = new SocketConnection(window.location.host);
    this.isRunning = false;

    this.image = new Image();
    this.image.onload = this.updateFrame.bind(this);

    this.handleEvent = this.handleEvent.bind(this);
    this.socketConnection.setMessageHandler(this.handleEvent);
  }

  sendDebug(data) {
    var url = window.location.origin + '/debug';
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({
      data: data
    }));
  }

  handleEvent(event) {
    if (event.data instanceof Blob) {
      this.image.src = URL.createObjectURL(event.data);
    } else {
      try {
        var json = JSON.parse(event.data);
        switch (json.event) {
          case 'metadata':
            this.setCanvas(json.width, json.height);
            this.updateSettings(json.settings);
            break;
          default:
            break;
        }
      } catch (err) {}
    }
  };

  updateSettings(settings) {
    var turboCheck = document.getElementById("turbo-setting");
    turboCheck.checked = settings['turbo']
  }

  start() {
    this.isRunning = true;
    this.socketConnection.connect();
  }

  stop() {
    this.isRunning = false;
    this.socketConnection.disconnect();
  }

  setCanvas(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  updateFrame() {
    this.ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
  }

  onEvent(type, keyCode) {
    if(!this.isRunning) {
      return;
    }
    this.socketConnection.resetTimeout();

    var key = KEY_MAP[keyCode];
    if (key !== undefined) {
      this.socketConnection.send("key-" + type + "-" + key);
    }
  }

  setTurbo(enabled) {
    var enabledText = enabled ? "on" : "off";
    this.socketConnection.send("setting-turbo-" + enabledText);
  }

  reloadEmulator() {
    this.socketConnection.send("reload");
  }

  keyPress(event) {
    this.onEvent("press", event.keyCode);
  }

  keyDown(event) {
    this.onEvent("down", event.keyCode);
  }

  keyUp(event) {
    this.onEvent("up", event.keyCode);
  }
}