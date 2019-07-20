(function(module) {
  class Constants {
    constructor() {
      window.onbeforeunload = () => "";

      this.VIEW_CONFIG = {
        width: 1280,
        height: 648,
        sidebarWidth: 154
      };

      this.SWITCH_KEY_LABELS = {
        FACE_1: "B",
        FACE_2: "A",
        FACE_3: "Y",
        FACE_4: "X",
        LEFT_TOP_SHOULDER: "Shoulder Left: Front",
        LEFT_BOTTOM_SHOULDER: "Shoulder Left: Back",
        RIGHT_TOP_SHOULDER: "Shoulder Right: Front",
        RIGHT_BOTTOM_SHOULDER: "Shoulder Right: Back",
        START_FORWARD: "Start",
        SELECT_BACK: "Select",
        DPAD_UP: "DPad Up",
        DPAD_DOWN: "DPad Down",
        DPAD_LEFT: "DPad Left",
        DPAD_RIGHT: "DPad Right",
        LEFT_STICK_LEFT: "Left Stick: Left",
        LEFT_STICK_RIGHT: "Left Stick: Right",
        LEFT_STICK_UP: "Left Stick: Up",
        LEFT_STICK_DOWN: "Left Stick: Down",
        LEFT_STICK: "Left Stick: Press",
        RIGHT_STICK_LEFT: "Right Stick: Left",
        RIGHT_STICK_RIGHT: "Right Stick: Right",
        RIGHT_STICK_UP: "Right Stick: Up",
        RIGHT_STICK_DOWN: "Right Stick: Down",
        RIGHT_STICK: "Right Stick: Press"
      };

      this.AXIS_THRESHOLD_WEAK = 0.3;
      this.AXIS_THRESHOLD_STRONG = 0.6;
      this.AXIS_MAP = {
        LEFT_STICK_X: val =>
          val > this.AXIS_THRESHOLD_WEAK
            ? "LEFT_STICK_RIGHT"
            : val < -this.AXIS_THRESHOLD_WEAK
            ? "LEFT_STICK_LEFT"
            : null, // left right
        LEFT_STICK_Y: val =>
          val > this.AXIS_THRESHOLD_WEAK
            ? "LEFT_STICK_DOWN"
            : val < -this.AXIS_THRESHOLD_WEAK
            ? "LEFT_STICK_UP"
            : null, // up down
        RIGHT_STICK_X: val =>
          val > this.AXIS_THRESHOLD_STRONG
            ? "RIGHT_STICK_RIGHT"
            : val < -this.AXIS_THRESHOLD_STRONG
            ? "RIGHT_STICK_LEFT"
            : null,
        RIGHT_STICK_Y: val =>
          val > this.AXIS_THRESHOLD_STRONG
            ? "RIGHT_STICK_DOWN"
            : val < -this.AXIS_THRESHOLD_STRONG
            ? "RIGHT_STICK_UP"
            : null
      };
    }
  }
  module.Constants = new Constants();
})(window);
