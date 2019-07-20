from tornado import websocket

class SocketHandler(websocket.WebSocketHandler):
    def open(self):
        app = self.application
        app.clients.add(self)
        app.emulator.paused = False

        metadata = app.metadata
        metadata['event'] = 'metadata'
        metadata['settings'] = {}
        metadata['rom'] = app.current_game
        metadata['settings']['turbo'] = app.emulator.turbo_value
        self.write_message(metadata)

    def handle_key(self, action, key):
        app = self.application
        if action == "down":
            app.emulator.key_down(int(key))
        elif action == "up":
            app.emulator.key_up(int(key))

    def handle_setting(self, setting, extra):
        if setting == "turbo":
            enabled = extra == "on"
            self.application.emulator.set_turbo(enabled)
        if setting == "turbovalue":
            self.application.emulator.set_turbo_value(int(extra))

    def handle_state(self, action, slot):
        app = self.application

        slot = int(slot)
        if action == "save":
            app.emulator.save_state(slot)
        elif action == "load":
            app.emulator.load_state(slot)

    def on_message(self, msg):
        app = self.application
        if app.emulator is None:
            client.captureMessage('Socket event with undefined emulator core')
            return

        split = msg.split("-")
        interaction = split[0]

        if interaction == "key":
            self.handle_key(split[1], split[2])
        elif interaction == "setting":
            self.handle_setting(split[1], split[2])
        elif interaction == "reload":
            app.emulator.core.reset()
        elif interaction == "state":
            self.handle_state(split[1], split[2])

    def on_close(self):
        app = self.application
        app.clients.remove(self)
        if len(app.clients) == 0:
            app.emulator.paused = True
            app.emulator.release_keys()

    def check_origin(self, origin):
        return True
