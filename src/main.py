from backend import server
import tornado.ioloop

if __name__ == '__main__':
    # Service instantiation.
    web_server = server.Server()
    web_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
