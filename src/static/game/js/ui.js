class UI {
  constructor(gameInstance) {
    this.gameInstance = gameInstance;
    this.pause = document.getElementById("pause");
    this.toastContainer = document.getElementById("toast-container");

    this.backButton = document.getElementById("backbutton");
    this.backButton.addEventListener("click", this.goBack.bind(this));

    this.resetButton = document.getElementById("resetbutton");
    this.resetButton.addEventListener("click", this.reloadEmulator.bind(this));

    this.reloadButton = document.getElementById("reloadbutton");
    this.reloadButton.addEventListener("click", this.reload.bind(this));
  }

  setPaused(paused) {
    this.pause.style.display = paused ? "flex" : "none";
  }

  showToast(text) {
    var toast = document.createElement("div");
    toast.innerHTML = text;
    toast.className = "toast";

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      this.toastContainer.removeChild(toast);
    }, 2000);
  }

  goBack() {
    this.gameInstance
      .getConfirmation(
        "Are you sure you want to go back to the ROM select screen?"
      )
      .then(confirmed => {
        if (!confirmed) {
          return;
        }
        location.href = location.origin;
      });
  }

  reloadEmulator() {
    this.gameInstance
      .getConfirmation(
        "Are you sure you want to restart the emulator? Progress will not be saved!"
      )
      .then(confirmed => {
        if (!confirmed) {
          return;
        }
        this.gameInstance.reloadEmulator();
      });
  }

  reload() {
    window.location.reload();
  }
}
