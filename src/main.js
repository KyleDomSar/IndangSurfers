
import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="game-shell is-menu">
    <header class="game-hud">
      <div class="brand">
        <span>INDANG</span>
        <strong>SURFERS</strong>
      </div>

      <div class="stats">
        <div class="stat">
          <small>SCORE</small>
          <strong id="score">00000</strong>
        </div>
        <div class="stat">
          <small>COINS</small>
          <strong id="coinCount">0</strong>
        </div>
      </div>
      <button id="pauseButton" class="pause-button" type="button" aria-label="Pause game" title="Pause (Esc)">Ⅱ</button>
    </header>

    <div class="hint">
      <strong>DODGE. JUMP. COLLECT.</strong>
      <span>Move: A/D or Arrow Keys</span>
      <span>Jump: Space or W | Slide: S</span>
    </div>

    <div class="location-chip">INDANG, CAVITE</div>

    <div class="screen-overlay" id="mainMenu">
      <div class="menu-card">
        <p class="eyebrow">WELCOME TO</p>
        <h1 class="menu-title"><span>INDANG</span><strong>SURFERS</strong></h1>
        <p class="menu-intro">Run the roads of Indang, Cavite.</p>
        <div class="best-score-panel">
          <span>BEST SCORE</span>
          <strong id="menuBestScore">0</strong>
        </div>
        <button id="startButton" class="primary-button" type="button">START RUN</button>
        <div class="menu-instructions">
          <span><b>MOVE</b> A/D or ← →</span>
          <span><b>JUMP</b> Space or ↑</span>
          <span><b>SLIDE</b> S or ↓</span>
          <small>Press Esc to pause during a run.</small>
        </div>
      </div>
    </div>

    <div class="screen-overlay hidden" id="pauseMenu">
      <div class="menu-card compact-card">
        <p class="eyebrow">TAKE A BREATHER</p>
        <h1 class="overlay-title">PAUSED</h1>
        <p class="menu-intro">Your run is waiting.</p>
        <button id="resumeButton" class="primary-button" type="button">RESUME</button>
        <button id="restartFromPauseButton" class="secondary-button" type="button">RESTART RUN</button>
        <button id="mainMenuFromPauseButton" class="text-button" type="button">MAIN MENU</button>
      </div>
    </div>

    <div class="game-over hidden" id="gameOver">
      <div class="game-over-card">
        <p class="eyebrow">RUN ENDED</p>
        <h1>CRASHED!</h1>
        <p id="finalMessage">Ready for another run?</p>
        <div class="best-score-panel game-over-best">
          <span>BEST SCORE</span>
          <strong id="gameOverBestScore">0</strong>
        </div>
        <button id="restartButton" type="button">RUN AGAIN</button>
        <button id="mainMenuAfterOverButton" class="secondary-button" type="button">MAIN MENU</button>
      </div>
    </div>

    <div class="mobile-controls">
      <button class="control-button" data-action="left"
        type="button" aria-label="Move left">←</button>
      <button class="control-button" data-action="right"
        type="button" aria-label="Move right">→</button>
      <button class="control-button action-button" data-action="jump"
        type="button">JUMP</button>
      <button class="control-button action-button" data-action="slide"
        type="button">SLIDE</button>
    </div>
  </div>
