import os

STATIC_PATH = os.path.join(os.path.dirname(__file__), '..', 'static')

def minify(folder, dev=True):
    js_data = gather(folder)

    if not dev:
        # run minify
        pass

    ext = "" if dev else ".min"
    lib_file = os.path.join(STATIC_PATH, folder, "{}{}.js".format("combined", ext))
    with open(lib_file, 'w') as fd:
        fd.write(js_data)

def gather(folder):
    js_path = os.path.join(STATIC_PATH, folder, "js")
    if not os.path.isdir(js_path):
        raise Exception("Folder does not exist")

    js_data = ""
    js_lib_path = os.path.join(STATIC_PATH, "js-lib")
    js_libs = [os.path.join(js_lib_path, lib) for lib in os.listdir(js_lib_path)]

    js_files = [os.path.join(js_path, js) for js in os.listdir(js_path)]
    for path in [*js_libs, *js_files]:
        with open(path, 'r') as fd:
            js_data += fd.read()
            js_data += "\n\n"

    return js_data