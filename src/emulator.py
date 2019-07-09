import mgba.core, mgba.image, mgba.log
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

        # The actions will be stored in a queue.
        self.queue = []
        self.keys_down = []

    def run(self):
        frames = 0
        last_frame = time.time()
        last_frame_timing = time.time()
        try:
            while self.enabled:
                curr_frame = time.time()
                delta = curr_frame - last_frame
                if delta < 1 / 60:
                    continue
                last_frame = curr_frame

                frames += 1
                if curr_frame - last_frame_timing >= 1:
                    frames = 0
                    last_frame_timing = curr_frame

                # 0 is 'a' so this number allows execution without seemingly doing anything
                EXTREMELY_MAGIC_NUMBER = 15
                key = EXTREMELY_MAGIC_NUMBER
                if len(self.queue) != 0:
                    key = self.queue.pop(0)
                elif len(self.keys_down) != 0:
                    key = self.keys_down[0]

                # multiple args possible
                self.core.set_keys(key)
                self.core.run_frame()
                self.web_server.emit_frame(self.get_frame())
                # audio_channels = self.core.get_audio_channels()
        except:
            pass


    def get_frame(self):
        try:
            image = self.image.to_pil().convert('RGB')
            buf = io.BytesIO()
            image.save(buf, format='JPEG', quality=100)
            return buf.getvalue()[:]
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