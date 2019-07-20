from tornado import web, escape
from backend import layout

def find_index(func, sequence):
    for i in range(len(sequence)):
        if func(sequence[i]):
            return i
    return None

class LayoutHandler(web.RequestHandler):
    def post(self):
        app = self.application
        data = escape.json_decode(self.request.body)
        index = find_index(lambda x: x['gbaKey'] == data['gba_key'],  app.current_layout)
        if index is None:
            return
        app.current_layout[index]['switchKey'] = data['switch_key']
        layout.save_layout(app.current_layout)