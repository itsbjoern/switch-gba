function sendDebug() {
  var url = window.location.origin + "/debug";
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(
    JSON.stringify({
      data: arguments
    })
  );
}

var VIEW_CONFIG = {
  width: 1280,
  height: 648,
  sidebarWidth: 154
};

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
  SETTING_RIGHT: -2,
  SETTING_LEFT: -3,
  SETTING_UP: -4,
  SETTING_DOWN: -5,
  RIGHT_BOTTOM_SHOULDER: -6,
  RIGHT_STICK: -7
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
      ? "SETTING_RIGHT"
      : val < -AXIS_THRESHOLD_STRONG
      ? "SETTING_LEFT"
      : null,
  RIGHT_STICK_Y: val =>
    val > AXIS_THRESHOLD_STRONG
      ? "SETTING_DOWN"
      : val < -AXIS_THRESHOLD_STRONG
      ? "SETTING_UP"
      : null
};
