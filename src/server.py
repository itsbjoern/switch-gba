import os
import threading
import tornado
import emulator
import urllib.parse
from tornado import websocket, web, ioloop
from mgba.gba import GBA

class Server(web.Application):
    clients = set()
    metadata = dict()
    emulator = None
    emulator_thread = None

    curr_path = os.path.dirname(__file__)
    rom_path = os.path.join(curr_path, "..", "roms")
    rom_objects = []
    current_game = None

    # mapping of keynames that the client will use
    KEYMAP = {GBA.KEY_A: 'a', GBA.KEY_B: 'b', GBA.KEY_SELECT: 'select', GBA.KEY_START: 'start', GBA.KEY_RIGHT: 'right',
              GBA.KEY_LEFT: 'left', GBA.KEY_UP: 'up', GBA.KEY_DOWN: 'down', GBA.KEY_R: 'r', GBA.KEY_L: 'l'}

    def __init__(self):
        _settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), 'static'),
            static_path=os.path.join(os.path.dirname(__file__), 'static'),
            debug=True,
            autoreload=True
        )
        _handlers = [
            (r'/', self.IndexHandler),
            (r'/game', self.GameHandler),
            (r'/frame', self.FrameHandler),
            (r'/debug', self.DebugHandler),
            (r'/ws', self.SocketHandler),
            (r'/favicon.ico', web.StaticFileHandler, { 'path': '.' })
        ]
        super().__init__(_handlers, **_settings)

        tornado.autoreload.add_reload_hook(self.before_reload)
        self.emulator = emulator.Emulator(self)
        print('[!] Started Webserver')

    def before_reload(self):
        if self.emulator:
            self.emulator.stop()
        if self.emulator_thread:
            self.emulator_thread.join()

    def thread_function(self, core, path):
        core.run(path)

    def get_rom_data(self, rom):
        files = os.listdir(self.rom_path)
        path = os.path.join(self.rom_path, rom)
        f = open(path, 'rb')
        f.seek(160)
        name = f.read(12).decode('utf-8')

        has_save = os.path.exists(os.path.join(self.rom_path, rom[:-4] + ".sav"))
        save_states = [int(name[-1]) for name in files if name.startswith(rom[:-4] + ".ss")]
        return {
            'name': name,
            'filename': rom,
            'has_save': has_save,
            'save_states': save_states,
            'index': len(self.rom_objects)
        }

    def reload_rom_list(self):
        files = os.listdir(self.rom_path)
        roms = list(filter(lambda x: x.endswith('.gba'), files))

        self.rom_objects = []
        for rom in roms:
            self.rom_objects.append(self.get_rom_data(rom))

    def load_rom(self, game):
        if self.current_game is not None:
            if game == self.current_game['filename']:
                return
            self.emulator.stop()
            self.emulator_thread.join()

        path = os.path.join(self.rom_path, game)

        self.emulator_thread = threading.Thread(target=self.thread_function, args=(self.emulator,path,))
        self.emulator_thread.start()
        self.current_game = self.get_rom_data(game)

    class IndexHandler(web.RequestHandler):
        def get(self):
            self.application.reload_rom_list()
            self.render('index/index.html', roms=self.application.rom_objects)

    class GameHandler(web.RequestHandler):
        def get(self):
            game = self.get_argument("game", None)
            if game is None:
                self.render('index/index.html', roms=self.application.rom_objects)

            self.application.load_rom(urllib.parse.unquote(game))
            self.render('game/game.html')

    class FrameHandler(web.RequestHandler):
        def get(self):
            self.render('game/frame.html')

    class DebugHandler(web.RequestHandler):
        def post(self):
            data = tornado.escape.json_decode(self.request.body)
            print("[DEBUG] ", data)
            self.write({"ok": True})

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

        def handleKey(self, action, key):
            app = self.application
            if action == "down":
                app.emulator.key_down(int(key))
            elif action == "up":
                app.emulator.key_up(int(key))

        def handleSetting(self, setting, extra):
            if setting == "turbo":
                enabled = extra == "on"
                self.application.emulator.set_turbo(enabled)
            if setting == "turbovalue":
                self.application.emulator.set_turbo_value(int(extra))

        def handleState(self, action, slot):
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
                self.handleKey(split[1], split[2])
            elif interaction == "setting":
                self.handleSetting(split[1], split[2])
            elif interaction == "reload":
                app.emulator.core.reset()
            elif interaction == "state":
                self.handleState(split[1], split[2])

        def on_close(self):
            app = self.application
            app.clients.remove(self)
            if len(app.clients) == 0:
                app.emulator.paused = True
                app.emulator.release_keys()

        def check_origin(self, origin):
            return True

    def set_size(self, width, height):
        self.metadata['width'] = width
        self.metadata['height'] = height

    def emit_frame(self, data):
        if data is None or len(data) <= 0:
            return
        @tornado.gen.coroutine
        def stream_frame(self):
            try:
                for client in Server.clients:
                    yield client.write_message(data, binary=True)
            except Exception as e:
                pass

        tornado.ioloop.IOLoop.current().spawn_callback(stream_frame, self)


if __name__ == '__main__':
    Server().listen(8888)
    ioloop.IOLoop.instance().start()
