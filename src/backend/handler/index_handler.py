from tornado import web
from backend import minify

class IndexHandler(web.RequestHandler):
    def get(self):
        minify.minify("index")
        app = self.application
        app.reload_rom_list()
        self.render('index/index.html', roms=app.rom_objects, layout=app.current_layout)