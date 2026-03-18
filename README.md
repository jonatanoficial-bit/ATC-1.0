# ATC Simulator (Stage 1)

This project is a prototype of a realistic Air Traffic Control (ATC) simulator built with **HTML**, **CSS**, and **JavaScript**.  It implements the first stage of development for a browser‑based game where the player acts as an air traffic controller.  The design and features were inspired by professional ATC simulators and guidelines for radar displays【807708321175031†L41-L69】 and voice recognition procedures【802175147168733†L272-L317】.

## Features

* **Radar Display** — A dark, radar‑style canvas with concentric range rings and cross‑hairs.  Random aircraft spawn from the edges and fly across the screen.
* **Aircraft Types** — Heavy (H), medium (M) and light (L) aircraft appear with different sizes and colours, labelled with callsigns and current altitude/speed【807708321175031†L41-L55】.
* **Command System** — Enter commands via text or voice:
  - `TL` / `TR` – turn left/right to a new heading and optional speed.
  - `CL` / `DS` – climb or descend to a target altitude.
  - `SPD` – change the aircraft’s speed.
* **Voice Interaction** — Uses the Web Speech API to accept spoken commands and synthesise pilot/controller responses.  English phraseology and push‑to‑talk behaviour follow ATC voice‑recognition guidelines【802175147168733†L272-L317】.
* **Transmission Log with Typewriter Effect** — Communications appear one character at a time to mimic radio transmissions.  Messages are spoken aloud using speech synthesis.
* **Scoring and Levels** — Earn points for safe landings and proper command usage; lose points for collisions or aircraft leaving the sector.  Levels advance based on total score.
* **Extensible Structure** — The code is modular and commented to allow future enhancements such as realistic physics, more complex commands, weather effects, and career progression.

## Running Locally

1. Open `index.html` in a modern desktop browser (preferably Chrome or Edge).  Voice recognition requires a browser with support for the Web Speech API.
2. Watch aircraft enter the sector on the radar.  Click in the command input and type commands such as `H332 TL 180 250` or `M101 CL 12000`.  Press **Send** or hit **Enter** to issue the command.
3. Click the microphone button to issue a voice command.  Speak clearly following the command format; the system will fill the command input automatically.

## Future Work

This is just the first step towards a professional ATC simulation.  Future iterations could include:

* Realistic flight dynamics and separation minima.
* Multiple sectors, runways and taxiways.
* Weather and restricted airspace.
* Career mode with pilot/controller voices in multiple languages.
* User settings and persistent progress storage.

Contributions and suggestions are welcome!  Feel free to fork this project on GitHub and expand its capabilities.