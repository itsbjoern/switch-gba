class Game {
  constructor() {
    document.addEventListener("DOMContentLoaded", this.onLoad.bind(this));

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

  onLoad() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.ui = new UI(this);
    this.settings = new Settings([
      {
        name: "Slot",
        index: 0,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      },
      {
        name: "Turbo",
        enabled: false,
        index: 0,
        values: [2, 5, 10, 20],
        onChange: this.changeTurbo.bind(this)
      }
    ]);
    this.start();
  }

  handleEvent(event) {
    if (event.data instanceof Blob) {
      this.image.src = URL.createObjectURL(event.data);
    } else {
      try {
        var json = JSON.parse(event.data);
        switch (json.event) {
          case "metadata":
            this.setCanvas(json.width, json.height);
            this.updateSettings(json.settings);
            this.rom = json.rom;

            var slotSetting = this.settings.getSettingByName("Slot");
            slotSetting.setEnabledList(this.rom.save_states);
            break;
          default:
            break;
        }
      } catch (err) {}
    }
  }

  updateSettings(settings) {
    var turboSetting = this.settings.getSettingByName("Turbo");
    var turbo = settings["turbo"];
    turboSetting.setValue(turbo);
  }

  start() {
    this.socketConnection.connectAsync().then(() => {
      this.isRunning = true;
    });
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

  getConfirmation(message) {
    return this.socketConnection.disconnectAsync(true).then(() => {
      var confirmed = confirm(message);
      return this.socketConnection.connectAsync(true).then(() => {
        return Promise.resolve(confirmed);
      });
    });
  }

  saveState() {
    var slot = this.settings.getSettingByName("Slot").currentValue;
    var hasSave = this.rom.save_states.indexOf(slot) !== -1;
    if (hasSave) {
      this.getConfirmation(
        "Are you sure you want to overwrite the save in slot " + slot + "?"
      ).then(confirmed => {
        if (!confirmed) {
          return;
        }
        this.socketConnection.send("state-save-" + slot);
        this.ui.showToast("Saved state " + slot);
      });
    } else {
      this.socketConnection.send("state-save-" + slot);
      this.ui.showToast("Saved state " + slot);
    }
  }

  loadState() {
    var slot = this.settings.getSettingByName("Slot").currentValue;
    this.getConfirmation(
      "Are you sure you want to load to save in slot " + slot + "?"
    ).then(confirmed => {
      if (!confirmed) {
        return;
      }
      this.socketConnection.send("state-load-" + slot);
    });
  }

  changeTurbo(type, value) {
    if (type !== "currentValue") {
      return;
    }

    this.socketConnection.send("setting-turbovalue-" + value);
  }

  setTurbo(enabled) {
    var turboSetting = this.settings.getSettingByName("Turbo");
    if (enabled === turboSetting.enabled) {
      return;
    }

    turboSetting.setEnabled(enabled);
    var value = enabled ? "on" : "off";
    this.socketConnection.send("setting-turbo-" + value);
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

  axisChanged(event) {
    var lastAxisKey = this.axis[event.axis];
    var key = Constants.AXIS_MAP[event.axis](event.value);
    if (key) {
      this.keyDown({ control: key });
    } else if (lastAxisKey) {
      this.keyUp({ control: lastAxisKey });
    }
    this.axis[event.axis] = key;
  }

  onEvent(type, control) {
    if (!this.isRunning) {
      return;
    }

    this.socketConnection.resetTimeout();
    var key = KEY_LAYOUT.find(k => k.switchKey === control);

    if (key === undefined) {
      return;
    }
    const isStick =
      control.startsWith("LEFT_STICK") || control.startsWith("RIGHT_STICK");

    switch (key.gbaKey) {
      case 10:
        this.setTurbo(type === "down");
        break;
      case 11:
        if (isStick && type !== "up") break;
        this.settings.selectPreviousSetting();
        break;
      case 12:
        if (isStick && type !== "up") break;
        this.settings.selectNextSetting();
        break;
      case 13:
        if (isStick && type !== "up") break;
        this.settings.selectNextValue();
        break;
      case 14:
        if (isStick && type !== "up") break;
        this.settings.selectPreviousValue();
        break;
      case 15:
        if (isStick && type !== "up") break;
        this.saveState();
        break;
      case 16:
        if (isStick && type !== "up") break;
        this.loadState();
        break;
      default:
        this.socketConnection.send("key-" + type + "-" + key.gbaKey);
    }
  }

  keyDown(event) {
    this.onEvent("down", event.control);
  }

  keyUp(event) {
    this.onEvent("up", event.control);
  }
}
