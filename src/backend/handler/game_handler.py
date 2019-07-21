from tornado import web
import urllib.parse
from backend import minify

class GameHandler(web.RequestHandler):
    def get(self):
        minify.minify("game")
        app = self.application

        game = self.get_argument("game", None)
        if game is None:
            self.render('index/index.html', roms=app.rom_objects, layout=app.current_layout)

        self.application.load_rom(urllib.parse.unquote(game))
        self.render('game/game.html', layout=app.current_layout, route="game")

class FrameHandler(web.RequestHandler):
    def get(self):
        self.render('game/frame.html')
