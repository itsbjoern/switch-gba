import server, emulator, sys, threading
import tornado.ioloop

def usage():
    print('Invalid arguments: python %s <rom file>' % (sys.argv[0]))

def thread_function(core):
    core.run()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        usage()
        sys.exit(0)

    # Service instantiation.
    web_server = server.Server()
    emulator = emulator.Emulator(sys.argv[1], web_server)
    web_server.set_emulator(emulator)

    # Start both services.
    # Start the emulator service first and run in a background thread.
    emulator_thread = threading.Thread(target=thread_function, args=(emulator,))
    emulator_thread.start()
    print("[!] Emulator started")

    web_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()