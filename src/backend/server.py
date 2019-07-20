import os
import threading
import tornado
from tornado import web, ioloop
from backend import minify, layout, emulator, handler

class Server(web.Application):
    clients = set()
    metadata = dict()
    emulator = None
    emulator_thread = None

    curr_path = os.path.dirname(__file__)
    rom_path = os.path.join(curr_path, "..", "..", "roms")
    rom_objects = []
    current_game = None

    def __init__(self):
        _settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), '..', 'static'),
            static_path=os.path.join(os.path.dirname(__file__), '..', 'static'),
            debug=True,
            autoreload=True
        )
        _handlers = [
            (r'/', handler.IndexHandler),
            (r'/game', handler.GameHandler),
            (r'/frame', handler.FrameHandler),
            (r'/layout', handler.LayoutHandler),
            (r'/debug', handler.DebugHandler),
            (r'/ws', handler.SocketHandler),
            (r'/favicon.ico', web.StaticFileHandler, { 'path': '../static' })
        ]
        super().__init__(_handlers, **_settings)

        self.current_layout = layout.load_layout()

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
