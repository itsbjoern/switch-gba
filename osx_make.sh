#!/usr/bin/env bash

mkdir emulator
cd emulator
cmake -DCMAKE_PREFIX_PATH=`brew --prefix qt5` ../mgba -DBUILD_PYTHON=ON -DBUILD_SERVER=OFF -DBUILD_SDL=OFF -DBUILD_QT=OFF
make mgba-py-develop
cd ..
