var GAMEPAD_MAP = {
  FACE_1: 1, // b
  FACE_2: 0, // a
  FACE_3: 15, // y
  FACE_4: 15, // x
  LEFT_TOP_SHOULDER: 9, // l
  LEFT_BOTTOM_SHOULDER: 15,
  RIGHT_TOP_SHOULDER: 8, // r
  RIGHT_BOTTOM_SHOULDER: 15,
  START_FORWARD: 15, // start on switch
  SELECT_BACK: 15, // select on switch,
  DPAD_UP: 15,
  DPAD_DOWN: 2, // select gba
  DPAD_LEFT: 15,
  DPAD_RIGHT: 3, // start gba
  LEFT_STICK: 15,
  RIGHT_STICK: 15,
  LEFT_STICK_LEFT: 5,
  LEFT_STICK_RIGHT: 4,
  LEFT_STICK_UP: 6,
  LEFT_STICK_DOWN: 7
};

var CUSTOM_MAP = {
  NEXT_STATE: -2,
  PREV_STATE: -3,
  RIGHT_BOTTOM_SHOULDER: -4,
  RIGHT_STICK: -5
};

var AXIS_THRESHOLD_WEAK = 0.3;
var AXIS_THRESHOLD_STRONG = 0.6;
var AXIS_MAP = {
  LEFT_STICK_X: val =>
    val > AXIS_THRESHOLD_WEAK
    ? "LEFT_STICK_RIGHT"
    : val < -AXIS_THRESHOLD_WEAK
      ? "LEFT_STICK_LEFT"
      : null, // left right
  LEFT_STICK_Y: val =>
    val > AXIS_THRESHOLD_WEAK
    ? "LEFT_STICK_DOWN"
    : val < -AXIS_THRESHOLD_WEAK
      ? "LEFT_STICK_UP"
      : null, // up down
  RIGHT_STICK_X: val =>
    val > AXIS_THRESHOLD_STRONG
    ? "NEXT_STATE"
    : val < -AXIS_THRESHOLD_STRONG
      ? "PREV_STATE"
      : null,
  RIGHT_STICK_Y: () => null
};

class UI {
  constructor() {
    this.pause = document.getElementById("pause");
    this.slot = document.getElementById("slot");
    this.slotBefore = document.getElementById("slot-before");
    this.slotAfter = document.getElementById("slot-after");
    this.slotStatus = document.getElementById("slot-status");

    this.turboCheck = document.getElementById("turbo-setting");
    this.toastContainer = document.getElementById("toast-container");
  }

  setSaveSlot(slot, hasSave) {
    this.slotStatus.className =hasSave ? "active" : "";
    this.slot.innerHTML = slot;
    this.slotBefore.innerHTML = slot === 0 ? "" : slot - 1;
    this.slotAfter.innerHTML = slot === 9 ? "" : slot + 1;
  }

  setTurbo(enabled) {
    this.turboCheck.checked = enabled;
  }

  setPaused(paused) {
    this.pause.style.display = paused ? "block" : "none";
  }

