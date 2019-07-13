import os.path, tornado
from mgba.gba import GBA
from tornado import websocket, web, ioloop
from ringbuffer import RingBuffer

class Server:
    # Store all active clients in a set.
    clients = set()
    # Data to send to the client when entering.
    metadata = dict()
    # The emulator instance
    emulator = None

    # Stores all the commands in a ring buffer of size 1000
    all_logs = RingBuffer(1000)

    # mapping of keynames that the client will use
    KEYMAP = {GBA.KEY_A: 'a', GBA.KEY_B: 'b', GBA.KEY_SELECT: 'select', GBA.KEY_START: 'start', GBA.KEY_RIGHT: 'right',
              GBA.KEY_LEFT: 'left', GBA.KEY_UP: 'up', GBA.KEY_DOWN: 'down', GBA.KEY_R: 'r', GBA.KEY_L: 'l'}

    def __init__(self):
        self._settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), 'static'),
            static_path=os.path.join(os.path.dirname(__file__), 'static'),
            debug=True,
            autoreload=True
        )
        self._handlers = [
            (r'/', Server.IndexHandler),
            (r'/frame', Server.FrameHandler),
            (r'/debug', Server.DebugHandler),
            (r'/ws', Server.SocketHandler),
            (r'/favicon.ico', web.StaticFileHandler, { 'path': '.' })
        ]

        self.app = web.Application(self._handlers, **self._settings)

    class IndexHandler(web.RequestHandler):
        def get(self):
            self.render('index.html')

    class FrameHandler(web.RequestHandler):
        def get(self):
            self.render('frame.html')

    class DebugHandler(web.RequestHandler):
        def post(self):
            data = tornado.escape.json_decode(self.request.body)
            print("[DEBUG] ", data)
            self.write({"ok": True})

    class SocketHandler(websocket.WebSocketHandler):
        def open(self):
            Server.clients.add(self)
            self.write_message(Server.metadata)
            buffer_index = Server.all_logs.index
            if buffer_index > 0:
                self.write_message({ 'event': 'all logs', 'data': Server.all_logs.get_k_recent(buffer_index) })


        def handleKey(self, action, key):
            # Assume that b key is pressed until other key is pressed
            if key == GBA.KEY_B:
                Server.emulator.push_key(int(key))
                Server.emulator.key_down(int(key))
                return
            else:
                Server.emulator.key_up(int(key))

            if action == "down":
                Server.emulator.key_down(int(key))
            elif action == "up":
                Server.emulator.key_up(int(key))
            elif action == "press":
                Server.emulator.push_key(int(key))

        def handleSetting(self, setting, enabled):
            is_enabled = enabled == "on"
            if setting == "turbo":
                Server.emulator.set_turbo(is_enabled)

        def on_message(self, msg):
            if Server.emulator is None:
                client.captureMessage('Socket event with undefined emulator core')
                return

            split = msg.split("-")
            interaction = split[0]

            if interaction == "key":
                self.handleKey(split[1], split[2])
            elif interaction == "setting":
                self.handleSetting(split[1], split[2])

        def on_close(self):
            Server.clients.remove(self)

        def check_origin(self, orgin):
            return True

    def set_emulator(self, emulator):
        Server.emulator = emulator
        Server.metadata['event'] = 'metadata'
        Server.metadata['width'] = emulator.width
        Server.metadata['height'] = emulator.height

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

    def listen(self, port):
        self.app.listen(port)


if __name__ == '__main__':
    Server().listen(8888)
    ioloop.IOLoop.instance().start()
