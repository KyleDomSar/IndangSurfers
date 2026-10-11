# IndangSurfers

A Subway Surfers-inspired 3D endless runner with an Indang, Cavite twist.

## Features

- Three-lane movement
- Jump over road barriers and slide under overhead obstacles
- Dodge colorful low-poly jeepneys and Philippine-style tricycles that approach and weave in their lanes
- Collect coins and build your score
- Coin Magnet attracts nearby coins for 10 seconds
- Shield absorbs one obstacle hit within 12 seconds
- 2× Score doubles distance and coin points for 10 seconds
- Floating power-up pickups with active-effect timers
- Increasing running speed
- Low-poly runner character with cap, backpack, and animated limb pivots
- Indang, Cavite welcome signage, roadside lamps, houses, and trees
- Procedural 3D traffic inspired by local jeepneys and tricycles, with headlights, windows, wheels, and painted details
- Keyboard, swipe, and on-screen controls
- Main menu, pause, resume, and restart controls
- Synthesized sound effects for coins, jumping, sliding, collisions, and countdown
- Toggleable sound setting saved in the browser
- Test Sound button to verify browser audio output
- Power-up pickup and shield-break sound effects
- 3-2-1-GO start countdown
- High score saved in the browser using local storage
- Restart after a run ends

## Controls

| Action | Keyboard |
| --- | --- |
| Move left | A or Left Arrow |
| Move right | D or Right Arrow |
| Jump | Space, W, or Up Arrow |
| Slide | S or Down Arrow |
| Pause / resume | Escape |
| Toggle sound | Use the Sound button in the menu or pause screen |
| Test audio | Use the Test Sound button, which also enables sound if muted |
| Start from the main menu | Enter |
| Restart after crashing | Enter |

On touch devices, use the on-screen buttons or swipe left/right/up/down.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

To create a production build:

```bash
npm run build
npm run preview
```

## Tech stack

- JavaScript
- Three.js
- Vite

## Project status

Early playable prototype. The player, obstacles, coins, and environment currently use procedural low-poly geometry.

IndangSurfers is an independent fan-inspired project. It is not affiliated with or endorsed by the creators of Subway Surfers.
