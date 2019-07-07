## Crowdsourced Gameboy Advanced

Inspired by [Twitch Plays Pokemon](https://www.twitch.tv/twitchplayspokemon).

This brings the idea of crowdsourced gaming off of twitch and onto a more global platform, the web browser.

### Building Python Emulator

#### Docker

Make sure you have docker installed, then run the following in the root directory of the repository:
```bash
docker build . -t crowdsourced-gba
docker run -p 3000:8888 -e LD_LIBRARY_PATH=/home/emulator -v `pwd`:/home crowdsourced-gba
```

The first line builds the Docker image, called `crowdsourced-gba`, with all the dependencies listed in the Dockerfile and then performs the building process for the emulator.
The second line loads the Docker image and starts up the python server with the port 8888 exposed in the container.
The exposed port is then connected on the local machine on port 3000.

#### OSX

First, install all the dependencies in `requirements.txt`

```bash
pip install -r requirements.txt
```

mgba, the emulator, has its own dependencies.
```bash
brew install cmake ffmpeg imagemagick libzip qt5 sdl2 libedit
```

The following commands are to produce the `mgba` python library.
```bash
cd emulator
./osx_make.sh
make mgba-py
```

There should now be a `python` directory, this contains the source code to install as a python module.
```bash
pip install -e ./python
```

To test, running the following command should not produce any errors.

```bash
python -c "import mgba"
```

__Note__: If you're getting an `ImportError` due to importing mgba, try setting the following environment variable to the directory where the dylib files are stored (denoted as `MGBA_DYLIB_PATH`).

```bash
export DYLD_LIBRARY_PATH=MGBA_DYLIB_PATH
```

Finally, to run the python server:

```bash
python src/main.py roms/legend_of_zelda_the_minish_cap.gba
```

The only argument is the GBA binary file, which in the example is *The Legend of Zelda: The Minish Cap*.

### Unit Tests

To run the python tests:

```bash
python -m unittest discover -s src/tests -p '*.py'
```

### Dependencies

- [mgba](https://github.com/mgba-emu/mgba), GBA emulator with exposed python APIs (Distributed under the [Mozilla Public License version 2.0](https://www.mozilla.org/en-US/MPL/2.0/))
- [Tornado](https://github.com/tornadoweb/tornado), python web server that supports websockets natively
- [Pillow](https://github.com/python-pillow/Pillow), python imaging library