`;

const shell = app.querySelector('.game-shell');
const scoreEl = document.querySelector('#score');
const coinCountEl = document.querySelector('#coinCount');
const gameOverEl = document.querySelector('#gameOver');
const finalMessageEl = document.querySelector('#finalMessage');
const restartButton = document.querySelector('#restartButton');
const mainMenuEl = document.querySelector('#mainMenu');
const pauseMenuEl = document.querySelector('#pauseMenu');
const startButton = document.querySelector('#startButton');
const pauseButton = document.querySelector('#pauseButton');
const resumeButton = document.querySelector('#resumeButton');
const restartFromPauseButton = document.querySelector('#restartFromPauseButton');
const mainMenuFromPauseButton = document.querySelector('#mainMenuFromPauseButton');
const mainMenuAfterOverButton = document.querySelector('#mainMenuAfterOverButton');
const menuBestScoreEl = document.querySelector('#menuBestScore');
const gameOverBestScoreEl = document.querySelector('#gameOverBestScore');

const HIGH_SCORE_KEY = 'indangSurfersHighScore';

function loadBestScore() {
  try {
    const savedScore = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    return Number.isFinite(savedScore) && savedScore > 0 ? savedScore : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // High score still works for the current session if storage is unavailable.
  }
}

function updateBestScoreUI() {
  menuBestScoreEl.textContent = String(bestScore);
  gameOverBestScoreEl.textContent = String(bestScore);
}

// --------------------------------------------------
// SCENE, CAMERA, AND RENDERER
// --------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bdcf2);
scene.fog = new THREE.Fog(0x9bdcf2, 65, 145);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  180
);

camera.position.set(0, 7, 14);
camera.lookAt(0, 1, -7);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'low-power',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
shell.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x45613d, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(-5, 12, 8);
scene.add(sunlight);

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x6da85b }),
  road: new THREE.MeshStandardMaterial({
    color: 0x353b45,
    roughness: 0.95,
  }),
  roadEdge: new THREE.MeshStandardMaterial({ color: 0xe8e7db }),
  lane: new THREE.MeshStandardMaterial({ color: 0xffd65c }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x795238 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x367d4d }),
  house: new THREE.MeshStandardMaterial({ color: 0xf0ca93 }),
  roof: new THREE.MeshStandardMaterial({ color: 0xa94f3e }),
  window: new THREE.MeshStandardMaterial({ color: 0x75c8e8 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xff783b }),
  white: new THREE.MeshStandardMaterial({ color: 0xfff1d5 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xc98d67 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x167c80 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x293d68 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x24252d }),
  shoes: new THREE.MeshStandardMaterial({ color: 0xf3eee1 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0xe66b35, roughness: 0.8 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xffd65c, roughness: 0.7 }),
  cap: new THREE.MeshStandardMaterial({ color: 0xd84e3f, roughness: 0.75 }),
  eyes: new THREE.MeshStandardMaterial({ color: 0x202a30, roughness: 0.6 }),
  lampPole: new THREE.MeshStandardMaterial({ color: 0x59656a, metalness: 0.25 }),
  signFrame: new THREE.MeshStandardMaterial({ color: 0xe7c36a, roughness: 0.8 }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe2a1 }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xffc928,
    metalness: 0.55,
    roughness: 0.28,
  }),
};

function addMesh(geometry, material, parent, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// Grass ground
const ground = addMesh(
  new THREE.PlaneGeometry(220, 220),
  materials.grass,
  scene,
  0,
  -0.25,
  -45
);
ground.rotation.x = -Math.PI / 2;

// Endless road
const road = addMesh(
  new THREE.PlaneGeometry(8.4, 180),
  materials.road,
  scene,
  0,
  -0.13,
  -40
);
road.rotation.x = -Math.PI / 2;

// Road edges
for (const side of [-1, 1]) {
  addMesh(
    new THREE.BoxGeometry(0.15, 0.07, 180),
    materials.roadEdge,
    scene,
    side * 4.18,
    -0.06,
    -40
  );
}

// Dashed lane markings
const laneMarkers = [];
const markerSpacing = 7.5;
const markerCount = 18;

for (let i = 0; i < markerCount; i++) {
  const marker = new THREE.Group();

  for (const x of [-1.12, 1.12]) {
    addMesh(
      new THREE.BoxGeometry(0.065, 0.025, 2.3),
      materials.lane,
      marker,
      x,
      0,
      0
    );
  }

  marker.position.set(0, -0.045, 10 - i * markerSpacing);
  scene.add(marker);
  laneMarkers.push(marker);
}

// Sun
addMesh(
  new THREE.SphereGeometry(4, 12, 10),
  new THREE.MeshBasicMaterial({ color: 0xffe5a1 }),
  scene,
  19,
  19,
  -85
);

// Low-poly roadside trees and houses
const scenery = [];
const treeTrunkGeometry = new THREE.CylinderGeometry(0.16, 0.22, 1.5, 6);
const treeCrownGeometry = new THREE.ConeGeometry(1.05, 2.2, 7);
const houseBodyGeometry = new THREE.BoxGeometry(1.8, 1.55, 1.6);
const houseRoofGeometry = new THREE.ConeGeometry(1.35, 0.9, 4);
const windowGeometry = new THREE.BoxGeometry(0.32, 0.4, 0.045);

const signTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  context.fillStyle = '#155b45';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#f5d66f';
  context.lineWidth = 12;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  context.textAlign = 'center';
  context.fillStyle = '#f5d66f';
  context.font = 'bold 30px Arial, sans-serif';
  context.fillText('WELCOME TO', 256, 82);

  context.fillStyle = '#ffffff';
  context.font = 'bold 68px Arial, sans-serif';
  context.fillText('INDANG', 256, 158);

  context.fillStyle = '#d5eadf';
  context.font = 'bold 27px Arial, sans-serif';
  context.fillText('CAVITE', 256, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  return texture;
})();

const signFaceMaterial = new THREE.MeshStandardMaterial({
  map: signTexture,
  roughness: 0.85,
});

function createScenery(side, z) {
  const group = new THREE.Group();
  const roll = Math.random();
  const isHouse = roll < 0.25;
  const isSign = roll >= 0.25 && roll < 0.35;
  const isLamp = roll >= 0.35 && roll < 0.46;

  if (isSign) {
    for (const x of [-0.82, 0.82]) {
      addMesh(
        new THREE.BoxGeometry(0.12, 2.05, 0.14),
        materials.trunk,
        group,
        x,
        1.05,
        0
      );
    }

    addMesh(
      new THREE.BoxGeometry(2.25, 1.12, 0.16),
      materials.signFrame,
      group,
      0,
      2.3,
      0
    );

    addMesh(
      new THREE.PlaneGeometry(2.08, 0.91),
      signFaceMaterial,
      group,
      0,
      2.3,
      0.086
    );
  } else if (isLamp) {
    addMesh(
      new THREE.CylinderGeometry(0.07, 0.11, 3.5, 6),
      materials.lampPole,
      group,
      0,
      1.75,
      0
    );

    addMesh(
      new THREE.BoxGeometry(0.62, 0.09, 0.11),
      materials.lampPole,
      group,
      0.25,
      3.38,
      0
    );

    addMesh(
      new THREE.BoxGeometry(0.22, 0.11, 0.28),
      materials.lampGlow,
      group,
      0.48,
      3.31,
      0
    );
  } else if (isHouse) {
    addMesh(
      houseBodyGeometry,
      materials.house,
      group,
      0,
      0.82,
      0
    );

    const roof = addMesh(
      houseRoofGeometry,
      materials.roof,
      group,
      0,
      2.0,
      0
    );
    roof.rotation.y = Math.PI / 4;

    addMesh(
      windowGeometry,
      materials.window,
      group,
      -0.48,
      0.95,
      0.82
    );

    addMesh(
      windowGeometry,
      materials.window,
      group,
      0.48,
      0.95,
      0.82
    );
  } else {
    addMesh(
      treeTrunkGeometry,
      materials.trunk,
      group,
      0,
      0.75,
      0
    );

    addMesh(
      treeCrownGeometry,
      materials.leaves,
      group,
      0,
      2.0,
      0
    );

    const upperCrown = addMesh(
      treeCrownGeometry,
      materials.leaves,
      group,
      0,
      2.7,
      0
    );
    upperCrown.scale.setScalar(0.7);
  }

  group.position.set(
    side * (6.0 + Math.random() * 1.4),
    0,
    z
  );

  scene.add(group);
  scenery.push(group);
}

for (const side of [-1, 1]) {
  for (let i = 0; i < 11; i++) {
    createScenery(side, 8 - i * 12);
  }
}

// --------------------------------------------------
// PLAYER
// --------------------------------------------------

const playerGroup = new THREE.Group();
scene.add(playerGroup);

const runnerBody = new THREE.Group();
playerGroup.add(runnerBody);

// Backpack sits behind the runner.
addMesh(
  new THREE.BoxGeometry(0.52, 0.62, 0.25),
  materials.backpack,
  runnerBody,
  0,
  1.3,
  -0.32
);

addMesh(
  new THREE.BoxGeometry(0.32, 0.08, 0.04),
  materials.accent,
  runnerBody,
  0,
  1.48,
  -0.455
);

addMesh(
  new THREE.CylinderGeometry(0.34, 0.42, 0.95, 8),
  materials.shirt,
  runnerBody,
  0,
  1.2,
  0
);

// Shirt details and a small chest badge.
addMesh(
  new THREE.BoxGeometry(0.48, 0.09, 0.045),
  materials.accent,
  runnerBody,
  0,
  1.42,
  0.355
);

addMesh(
  new THREE.BoxGeometry(0.17, 0.2, 0.045),
  materials.white,
  runnerBody,
  0.12,
  1.2,
  0.365
);

addMesh(
  new THREE.BoxGeometry(0.08, 0.12, 0.06),
  materials.orange,
  runnerBody,
  0.12,
  1.2,
  0.398
);

// Head, hair, eyes, and cap.
addMesh(
  new THREE.SphereGeometry(0.29, 10, 8),
  materials.skin,
  runnerBody,
  0,
  1.91,
  0
);

addMesh(
  new THREE.SphereGeometry(0.3, 8, 6),
  materials.hair,
  runnerBody,
  0,
  2.04,
  -0.035
);

addMesh(
  new THREE.SphereGeometry(0.29, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  materials.cap,
  runnerBody,
  0,
  2.07,
  0
);

addMesh(
  new THREE.BoxGeometry(0.43, 0.055, 0.29),
  materials.cap,
  runnerBody,
  0,
  2.075,
  0.16
);

for (const eyeX of [-0.095, 0.095]) {
  addMesh(
    new THREE.SphereGeometry(0.035, 6, 5),
    materials.eyes,
    runnerBody,
    eyeX,
    1.94,
    0.264
  );
}

const armGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.65, 6);
const legGeometry = new THREE.CylinderGeometry(0.15, 0.17, 0.62, 6);
const shoeGeometry = new THREE.BoxGeometry(0.34, 0.18, 0.48);
const shoeSoleGeometry = new THREE.BoxGeometry(0.35, 0.055, 0.49);

// Pivot arms at the shoulders so they swing like actual limbs.
const leftArm = new THREE.Group();
leftArm.position.set(-0.47, 1.48, 0);
runnerBody.add(leftArm);
addMesh(armGeometry, materials.skin, leftArm, 0, -0.22, 0);

const rightArm = new THREE.Group();
rightArm.position.set(0.47, 1.48, 0);
runnerBody.add(rightArm);
addMesh(armGeometry, materials.skin, rightArm, 0, -0.22, 0);

// Pivot legs at the hips, with shoes attached to each leg.
const leftLeg = new THREE.Group();
leftLeg.position.set(-0.2, 0.72, 0);
runnerBody.add(leftLeg);
addMesh(legGeometry, materials.pants, leftLeg, 0, -0.28, 0);
addMesh(shoeGeometry, materials.shoes, leftLeg, 0, -0.58, 0.08);
addMesh(shoeSoleGeometry, materials.accent, leftLeg, 0, -0.66, 0.08);

const rightLeg = new THREE.Group();
rightLeg.position.set(0.2, 0.72, 0);
runnerBody.add(rightLeg);
addMesh(legGeometry, materials.pants, rightLeg, 0, -0.28, 0);
addMesh(shoeGeometry, materials.shoes, rightLeg, 0, -0.58, 0.08);
addMesh(shoeSoleGeometry, materials.accent, rightLeg, 0, -0.66, 0.08);

const laneCenters = [-2.24, 0, 2.24];
const playerZ = 3.2;

playerGroup.position.set(0, 0, playerZ);

let targetLane = 1;
let jumpHeight = 0;
let jumpVelocity = 0;
let slideTime = 0;
let runTime = 0;

// --------------------------------------------------
// OBSTACLES
// --------------------------------------------------

const obstacles = [];

const obstacleMaterials = {
  body: new THREE.MeshStandardMaterial({ color: 0xf06a37 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xffe9c9 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x4a4141 }),
};

const barrierGeometry = new THREE.BoxGeometry(1.5, 1.2, 0.8);
const stripeGeometry = new THREE.BoxGeometry(1.2, 0.16, 0.035);
const postGeometry = new THREE.BoxGeometry(0.14, 1.72, 0.3);
const overheadGeometry = new THREE.BoxGeometry(1.75, 0.35, 0.45);
const overheadStripeGeometry = new THREE.BoxGeometry(1.48, 0.08, 0.035);

function createObstacle(lane, kind) {
  const group = new THREE.Group();

  if (kind === 'barrier') {
    addMesh(
      barrierGeometry,
      obstacleMaterials.body,
      group,
      0,
      0.6,
      0
    );

    addMesh(
      stripeGeometry,
      obstacleMaterials.stripe,
      group,
      0,
      0.7,
      0.42
    );
  } else {
    for (const x of [-0.72, 0.72]) {
      addMesh(
        postGeometry,
        obstacleMaterials.dark,
        group,
        x,
        0.86,
        0
      );
    }

    addMesh(
      overheadGeometry,
      obstacleMaterials.body,
      group,
      0,
      1.78,
      0
    );

    addMesh(
      overheadStripeGeometry,
      obstacleMaterials.stripe,
      group,
      0,
      1.8,
      0.24
    );
  }

  group.position.set(laneCenters[lane], 0, -72);
  group.userData.lane = lane;
  group.userData.kind = kind;

  scene.add(group);
  obstacles.push(group);
}

let obstacleTimer = 0.7;
let obstacleDelay = 1.4;
let lastObstacleLane = -1;

function spawnObstacle() {
  let lane = Math.floor(Math.random() * 3);

  // Avoid repeating the previous lane when possible.
  if (lane === lastObstacleLane) {
    lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
  }

  lastObstacleLane = lane;

  const kind = Math.random() < 0.28 ? 'overhead' : 'barrier';
  createObstacle(lane, kind);
  obstacleDelay = 1.4 + Math.random() * 0.35;
}

// --------------------------------------------------
// COINS
// --------------------------------------------------

const coins = [];

const coinGeometry = new THREE.TorusGeometry(0.32, 0.1, 8, 16);

function spawnCoinChain() {
  const lane = Math.floor(Math.random() * 3);

  for (let i = 0; i < 7; i++) {
    const coin = new THREE.Mesh(coinGeometry, materials.gold);

    coin.position.set(
      laneCenters[lane],
      1.25,
      -68 - i * 2.5
    );

    scene.add(coin);
    coins.push({ mesh: coin, lane });
  }
}

let coinTimer = 1.0;
let coinDelay = 2.5;
let coinCount = 0;

// --------------------------------------------------
// GAME STATE AND CONTROLS
// --------------------------------------------------

let gameOver = false;
let hasStarted = false;
let isPaused = false;
let score = 0;
let elapsedTime = 0;
let speed = 16;
let bestScore = loadBestScore();

updateBestScoreUI();

function moveLane(direction) {
  if (!hasStarted || gameOver || isPaused) return;

  targetLane = THREE.MathUtils.clamp(
    targetLane + direction,
    0,
    2
  );
}

function jump() {
  if (!hasStarted || gameOver || isPaused || slideTime > 0 || jumpHeight > 0) return;

  jumpVelocity = 9.8;
}

function slide() {
  if (!hasStarted || gameOver || isPaused || jumpHeight > 0.1) return;

  slideTime = 0.72;
}

function handleAction(action) {
  if (action === 'left') moveLane(-1);
  if (action === 'right') moveLane(1);
  if (action === 'jump') jump();
  if (action === 'slide') slide();
}

// Keyboard controls
window.addEventListener('keydown', (event) => {
  const controls = [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Escape', 'Enter',
  ];

  if (controls.includes(event.code)) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (event.code === 'Escape') {
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
    return;
  }

  if (gameOver) {
    if (event.code === 'Enter') startRun();
    return;
  }

  if (!hasStarted) {
    if (event.code === 'Enter') startRun();
    return;
  }

  if (isPaused) return;

  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    moveLane(-1);
  } else if (
    event.code === 'ArrowRight' ||
    event.code === 'KeyD'
  ) {
    moveLane(1);
  } else if (
    event.code === 'Space' ||
    event.code === 'ArrowUp' ||
    event.code === 'KeyW'
  ) {
    jump();
  } else if (
    event.code === 'ArrowDown' ||
    event.code === 'KeyS'
  ) {
    slide();
  }
});

// On-screen buttons for phones and tablets
shell.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handleAction(button.dataset.action);
  });
});

// Swipe controls
let swipeStart = null;

renderer.domElement.addEventListener('pointerdown', (event) => {
  swipeStart = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!swipeStart || !hasStarted || gameOver || isPaused) return;

  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;

  if (Math.max(Math.abs(dx), Math.abs(dy)) > 35) {
    if (Math.abs(dx) > Math.abs(dy)) {
      moveLane(dx < 0 ? -1 : 1);
    } else if (dy < 0) {
      jump();
    } else {
      slide();
    }
  }

  swipeStart = null;
});

// --------------------------------------------------
// COLLISIONS AND RESTART
// --------------------------------------------------

function recordBestScore() {
  const currentScore = Math.floor(score);

  if (currentScore > bestScore) {
    bestScore = currentScore;
    saveBestScore(bestScore);
  }

  updateBestScoreUI();
}

function finishRun() {
  if (gameOver) return;

  gameOver = true;
  isPaused = false;
  recordBestScore();

  finalMessageEl.textContent =
    `Score: ${Math.floor(score)} | Coins: ${coinCount}`;

  pauseMenuEl.classList.add('hidden');
  gameOverEl.classList.remove('hidden');
}

function startRun() {
  if (hasStarted && !gameOver) recordBestScore();
  resetGame();
  hasStarted = true;
  isPaused = false;
  shell.classList.remove('is-menu');
  shell.classList.add('is-playing');
  mainMenuEl.classList.add('hidden');
  pauseMenuEl.classList.add('hidden');
  gameOverEl.classList.add('hidden');
}

function pauseGame() {
  if (!hasStarted || gameOver || isPaused) return;
  isPaused = true;
  pauseMenuEl.classList.remove('hidden');
}

function resumeGame() {
  if (!hasStarted || gameOver || !isPaused) return;
  isPaused = false;
  pauseMenuEl.classList.add('hidden');
}

function returnToMainMenu() {
  if (hasStarted && !gameOver) recordBestScore();
  resetGame();
  hasStarted = false;
  isPaused = false;
  shell.classList.remove('is-playing');
  shell.classList.add('is-menu');
  mainMenuEl.classList.remove('hidden');
}

function resetGame() {
  for (const obstacle of obstacles) scene.remove(obstacle);
  for (const coin of coins) scene.remove(coin.mesh);

  obstacles.length = 0;
  coins.length = 0;

  targetLane = 1;
  playerGroup.position.set(0, 0, playerZ);
  playerGroup.scale.y = 1;

  jumpHeight = 0;
  jumpVelocity = 0;
  slideTime = 0;
  runTime = 0;

  score = 0;
  coinCount = 0;
  elapsedTime = 0;
  speed = 16;

  obstacleTimer = 0.7;
  obstacleDelay = 1.4;
  lastObstacleLane = -1;

  coinTimer = 1;
  coinDelay = 2.5;

  gameOver = false;
  hasStarted = false;
  isPaused = false;
  scoreEl.textContent = '00000';
  coinCountEl.textContent = '0';
  gameOverEl.classList.add('hidden');
  pauseMenuEl.classList.add('hidden');
}

startButton.addEventListener('click', startRun);
restartButton.addEventListener('click', startRun);
resumeButton.addEventListener('click', resumeGame);
restartFromPauseButton.addEventListener('click', startRun);
mainMenuFromPauseButton.addEventListener('click', returnToMainMenu);
mainMenuAfterOverButton.addEventListener('click', returnToMainMenu);
pauseButton.addEventListener('click', () => {
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
});

// --------------------------------------------------
// UPDATE LOOP
// --------------------------------------------------

const clock = new THREE.Clock();

function updateGame(delta) {
  elapsedTime += delta;
  runTime += delta;

  // The game gradually gets faster.
  speed = Math.min(25, 16 + elapsedTime * 0.12);
  score += speed * delta * 2;

  scoreEl.textContent = Math.floor(score)
    .toString()
    .padStart(5, '0');

  coinCountEl.textContent = String(coinCount);

  // Move the player smoothly between lanes.
  const targetX = laneCenters[targetLane];

  playerGroup.position.x = THREE.MathUtils.damp(
    playerGroup.position.x,
    targetX,
    14,
    delta
  );

  // Jump physics.
  if (jumpHeight > 0 || jumpVelocity > 0) {
    jumpHeight += jumpVelocity * delta;
    jumpVelocity -= 26 * delta;

    if (jumpHeight <= 0) {
      jumpHeight = 0;
      jumpVelocity = 0;
    }
  }

  playerGroup.position.y = jumpHeight;

  // Slide animation and running animation.
  slideTime = Math.max(0, slideTime - delta);
  playerGroup.scale.y = slideTime > 0 ? 0.48 : 1;

  const isRunning = jumpHeight < 0.05 && slideTime <= 0;
  const swing = isRunning ? Math.sin(runTime * 13) * 0.6 : 0;

  leftArm.rotation.x = swing;
  rightArm.rotation.x = -swing;
  leftLeg.rotation.x = -swing;
  rightLeg.rotation.x = swing;

  // A small body bounce and lean make the run feel less mechanical.
  runnerBody.position.y = slideTime > 0
    ? 0.04
    : (isRunning ? Math.abs(Math.sin(runTime * 13)) * 0.045 : 0);
  runnerBody.rotation.z = isRunning ? Math.sin(runTime * 6.5) * 0.025 : 0;
  runnerBody.rotation.x = slideTime > 0 ? 0.22 : 0;

  // Move the road markings toward the player.
  for (const marker of laneMarkers) {
    marker.position.z += speed * delta;

    if (marker.position.z > 12) {
      marker.position.z -= markerCount * markerSpacing;
    }
  }

  // Move roadside scenery and recycle it.
  for (const prop of scenery) {
    prop.position.z += speed * delta;

    if (prop.position.z > 18) {
      prop.position.z = -125 - Math.random() * 20;
      prop.position.x =
        Math.sign(prop.position.x) * (6.0 + Math.random() * 1.4);
    }
  }

  // Spawn obstacles.
  obstacleTimer += delta;

  if (obstacleTimer >= obstacleDelay) {
    obstacleTimer = 0;
    spawnObstacle();
  }

  // Spawn coin chains.
  coinTimer += delta;

  if (coinTimer >= coinDelay) {
    coinTimer = 0;
    coinDelay = 2.5 + Math.random() * 0.6;
    spawnCoinChain();
  }

  // Move obstacles and check collisions.
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.position.z += speed * delta;

    const sameLane =
      Math.abs(playerGroup.position.x -
        laneCenters[obstacle.userData.lane]) < 0.85;

    const closeEnough =
      Math.abs(obstacle.position.z - playerZ) < 1.05;

    if (sameLane && closeEnough) {
      if (obstacle.userData.kind === 'barrier') {
        if (jumpHeight < 1.22) {
          finishRun();
          return;
        }
      } else if (slideTime <= 0) {
        finishRun();
        return;
      }
    }

    if (obstacle.position.z > playerZ + 5) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
    }
  }

  // Move and collect coins.
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.mesh.position.z += speed * delta;
    coin.mesh.rotation.y += delta * 3.5;

    const sameLane =
      Math.abs(playerGroup.position.x -
        laneCenters[coin.lane]) < 0.85;

    const closeEnough =
      Math.abs(coin.mesh.position.z - playerZ) < 1.3;

    if (sameLane && closeEnough) {
      coinCount++;
      score += 100;

      scene.remove(coin.mesh);
      coins.splice(i, 1);
      continue;
    }

    if (coin.mesh.position.z > playerZ + 5) {
      scene.remove(coin.mesh);
      coins.splice(i, 1);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (hasStarted && !gameOver && !isPaused) {
    updateGame(delta);
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
});

animate();
