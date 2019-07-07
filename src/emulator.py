import mgba.core, mgba.image, io
import time

class Emulator(object):
    def __init__(self, rom_path, web_server):
        self.web_server = web_server
        self.core = mgba.core.loadPath(rom_path)
        self.width, self.height = self.core.desiredVideoDimensions()
        self.image = mgba.image.Image(self.width, self.height)
        self.core.setVideoBuffer(self.image)
        self.core.autoloadSave()
        print(mgba.gba.GBA.KEY_A)

        # Reset the core. This is needed before it can run.
        self.core.reset()
        self.enabled = True

        # The actions will be stored in a queue.
        self.queue = []

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

                EXTREMELY_MAGIC_NUMBER = 15
                key = EXTREMELY_MAGIC_NUMBER if len(self.queue) == 0 else self.queue.pop(0)
                self.core.setKeys(key)
                self.core.runFrame()
                self.web_server.emit_frame(self.get_frame())
        except:
            pass


    def get_frame(self):
        try:
            image = self.image.toPIL().convert('RGB')
            buf = io.BytesIO()
            image.save(buf, format='PNG')
            return buf.getvalue()[:]
        except:
            return []

    def push_key(self, key):
        self.queue.append(key)