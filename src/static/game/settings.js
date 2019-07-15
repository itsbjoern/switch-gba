class SettingsItem {
  constructor(init) {
    this.didInit = false;

    this.name = init.name;
    this.values = init.values;
    this.index = init.index || 0;
    this.enabledList = init.enabledList || [];
    this.enabled = init.enabled || false;
    this.onChange = init.onChange || null;
    this.onUpdate = init.onUpdate || null;

    this.setIndex(this.index);
    this.didInit = true;
  }

  changeHandler(type) {
    this.didInit && this.onChange && this.onChange(type, this[type]);
  }

  updateHandler() {
    this.didInit && this.onUpdate && this.onUpdate();
  }

  setIndex(index) {
    if (index === -1) {
      return;
    }
    this.index = Math.max(0, Math.min(this.values.length - 1, index));
    this.currentValue = this.values[this.index];

    this.updateHandler();
    this.changeHandler("currentValue");
  }

  setValue(value) {
    this.setIndex(this.values.indexOf(value));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.updateHandler();
    this.changeHandler("enabled");
  }

  setEnabledList(list) {
    this.enabledList = list;
    this.updateHandler();
    this.changeHandler("enabledList");
  }
}

class Settings {
  constructor(settings) {
    this.selectedIndex = 0;
    this.order = settings.map(s => s.name);
    this.settings = {};

    for (var index in settings) {
      var setting = settings[index];
      this.settings[setting.name] = new SettingsItem(setting);
      this.settings[setting.name].onUpdate = this.updateDisplay.bind(this);
    }

    this.settingsNode = document.getElementById("settings");
    this.generateDisplay();
  }

  generateDisplay() {
    for (var i = 0; i < this.order.length; i++) {
      var setting = this.getSetting(i);

      var settingNode = document.createElement("div");
      settingNode.className = "setting" + (i === 0 ? " active" : "");
      settingNode.id = setting.name;

      var titleNode = document.createElement("h2");
      titleNode.innerHTML = setting.name;
      settingNode.appendChild(titleNode);

      var containerNode = document.createElement("div");
      containerNode.className = "setting-container";

      var wrapContainer = document.createElement("div");
      wrapContainer.className = "wrap-container";
      containerNode.appendChild(wrapContainer);

      for (var valueIndex in setting.values) {
        var value = setting.values[valueIndex];
        var valueNode = document.createElement("p");
        valueNode.className = "setting-value";
        valueNode.className +=
          (valueIndex == 0 ? " current" : " next") +
          " child-" +
          Math.abs(valueIndex);
        valueNode.innerHTML = value;

        wrapContainer.appendChild(valueNode);
      }

      settingNode.appendChild(containerNode);
      this.settingsNode.appendChild(settingNode);
    }
  }

  updateDisplay() {
    var activeSetting = this.getSetting(this.selectedIndex);

    for (var i in this.order) {
      var setting = this.getSetting(i);
      var settingNode = this.settingsNode.childNodes[i];
      settingNode.className = "setting";

      var listCheck =
        setting.enabledList &&
        setting.enabledList.indexOf(setting.currentValue) !== -1;
      if (setting.enabled || listCheck) {
        settingNode.className += " enabled";
      }

      if (setting.name === activeSetting.name) {
        settingNode.className += " active";
      }

      var currentNode = settingNode.getElementsByClassName("current")[0];
      if (currentNode.innerHTML !== "" + setting.currentValue) {
        var wrapNode = settingNode.getElementsByClassName("wrap-container")[0];
        for (var j = 0; j < wrapNode.childNodes.length; j++) {
          var iterNode = wrapNode.childNodes[i];
          var dist = i - setting.index;
          var childType = dist === 0 ? "current" : dist < 0 ? "prev" : "next";

          iterNode.className =
            "setting-value " + childType + " child-" + Math.abs(dist);
        }
      }
    }
  }

  getSetting(forIndex) {
    return this.settings[this.order[forIndex]];
  }

  getSettingByName(name) {
    return this.settings[name];
  }

  selectNextValue() {
    var setting = this.getSetting(this.selectedIndex);
    setting.setIndex(setting.index + 1);
    this.updateDisplay();
  }

  selectPreviousValue() {
    var setting = this.getSetting(this.selectedIndex);
    setting.setIndex(setting.index - 1);
    this.updateDisplay();
  }

  selectNextSetting() {
    this.selectedIndex = Math.min(
      this.order.length - 1,
      this.selectedIndex + 1
    );
    this.updateDisplay();
  }

  selectPreviousSetting() {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    this.updateDisplay();
  }
}
