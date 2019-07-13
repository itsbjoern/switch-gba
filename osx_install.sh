#!/usr/bin/env bash

brew install cmake ffmpeg imagemagick libzip qt5 sdl2 libedit
pip install -r requirements.txt

./osx_make.sh
