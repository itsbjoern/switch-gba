# Switch GBA Emulator
![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/bfriedrichs/switch-gba.svg)

## Motivation
Homebrewing / Hacking a switch is too much of a dangerous affair for me personally and after learning there is a browser I tried to get it running in there. Turns out it is (sort of) possible.

<img width="500" src="showcase/video_smaller.gif" />
<p float="left">
<img width="250" src="showcase/game.jpg" />
<img width="250" src="showcase/list.jpg" />
</p>

This project is meant as an experiment of what is possible and not to be used commercially.
This is a hobby project and therefore I won't commit to offering help / maintaining / updating this project unless I choose to do so.

This is a modified and heavily towards switch tailored version of [crowdsourced-gba](https://github.com/vinnyoodles/crowdsourced-gba) by vinnynoodles.

Switch supported HTML features http://html5test.com/s/a77ccd45f1540617.html

---
## Planned features
* [Done] Save states
* [Done] Gamepad API

---
## Button Layout
Thanks to the Gamepad API I was able to remove most of the onscreen buttons and enable hardware button support.

* A / B as usual
* Left stick for movement
* DPad right for start
* DPad down for select
* Front shoulder buttons for L / R
* Back right shoulder button for turbo mode while pressed
* Right stick left / right for selecting save state
* Right stick press for save
* Right stick double press for load

---
## How?
This project makes use of the Switch browser that comes up when trying to verify / sign in with certain DNS providers. I won't explain how to do this here but if are capable of setting this up you certainly will also be able to find that information yourself.

The way the Switch handles `B` is a bit different if there is an iFrame present on the page. In this case `B` will actually navigate the iFrame back first **before** navigating back the actual page (or reloading it). This is crucial for my workaround. With the use of `postMessage` I always immediately return to a "navigated" state of the iFrame.

---
## Misc issues / features
Some other stuff that I build / had to deal with.

* `Page size too large, refresh the page`
This popped up every now and then and then made the window lag out continously even when `Cancel` is pressed. I changed from `png` to uncompressed `webp` images and added logic that disconnects the WebSocket if there's no input for more than 10 seconds. The WebSocket automatically reconnects if there's new input.

* `Turbo mode`
When enabled turbo mode makes the emulator tick at x9 of the normal speed (540 vs 60 fps). The output rate of frames remains 60 so the switch doesn't choke up.

* `Audio` Sadly the switch doesn't seem to have an exposed audio API for the web browser. I'm still looking for a solution since various feature checkers actually report a prefixed `AudioContext` to be present but I didn't have luck with that yet.

---
## Usage
I'm not distributing any roms, so you will have to make a folder `roms` with your `.gba` files directly in it.

To run the server just execute:
````
docker run --name switch-gba -d -p 80:8888 -v $(pwd)/roms:/home/roms -d bfriedrichs/switch-gba
````
Then just connect to it from the switch browser.
