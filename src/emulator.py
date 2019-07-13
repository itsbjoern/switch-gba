import mgba.core, mgba.image, mgba.log
from mgba.gba import GBA
import io
import time

mgba.log.install_default(mgba.log.NullLogger())

class Emulator(object):
    def __init__(self, rom_path, web_server):
        self.web_server = web_server
        self.core = mgba.core.load_path(rom_path)
        self.width, self.height = self.core.desired_video_dimensions()
        self.image = mgba.image.Image(self.width, self.height)
        self.core.set_video_buffer(self.image)
        self.core.autoload_save()

        # Reset the core. This is needed before it can run.
        self.core.reset()
        self.enabled = True

        self.fps = 60
        self.imageBuf = io.BytesIO()

        # The actions will be stored in a queue.
        self.queue = []
        self.keys_down = []

    def run(self):
        last_frame = time.time()
        last_display_frame = time.time()
        try:
            while self.enabled:
                curr_frame = time.time()
                delta = curr_frame - last_frame
                if delta < 1 / 120:
                    continue
                last_frame = curr_frame

                # 0 is 'a' so this number allows execution without seemingly doing anything
                EXTREMELY_MAGIC_NUMBER = 15
                key = EXTREMELY_MAGIC_NUMBER
                if len(self.queue) != 0:
                    key = self.queue.pop(0)

                    # Hackily advance by one frame without b pressed to register new press
                    if key == GBA.KEY_B and len(self.keys_down) != 0:
                        if self.keys_down[0] == GBA.KEY_B:
                            self.core.set_keys(EXTREMELY_MAGIC_NUMBER)
                            self.core.run_frame()
                elif len(self.keys_down) != 0:
                    key = self.keys_down[0]

                # multiple args possible
                self.core.set_keys(key)
                self.core.run_frame()

                display_delta = curr_frame - last_display_frame
                if display_delta >= 1 / self.fps:
                    self.web_server.emit_frame(self.get_frame())
                    last_display_frame = curr_frame
        except:
            pass

    def set_fps(self, fps):
        self.fps = fps

    def get_frame(self):
        try:
            self.imageBuf.truncate(0)
            self.imageBuf.seek(0)
            image = self.image.to_pil().convert('RGB')
            image.save(self.imageBuf, format='WebP', lossless=True)
            return self.imageBuf.getvalue()[:]
        except:
            print("[!!] Error converting frame")
            return []

    def key_down(self, key):
        if key not in self.keys_down:
            self.keys_down.append(key)

    def key_up(self, key):
        if key in self.keys_down:
            self.keys_down.remove(key)

    def push_key(self, key):
        self.queue.append(key)