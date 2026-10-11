# IndangSurfers

A Subway Surfers-inspired 3D endless runner with an Indang, Cavite twist.

## Features

- Three-lane movement
- Jump over road barriers and slide under overhead obstacles
- Collect coins and build your score
- Increasing running speed
- Low-poly runner character with cap, backpack, and animated limb pivots
- Indang, Cavite welcome signage, roadside lamps, houses, and trees
- Keyboard, swipe, and on-screen controls
- Main menu, pause, resume, and restart controls
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
