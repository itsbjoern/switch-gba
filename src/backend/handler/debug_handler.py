from tornado import web, escape

class DebugHandler(web.RequestHandler):
    def post(self):
        data = escape.json_decode(self.request.body)
        print("[DEBUG] ", data)
        self.write({"ok": True})
