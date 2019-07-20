class SocketConnection {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.messageHandler = null;
    this.connected = false;

    this.timeoutInSeconds = 10;
    this.timeout = null;

    this.disconnect = this.disconnect.bind(this);
  }

  send(data) {
    if (!this.socket || !this.connected) {
      return;
    }
    this.socket.send(data);
  }

  connect(ignoreHandlers) {
    this.connectAsync(ignoreHandlers);
  }

  connectAsync(ignoreHandlers) {
    var protocol = window.location.protocol === "https:" ? "wss" : "ws";

    return new Promise(resolve => {
      if (this.socket) {
        resolve();
      }
      this.socket = new WebSocket(protocol + "://" + this.url + "/ws");
      this.socket.onopen = this.onOpen.bind(this, resolve, ignoreHandlers);
      this.socket.onclose = this.onClose.bind(this, null);
      this.socket.onmessage = this.messageHandler;
    });
  }

  disconnect(ignoreHandlers) {
    this.disconnectAsync(ignoreHandlers);
  }

  disconnectAsync(ignoreHandlers) {
    return new Promise(resolve => {
      if (!this.socket) {
        resolve();
      }
      this.connected = false;
      this.socket.onclose = this.onClose.bind(this, resolve, ignoreHandlers);
      this.socket.close();
    });
  }

  onOpen(done, ignoreHandlers) {
    this.connected = true;
    this.timeout = setTimeout(this.disconnect, this.timeoutInSeconds * 1000);
    done && done();
    !ignoreHandlers && this.didOpen && this.didOpen();
  }

  onClose(done, ignoreHandlers) {
    this.socket = null;
    done && done();
    !ignoreHandlers && this.didClose && this.didClose();
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