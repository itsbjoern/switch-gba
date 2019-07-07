FROM python:3.6-jessie

RUN apt-get update && \
    yes | apt-get install \
    qtbase5-dev \
    libsdl2-2.0 \
    zlib1g-dev \
    libedit-dev \
    libav-tools \
    libzip-dev \
    imagemagick \
    sqlite3 \
    libsqlite3-dev \
    libelf-dev \
    libpng-dev

ADD https://cmake.org/files/v3.7/cmake-3.7.2-Linux-x86_64.sh /cmake-3.7.2-Linux-x86_64.sh
RUN mkdir /opt/cmake
RUN sh /cmake-3.7.2-Linux-x86_64.sh --prefix=/opt/cmake --skip-license
RUN ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake
RUN pip install 'tornado==4.5.2' 'cffi==1.11.2' 'Pillow==4.3.0'
COPY . /home
RUN cd /home/emulator && \
    cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr . -DBUILD_PYTHON=ON -DBUILD_SERVER=OFF && \
    make mgba-py && \
    pip install -e ./python

EXPOSE 8888

CMD python /home/src/main.py /home/roms/legend_of_zelda_the_minish_cap.gba