  showToast(text) {
    var toast = document.createElement('div');
    toast.innerHTML = text;
    toast.className = "toast";

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      this.toastContainer.removeChild(toast);
    }, 2000);
  }
}

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
    this.onClose = this.onClose.bind(this);
  }

  send(data) {
    if (!this.socket || !this.connected) {
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
    this.connected = false;
    this.socket.close();
  }

  onOpen() {
    this.connected = true;
    this.timeout = setTimeout(this.disconnect, this.timeoutInSeconds * 1000);
    this.didOpen && this.didOpen();
  }

  onClose() {
    this.didClose && this.didClose();
    clearTimeout(this.timeout);
    this.socket = null;
  }

  resetTimeout() {
    if (this.socket === null) {
      this.connect();
    } else {
      clearTimeout(this.timeout);

      if (!this.connected) {
        return;
      }
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

    this.ui = new UI();
    this.settings = {
      turbo: false,
      saveSlot: 0
    };

    this.socketConnection = new SocketConnection(window.location.host);
    this.socketConnection.didOpen = this.setPaused.bind(this, false);
    this.socketConnection.didClose = this.setPaused.bind(this, true);
    this.rom = null;
    this.isRunning = false;
    this.didSetCanvas = false;

    this.image = new Image();
    this.image.onload = this.updateFrame.bind(this);

    this.handleEvent = this.handleEvent.bind(this);
    this.socketConnection.setMessageHandler(this.handleEvent);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.axisChanged = this.axisChanged.bind(this);
    this.saveState = this.saveState.bind(this);
    this.loadState = this.loadState.bind(this);

    this.gamepad = new Gamepad();
    this.gamepad.init();
    this.axis = {};

    this.gamepad.bind(Gamepad.Event.BUTTON_DOWN, this.keyDown);
    this.gamepad.bind(Gamepad.Event.BUTTON_UP, this.keyUp);
    this.gamepad.bind(Gamepad.Event.AXIS_CHANGED, this.axisChanged);

    this.dblClickHandlers = {};
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
            this.rom = json.rom;
            this.setSaveSlot(this.settings.saveSlot);
            break;
          default:
            break;
        }
      } catch (err) {}
    }
  };

  updateSettings(settings) {
    this.setTurbo(settings['turbo']);
  }

  start() {
    this.isRunning = true;
    this.socketConnection.connect();
  }

  stop() {
    this.isRunning = false;
    this.socketConnection.disconnect();
  }

  setPaused(paused) {
    this.ui.setPaused(paused);
  }

  setCanvas(width, height) {
    if (this.didSetCanvas) {
      return;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.didSetCanvas = true;
  }

  updateFrame() {
    this.ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
  }

  setSaveSlot(slot) {
    this.settings.saveSlot = Math.min(9, Math.max(0, slot));
    var hasSave = this.rom.save_states.indexOf(this.settings.saveSlot) !== -1;
    this.ui.setSaveSlot(this.settings.saveSlot, hasSave);
  }

  saveState() {
    var hasSave = this.rom.save_states.indexOf(this.settings.saveSlot) !== -1;
    if (hasSave) {
      var confirmed = confirm("Are you sure you want to overwrite the save in slot " + this.settings.saveSlot + "?");
      if (!confirmed) {
        return;
      }
    }

    this.socketConnection.send("state-save-" + this.settings.saveSlot);
    this.ui.showToast("Saved state " + this.settings.saveSlot);
  }

  loadState() {
    var confirmed = confirm("Are you sure you want to load to save in slot " + this.settings.saveSlot + "?");
    if (!confirmed) {
      return;
    }
    this.socketConnection.send("state-load-" + this.settings.saveSlot);
  }

  setTurbo(enabled) {
    if (enabled === this.settings.turbo) {
      return;
    }

    this.settings.turbo = enabled;
    var enabledText = enabled ? "on" : "off";
    this.socketConnection.send("setting-turbo-" + enabledText);

    this.ui.setTurbo(enabled);
  }

  reloadEmulator() {
    this.socketConnection.send("reload");
  }

  waitForDoubleClick(action, single, double) {
    var currHandler = this.dblClickHandlers[action];
    if (currHandler) {
      clearTimeout(currHandler);
      delete this.dblClickHandlers[action];
      double();
    } else {
      this.dblClickHandlers[action] = setTimeout(() => {
        delete this.dblClickHandlers[action];
        single();
      }, 250);
    }
  }

  handleCustom(type, action) {
    switch(action) {
      case "NEXT_STATE":
        if (type === "up") {
          this.setSaveSlot(this.settings.saveSlot + 1);
        }
        break;
      case "PREV_STATE":
        if (type === "up") {
          this.setSaveSlot(this.settings.saveSlot - 1);
        }
        break;
      case "RIGHT_STICK":
        if (type === "down") {
          this.waitForDoubleClick(action, this.saveState, this.loadState);
        }
        break;
      case "RIGHT_BOTTOM_SHOULDER":
        this.setTurbo(type === "down");
        break;
    }
  }

  axisChanged(event) {
    var lastAxisKey = this.axis[event.axis];
    var key = AXIS_MAP[event.axis](event.value);
    if (key) {
      this.keyDown({control: key});
    } else if (lastAxisKey) {
      this.keyUp({control: lastAxisKey});
    }
    this.axis[event.axis] = key;
  }

  onEvent(type, control) {
    if(!this.isRunning) {
      return;
    }

    this.socketConnection.resetTimeout();

    if (control in CUSTOM_MAP) {
      this.handleCustom(type, control);
      return;
    }

    var key = GAMEPAD_MAP[control];
    if (key !== undefined) {
      this.socketConnection.send("key-" + type + "-" + key);
    }
  }

  keyDown(event) {
    this.onEvent("down", event.control);
  }

  keyUp(event) {
    this.onEvent("up", event.control);
  }
}