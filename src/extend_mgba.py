from mgba._pylib import lib

SAVESTATE_SCREENSHOT = 1
SAVESTATE_SAVEDATA = 2
SAVESTATE_CHEATS = 4
SAVESTATE_RTC = 8
SAVESTATE_METADATA = 16

# mCoreSaveState(runner->core, ((int) item->data) >> 16, SAVESTATE_SCREENSHOT | SAVESTATE_SAVEDATA | SAVESTATE_RTC | SAVESTATE_METADATA);
# mCoreLoadState(runner->core, ((int) item->data) >> 16, SAVESTATE_SCREENSHOT | SAVESTATE_RTC);

def save_state(core, slot):
    return lib.mCoreSaveState(core._core, slot, SAVESTATE_SCREENSHOT | SAVESTATE_SAVEDATA | SAVESTATE_RTC | SAVESTATE_METADATA)

def load_state(core, slot):
    return lib.mCoreLoadState(core._core, slot, SAVESTATE_SCREENSHOT | SAVESTATE_RTC)

def get_state(core, slot):
    return lib.mCoreGetState(core._core, slot, False)

def load_state_named(core, vf, flags):
    return lib.mCoreLoadStateNamed(core._core, vf, flags)