import json
import os
from mgba.gba import GBA
from shutil import copyfile

# KEYMAP = {GBA.KEY_A: 'a', GBA.KEY_B: 'b', GBA.KEY_SELECT: 'select', GBA.KEY_START: 'start', GBA.KEY_RIGHT: 'right', GBA.KEY_LEFT: 'left', GBA.KEY_UP: 'up', GBA.KEY_DOWN: 'down', GBA.KEY_R: 'r', GBA.KEY_L: 'l'}

KEY_TURBO = 10
KEY_SETTINGS_NEXT_VAL = 11
KEY_SETTINGS_PREV_VAL = 12
KEY_SETTINGS_NEXT = 13
KEY_SETTINGS_PREV = 14
KEY_SAVE = 15
KEY_LOAD = 16

LAYOUT_FILE = os.path.join(os.path.dirname(__file__), 'layout.json')
BACKUP_FILE = os.path.join(os.path.dirname(__file__), 'layout.backup.json')

def load_layout():
    with open(LAYOUT_FILE) as fd:
        loaded = json.load(fd)
        return loaded

def save_layout(layout):
    with open(LAYOUT_FILE, 'w') as fd:
        json.dump(layout, fd)

def reset():
    copyfile(BACKUP_FILE, LAYOUT_FILE)
