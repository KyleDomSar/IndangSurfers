
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

    <div class="powerup-status" id="powerupStatus" aria-live="polite"></div>

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
        <button id="menuSoundButton" class="secondary-button sound-toggle-button" type="button" aria-pressed="true">SOUND: ON</button>
        <button id="menuTestSoundButton" class="secondary-button sound-test-button" type="button">TEST SOUND</button>
        <div class="menu-instructions">
          <span><b>MOVE</b> A/D or ← →</span>
          <span><b>JUMP</b> Space or ↑</span>
          <span><b>SLIDE</b> S or ↓</span>
          <small>Power-ups: Coin Magnet, Shield, and 2× Score.</small>
          <small>Press Esc to pause during a run.</small>
        </div>
      </div>
    </div>

    <div class="countdown-overlay hidden" id="countdownOverlay" aria-live="assertive">
      <strong id="countdownText">3</strong>
    </div>

    <div class="screen-overlay hidden" id="pauseMenu">
      <div class="menu-card compact-card">
        <p class="eyebrow">TAKE A BREATHER</p>
        <h1 class="overlay-title">PAUSED</h1>
        <p class="menu-intro">Your run is waiting.</p>
        <button id="resumeButton" class="primary-button" type="button">RESUME</button>
        <button id="pauseSoundButton" class="secondary-button sound-toggle-button" type="button" aria-pressed="true">SOUND: ON</button>
        <button id="pauseTestSoundButton" class="secondary-button sound-test-button" type="button">TEST SOUND</button>
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
const menuSoundButton = document.querySelector('#menuSoundButton');
const pauseSoundButton = document.querySelector('#pauseSoundButton');
const menuTestSoundButton = document.querySelector('#menuTestSoundButton');
const pauseTestSoundButton = document.querySelector('#pauseTestSoundButton');
const countdownOverlay = document.querySelector('#countdownOverlay');
const countdownText = document.querySelector('#countdownText');
const powerupStatusEl = document.querySelector('#powerupStatus');

const HIGH_SCORE_KEY = 'indangSurfersHighScore';
const SOUND_SETTING_KEY = 'indangSurfersSoundEnabled';

function loadSoundSetting() {
  try {
    return localStorage.getItem(SOUND_SETTING_KEY) !== 'false';
  } catch {
    return true;
  }
}

function saveSoundSetting(value) {
  try {
    localStorage.setItem(SOUND_SETTING_KEY, String(value));
  } catch {
    // Sound preference still applies until the page is closed.
  }
}

let soundEnabled = loadSoundSetting();
let audioContext = null;
let audioMasterGain = null;
let audioCompressor = null;

function initAudio() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return Promise.resolve(null);

  if (!audioContext) {
    try {
      audioContext = new AudioContextConstructor();

      // A master gain and compressor keep effects clearly audible without harsh peaks.
      audioMasterGain = audioContext.createGain();
      audioMasterGain.gain.value = 0.9;

      audioCompressor = audioContext.createDynamicsCompressor();
      audioCompressor.threshold.value = -16;
      audioCompressor.knee.value = 12;
      audioCompressor.ratio.value = 5;
      audioCompressor.attack.value = 0.004;
      audioCompressor.release.value = 0.16;

      audioMasterGain.connect(audioCompressor);
      audioCompressor.connect(audioContext.destination);
    } catch {
      audioContext = null;
      audioMasterGain = null;
      audioCompressor = null;
      return Promise.resolve(null);
    }
  }

  // Resume from a direct user gesture where possible. Sounds wait until audio is running.
  if (audioContext.state !== 'running') {
    return audioContext.resume()
      .then(() => audioContext)
      .catch(() => audioContext);
  }

  return Promise.resolve(audioContext);
}

function playSound(name) {
  if (!soundEnabled) return;

  const presets = {
    coin: { start: 880, end: 1480, duration: 0.18, type: 'sine', volume: 0.16 },
    jump: { start: 260, end: 620, duration: 0.2, type: 'triangle', volume: 0.13 },
    slide: { start: 420, end: 125, duration: 0.22, type: 'sawtooth', volume: 0.09 },
    crash: { start: 175, end: 38, duration: 0.48, type: 'sawtooth', volume: 0.18 },
    countdown: { start: 720, end: 590, duration: 0.16, type: 'square', volume: 0.10 },
    go: { start: 620, end: 1240, duration: 0.28, type: 'triangle', volume: 0.16 },
    pause: { start: 480, end: 300, duration: 0.14, type: 'sine', volume: 0.10 },
    resume: { start: 350, end: 680, duration: 0.17, type: 'sine', volume: 0.11 },
    powerup: { start: 520, end: 1040, duration: 0.24, type: 'triangle', volume: 0.15 },
    shield: { start: 700, end: 220, duration: 0.32, type: 'sawtooth', volume: 0.14 },
    magnet: { start: 760, end: 1180, duration: 0.22, type: 'sine', volume: 0.13 },
    multiplier: { start: 540, end: 920, duration: 0.27, type: 'square', volume: 0.12 },
    test: { start: 540, end: 1080, duration: 0.34, type: 'triangle', volume: 0.17 },
  };

  const preset = presets[name];
  if (!preset) return;

  initAudio().then((context) => {
    if (!context || !audioMasterGain || !soundEnabled) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const attack = Math.min(0.025, preset.duration * 0.18);
    const releaseStart = Math.max(now + attack + 0.01, now + preset.duration * 0.62);

    oscillator.type = preset.type;
    oscillator.frequency.setValueAtTime(preset.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, preset.end),
      now + preset.duration
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(preset.volume, now + attack);
    gain.gain.setValueAtTime(preset.volume, releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);

    oscillator.connect(gain);
    gain.connect(audioMasterGain);
    oscillator.start(now);
    oscillator.stop(now + preset.duration + 0.025);
  }).catch(() => {
    // Audio is optional. A browser audio restriction should never stop the game.
  });
}

function updateSoundUI() {
  const label = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
  for (const button of [menuSoundButton, pauseSoundButton]) {
    button.textContent = label;
    button.setAttribute('aria-pressed', String(soundEnabled));
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  saveSoundSetting(soundEnabled);
  updateSoundUI();

  if (soundEnabled) {
    initAudio().then((context) => {
      if (context) playSound('test');
    });
  }
}

function testSound() {
  // The explicit click both unlocks audio in browsers and provides a useful sound check.
  if (!soundEnabled) {
    soundEnabled = true;
    saveSoundSetting(soundEnabled);
    updateSoundUI();
  }

  initAudio().then((context) => {
    if (!context) {
      window.alert('This browser does not support Web Audio. Try an updated Chrome or Edge browser.');
      return;
    }

    playSound('test');
  });
}

updateSoundUI();

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
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
  leaves: new THREE.MeshStandardMaterial({ color: 0x367d4d, roughness: 0.92 }),
  leavesLight: new THREE.MeshStandardMaterial({ color: 0x4d9854, roughness: 0.95 }),
  leavesDeep: new THREE.MeshStandardMaterial({ color: 0x245d42, roughness: 0.95 }),
  house: new THREE.MeshStandardMaterial({ color: 0xf0ca93, roughness: 0.88 }),
  houseCoral: new THREE.MeshStandardMaterial({ color: 0xe9a28a, roughness: 0.9 }),
  houseMint: new THREE.MeshStandardMaterial({ color: 0xb9d3a4, roughness: 0.9 }),
  houseLilac: new THREE.MeshStandardMaterial({ color: 0xc6b6d9, roughness: 0.9 }),
  houseBase: new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.9 }),
  roof: new THREE.MeshStandardMaterial({ color: 0xa94f3e, roughness: 0.86 }),
  roofBlue: new THREE.MeshStandardMaterial({ color: 0x4c718b, roughness: 0.86 }),
  roofGreen: new THREE.MeshStandardMaterial({ color: 0x597b51, roughness: 0.86 }),
  door: new THREE.MeshStandardMaterial({ color: 0x704b38, roughness: 0.9 }),
  windowFrame: new THREE.MeshStandardMaterial({ color: 0xf5dfad, roughness: 0.88 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x4a352c, roughness: 0.95 }),
  window: new THREE.MeshStandardMaterial({ color: 0x75c8e8 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xff783b }),
  white: new THREE.MeshStandardMaterial({ color: 0xfff1d5 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xc98d67 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x167c80 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x293d68 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x24252d }),
  shoes: new THREE.MeshStandardMaterial({ color: 0xf3eee1 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0xe66b35, roughness: 0.82 }),
  backpackAccent: new THREE.MeshStandardMaterial({ color: 0x9a3f2c, roughness: 0.88 }),
  shirtAccent: new THREE.MeshStandardMaterial({ color: 0x69c8bf, roughness: 0.82 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xffd65c, roughness: 0.7 }),
  cap: new THREE.MeshStandardMaterial({ color: 0xd84e3f, roughness: 0.75 }),
  eyes: new THREE.MeshStandardMaterial({ color: 0x202a30, roughness: 0.6 }),
  lampPole: new THREE.MeshStandardMaterial({ color: 0x59656a, metalness: 0.25 }),
  signFrame: new THREE.MeshStandardMaterial({ color: 0xe7c36a, roughness: 0.8 }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe2a1 }),
  powerMagnet: new THREE.MeshStandardMaterial({ color: 0xe44b57, metalness: 0.2, roughness: 0.35 }),
  powerShield: new THREE.MeshStandardMaterial({ color: 0x37c7ed, metalness: 0.45, roughness: 0.25 }),
  powerMultiplier: new THREE.MeshStandardMaterial({ color: 0x8654e8, metalness: 0.2, roughness: 0.35 }),
  powerWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
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
const windowFrameGeometry = new THREE.BoxGeometry(0.43, 0.51, 0.055);
const windowCrossbarVerticalGeometry = new THREE.BoxGeometry(0.035, 0.4, 0.025);
const windowCrossbarHorizontalGeometry = new THREE.BoxGeometry(0.32, 0.035, 0.025);
const houseDoorFrameGeometry = new THREE.BoxGeometry(0.48, 0.94, 0.065);
const houseDoorGeometry = new THREE.BoxGeometry(0.36, 0.78, 0.035);
const houseDoorPanelGeometry = new THREE.BoxGeometry(0.23, 0.23, 0.022);
const houseDoorKnobGeometry = new THREE.SphereGeometry(0.035, 8, 6);
const houseBaseGeometry = new THREE.BoxGeometry(1.9, 0.14, 1.68);
const houseEavesGeometry = new THREE.BoxGeometry(1.98, 0.1, 1.74);
const houseStepGeometry = new THREE.BoxGeometry(0.58, 0.14, 0.34);
const treeBroadleafGeometry = new THREE.IcosahedronGeometry(0.78, 0);
const treeBranchGeometry = new THREE.CylinderGeometry(0.075, 0.12, 0.78, 5);

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
    const wallPalette = [materials.house, materials.houseCoral, materials.houseMint, materials.houseLilac];
    const roofPalette = [materials.roof, materials.roofBlue, materials.roofGreen];
    const wallMaterial = wallPalette[Math.floor(Math.random() * wallPalette.length)];
    const roofMaterial = roofPalette[Math.floor(Math.random() * roofPalette.length)];

    addMesh(houseBaseGeometry, materials.houseBase, group, 0, 0.08, 0);
    addMesh(houseBodyGeometry, wallMaterial, group, 0, 0.82, 0);

    const roof = addMesh(houseRoofGeometry, roofMaterial, group, 0, 2.0, 0);
    roof.rotation.y = Math.PI / 4;
    addMesh(houseEavesGeometry, roofMaterial, group, 0, 1.58, 0);

    addMesh(houseDoorFrameGeometry, materials.windowFrame, group, 0, 0.5, 0.81);
    addMesh(houseDoorGeometry, materials.door, group, 0, 0.49, 0.858);
    addMesh(houseDoorPanelGeometry, materials.woodDark, group, 0, 0.61, 0.88);
    addMesh(houseDoorPanelGeometry, materials.woodDark, group, 0, 0.34, 0.88);
    addMesh(houseDoorKnobGeometry, materials.signFrame, group, 0.11, 0.48, 0.89);
    addMesh(houseStepGeometry, materials.houseBase, group, 0, 0.07, 0.99);

    for (const x of [-0.48, 0.48]) {
      addMesh(windowFrameGeometry, materials.windowFrame, group, x, 0.95, 0.805);
      addMesh(windowGeometry, materials.window, group, x, 0.95, 0.842);
      addMesh(windowCrossbarVerticalGeometry, materials.windowFrame, group, x, 0.95, 0.871);
      addMesh(windowCrossbarHorizontalGeometry, materials.windowFrame, group, x, 0.95, 0.871);
    }
  } else {
    addMesh(treeTrunkGeometry, materials.trunk, group, 0, 0.75, 0);

    if (Math.random() < 0.42) {
      const leafPalette = [materials.leaves, materials.leavesLight, materials.leavesDeep];
      for (const [x, y, z, scale] of [
        [-0.42, 1.72, 0.03, 0.86],
        [0.43, 1.94, -0.02, 0.88],
        [-0.06, 2.35, 0, 0.92],
        [0.15, 2.74, -0.03, 0.62],
      ]) {
        const crown = addMesh(
          treeBroadleafGeometry,
          leafPalette[Math.floor(Math.random() * leafPalette.length)],
          group,
          x,
          y,
          z
        );
        crown.scale.set(scale, scale * 0.96, scale);
      }

      for (const side of [-1, 1]) {
        const branch = addMesh(treeBranchGeometry, materials.trunk, group, side * 0.3, 1.18, 0);
        branch.rotation.z = side * 0.72;
      }
    } else {
      const leafPalette = [materials.leaves, materials.leavesLight, materials.leavesDeep];
      const lowerCrown = addMesh(
        treeCrownGeometry,
        leafPalette[Math.floor(Math.random() * leafPalette.length)],
        group,
        0,
        1.83,
        0
      );
      lowerCrown.scale.setScalar(1 + Math.random() * 0.16);

      const upperCrown = addMesh(
        treeCrownGeometry,
        leafPalette[Math.floor(Math.random() * leafPalette.length)],
        group,
        0,
        2.58 + Math.random() * 0.2,
        0
      );
      upperCrown.scale.setScalar(0.66 + Math.random() * 0.12);
    }
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

addMesh(new THREE.BoxGeometry(0.44, 0.18, 0.045), materials.backpackAccent, runnerBody, 0, 1.52, -0.46);
addMesh(new THREE.BoxGeometry(0.31, 0.24, 0.045), materials.backpack, runnerBody, 0, 1.21, -0.46);
addMesh(new THREE.BoxGeometry(0.035, 0.25, 0.025), materials.accent, runnerBody, 0, 1.31, -0.49);
addMesh(new THREE.BoxGeometry(0.07, 0.055, 0.025), materials.woodDark, runnerBody, 0, 1.42, -0.49);
for (const side of [-1, 1]) {
  addMesh(new THREE.BoxGeometry(0.09, 0.23, 0.18), materials.backpackAccent, runnerBody, side * 0.28, 1.22, -0.3);
  addMesh(new THREE.BoxGeometry(0.075, 0.52, 0.035), materials.backpack, runnerBody, side * 0.21, 1.31, -0.235);
  addMesh(new THREE.BoxGeometry(0.15, 0.07, 0.025), materials.shirtAccent, runnerBody, side * 0.23, 1.48, -0.34);
}

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

addMesh(new THREE.BoxGeometry(0.17, 0.045, 0.025), materials.backpackAccent, runnerBody, 0, 2.045, -0.255);
for (const side of [-1, 1]) {
  addMesh(new THREE.SphereGeometry(0.105, 8, 6), materials.hair, runnerBody, side * 0.235, 1.89, -0.035);
}

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
const armSleeveGeometry = new THREE.CylinderGeometry(0.155, 0.145, 0.25, 8);
const wristBandGeometry = new THREE.CylinderGeometry(0.132, 0.132, 0.075, 8);
const legGeometry = new THREE.CylinderGeometry(0.15, 0.17, 0.62, 6);
const shoeGeometry = new THREE.BoxGeometry(0.34, 0.18, 0.48);
const shoeSoleGeometry = new THREE.BoxGeometry(0.35, 0.055, 0.49);

// Pivot arms at the shoulders so they swing like actual limbs.
const leftArm = new THREE.Group();
leftArm.position.set(-0.47, 1.48, 0);
runnerBody.add(leftArm);
addMesh(armGeometry, materials.skin, leftArm, 0, -0.22, 0);
addMesh(armSleeveGeometry, materials.shirt, leftArm, 0, -0.035, 0);
addMesh(wristBandGeometry, materials.accent, leftArm, 0, -0.41, 0);

const rightArm = new THREE.Group();
rightArm.position.set(0.47, 1.48, 0);
runnerBody.add(rightArm);
addMesh(armGeometry, materials.skin, rightArm, 0, -0.22, 0);
addMesh(armSleeveGeometry, materials.shirt, rightArm, 0, -0.035, 0);
addMesh(wristBandGeometry, materials.accent, rightArm, 0, -0.41, 0);

// Pivot legs at the hips, with shoes attached to each leg.
const leftLeg = new THREE.Group();
leftLeg.position.set(-0.2, 0.72, 0);
runnerBody.add(leftLeg);
addMesh(legGeometry, materials.pants, leftLeg, 0, -0.28, 0);
addMesh(shoeGeometry, materials.shoes, leftLeg, 0, -0.58, 0.08);
addMesh(shoeSoleGeometry, materials.accent, leftLeg, 0, -0.66, 0.08);
addMesh(new THREE.BoxGeometry(0.22, 0.12, 0.035), materials.pants, leftLeg, 0, -0.25, -0.15);
addMesh(new THREE.BoxGeometry(0.22, 0.055, 0.03), materials.white, leftLeg, 0, -0.58, -0.17);

const rightLeg = new THREE.Group();
rightLeg.position.set(0.2, 0.72, 0);
runnerBody.add(rightLeg);
addMesh(legGeometry, materials.pants, rightLeg, 0, -0.28, 0);
addMesh(shoeGeometry, materials.shoes, rightLeg, 0, -0.58, 0.08);
addMesh(shoeSoleGeometry, materials.accent, rightLeg, 0, -0.66, 0.08);
addMesh(new THREE.BoxGeometry(0.22, 0.12, 0.035), materials.pants, rightLeg, 0, -0.25, -0.15);
addMesh(new THREE.BoxGeometry(0.22, 0.055, 0.03), materials.white, rightLeg, 0, -0.58, -0.17);

// Face the running direction (negative Z), away from the camera.
runnerBody.rotation.y = Math.PI;

// A lightweight wireframe aura appears while the shield is active.
const shieldAura = addMesh(
  new THREE.IcosahedronGeometry(1.15, 1),
  new THREE.MeshBasicMaterial({
    color: 0x48dcff,
    wireframe: true,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  }),
  playerGroup,
  0,
  1.1,
  0
);
shieldAura.scale.set(0.68, 1.12, 0.72);
shieldAura.visible = false;

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
  dark: new THREE.MeshStandardMaterial({ color: 0x343b43 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x72cbe8,
    metalness: 0.15,
    roughness: 0.28,
  }),
  tire: new THREE.MeshStandardMaterial({ color: 0x20252b, roughness: 0.95 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xb8c6ca, metalness: 0.6, roughness: 0.35 }),
  grille: new THREE.MeshStandardMaterial({ color: 0x303a42, metalness: 0.25, roughness: 0.6 }),
  headlight: new THREE.MeshStandardMaterial({
    color: 0xffe39a,
    emissive: 0x8b6c24,
    emissiveIntensity: 0.35,
  }),
  jeepneyTeal: new THREE.MeshStandardMaterial({ color: 0x1a9da3, roughness: 0.72 }),
  jeepneyYellow: new THREE.MeshStandardMaterial({ color: 0xf1bd38, roughness: 0.72 }),
  jeepneyRed: new THREE.MeshStandardMaterial({ color: 0xd94d3f, roughness: 0.72 }),
  jeepneyGreen: new THREE.MeshStandardMaterial({ color: 0x4a9a59, roughness: 0.72 }),
  tricycleBlue: new THREE.MeshStandardMaterial({ color: 0x2689bd, roughness: 0.7 }),
  tricycleRed: new THREE.MeshStandardMaterial({ color: 0xd74e43, roughness: 0.7 }),
  tricycleAccent: new THREE.MeshStandardMaterial({ color: 0xf4cf56, roughness: 0.65 }),
};

const barrierGeometry = new THREE.BoxGeometry(1.5, 1.2, 0.8);
const stripeGeometry = new THREE.BoxGeometry(1.2, 0.16, 0.035);
const postGeometry = new THREE.BoxGeometry(0.14, 1.72, 0.3);
const overheadGeometry = new THREE.BoxGeometry(1.75, 0.35, 0.45);
const overheadStripeGeometry = new THREE.BoxGeometry(1.48, 0.08, 0.035);

// Shared low-poly vehicle parts keep spawning traffic lightweight.
const vehicleWheelGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 8);
const vehicleRimGeometry = new THREE.CylinderGeometry(0.105, 0.105, 0.175, 8);
const jeepneyBodyGeometry = new THREE.BoxGeometry(1.55, 0.76, 2.0);
const jeepneyRoofGeometry = new THREE.BoxGeometry(1.57, 0.13, 1.93);
const jeepneyFrontGlassGeometry = new THREE.BoxGeometry(1.12, 0.31, 0.045);
const jeepneySideGlassGeometry = new THREE.BoxGeometry(0.04, 0.27, 0.4);
const jeepneySideStripeGeometry = new THREE.BoxGeometry(0.04, 0.12, 1.48);
const jeepneyGrilleGeometry = new THREE.BoxGeometry(0.52, 0.15, 0.045);
const jeepneyLightGeometry = new THREE.BoxGeometry(0.13, 0.13, 0.05);
const jeepneyDestinationGeometry = new THREE.BoxGeometry(0.62, 0.11, 0.045);
const jeepneyRouteLabelGeometry = new THREE.PlaneGeometry(0.54, 0.085);
const jeepneyGrilleSlatGeometry = new THREE.BoxGeometry(0.035, 0.13, 0.035);
const jeepneyBumperGeometry = new THREE.BoxGeometry(1.32, 0.12, 0.13);
const jeepneyPlateGeometry = new THREE.BoxGeometry(0.27, 0.1, 0.035);
const jeepneyMirrorGeometry = new THREE.BoxGeometry(0.13, 0.075, 0.12);
const jeepneySideStepGeometry = new THREE.BoxGeometry(0.08, 0.09, 1.24);
const tricycleBumperGeometry = new THREE.BoxGeometry(0.7, 0.08, 0.08);
const tricycleExhaustGeometry = new THREE.CylinderGeometry(0.045, 0.055, 0.52, 6);
const jeepneyRackRailGeometry = new THREE.BoxGeometry(0.055, 0.075, 1.25);
const jeepneyRackCrossbarGeometry = new THREE.BoxGeometry(1.2, 0.065, 0.06);
const tricycleBikeBodyGeometry = new THREE.BoxGeometry(0.43, 0.43, 1.02);
const tricycleSeatGeometry = new THREE.BoxGeometry(0.3, 0.12, 0.38);
const tricycleHandlebarGeometry = new THREE.BoxGeometry(0.48, 0.055, 0.06);
const tricycleSteeringGeometry = new THREE.BoxGeometry(0.075, 0.24, 0.075);
const tricycleSidecarGeometry = new THREE.BoxGeometry(0.78, 0.55, 1.08);
const tricycleSidecarRoofGeometry = new THREE.BoxGeometry(0.82, 0.1, 1.1);
const tricycleFrontGlassGeometry = new THREE.BoxGeometry(0.57, 0.25, 0.04);
const tricycleSideGlassGeometry = new THREE.BoxGeometry(0.035, 0.22, 0.42);
const tricycleHeadlightGeometry = new THREE.BoxGeometry(0.14, 0.14, 0.06);
const tricycleSideAccentGeometry = new THREE.BoxGeometry(0.045, 0.1, 0.66);

const jeepneyRouteLabelMaterial = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f7d45a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#24465a';
  context.lineWidth = 8;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  context.fillStyle = '#18394d';
  context.font = 'bold 50px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('INDANG', canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
})();

const jeepneyPaints = [
  obstacleMaterials.jeepneyTeal,
  obstacleMaterials.jeepneyYellow,
  obstacleMaterials.jeepneyRed,
  obstacleMaterials.jeepneyGreen,
];

function addVehicleWheel(group, x, y, z) {
  const wheelAssembly = new THREE.Group();
  wheelAssembly.position.set(x, y, z);
  group.add(wheelAssembly);

  const tire = addMesh(vehicleWheelGeometry, obstacleMaterials.tire, wheelAssembly, 0, 0, 0);
  tire.rotation.z = Math.PI / 2;
  const rim = addMesh(vehicleRimGeometry, obstacleMaterials.rim, wheelAssembly, 0, 0, 0);
  rim.rotation.z = Math.PI / 2;

  if (group.userData.wheels) group.userData.wheels.push(wheelAssembly);
}

function createJeepney(group) {
  const paint = jeepneyPaints[Math.floor(Math.random() * jeepneyPaints.length)];

  addMesh(jeepneyBodyGeometry, paint, group, 0, 0.68, 0);
  addMesh(jeepneyRoofGeometry, paint, group, 0, 1.105, 0.015);
  addMesh(jeepneyFrontGlassGeometry, obstacleMaterials.glass, group, 0, 0.96, 1.025);
  addMesh(jeepneyDestinationGeometry, obstacleMaterials.grille, group, 0, 1.205, 1.035);
  addMesh(jeepneyRouteLabelGeometry, jeepneyRouteLabelMaterial, group, 0, 1.205, 1.061);
  addMesh(jeepneyGrilleGeometry, obstacleMaterials.grille, group, 0, 0.49, 1.035);

  for (const x of [-0.18, -0.09, 0, 0.09, 0.18]) {
    addMesh(jeepneyGrilleSlatGeometry, obstacleMaterials.rim, group, x, 0.49, 1.063);
  }

  addMesh(jeepneyBumperGeometry, obstacleMaterials.rim, group, 0, 0.32, 1.075);
  addMesh(jeepneyPlateGeometry, obstacleMaterials.white, group, 0, 0.42, 1.105);

  for (const x of [-0.57, 0.57]) {
    addMesh(jeepneyLightGeometry, obstacleMaterials.headlight, group, x, 0.51, 1.04);
  }

  for (const side of [-1, 1]) {
    addMesh(jeepneyMirrorGeometry, obstacleMaterials.dark, group, side * 0.88, 0.99, 0.83);
    addMesh(jeepneySideStripeGeometry, obstacleMaterials.tricycleAccent, group, side * 0.79, 0.66, 0.18);

    for (const z of [-0.49, 0.02, 0.53]) {
      addMesh(jeepneySideGlassGeometry, obstacleMaterials.glass, group, side * 0.79, 0.94, z);
    }

    for (const z of [-0.63, 0.63]) {
      addVehicleWheel(group, side * 0.79, 0.3, z);
    }

    addMesh(jeepneyRackRailGeometry, obstacleMaterials.grille, group, side * 0.62, 1.23, 0.02);
    addMesh(jeepneySideStepGeometry, obstacleMaterials.rim, group, side * 0.81, 0.31, 0.04);
  }

  for (const z of [-0.57, 0.59]) {
    addMesh(jeepneyRackCrossbarGeometry, obstacleMaterials.grille, group, 0, 1.23, z);
  }
}
function createTricycle(group) {
  const paint = Math.random() < 0.5
    ? obstacleMaterials.tricycleBlue
    : obstacleMaterials.tricycleRed;

  addMesh(tricycleBikeBodyGeometry, paint, group, -0.22, 0.61, 0.08);
  addMesh(tricycleSeatGeometry, obstacleMaterials.dark, group, -0.22, 0.89, -0.12);
  addMesh(tricycleSteeringGeometry, obstacleMaterials.grille, group, -0.22, 0.78, 0.47);
  addMesh(tricycleHandlebarGeometry, obstacleMaterials.grille, group, -0.22, 0.91, 0.48);
  addMesh(tricycleHeadlightGeometry, obstacleMaterials.headlight, group, -0.22, 0.72, 0.49);

  addMesh(tricycleSidecarGeometry, paint, group, 0.48, 0.55, 0.17);
  addMesh(tricycleSidecarRoofGeometry, obstacleMaterials.tricycleAccent, group, 0.48, 0.91, 0.15);
  addMesh(tricycleFrontGlassGeometry, obstacleMaterials.glass, group, 0.48, 0.72, 0.71);
  addMesh(tricycleSideGlassGeometry, obstacleMaterials.glass, group, 0.88, 0.73, 0.16);
  addMesh(tricycleSideAccentGeometry, obstacleMaterials.tricycleAccent, group, 0.89, 0.49, 0.18);
  addMesh(tricycleBumperGeometry, obstacleMaterials.rim, group, 0.48, 0.29, 0.73);
  addMesh(tricycleExhaustGeometry, obstacleMaterials.dark, group, -0.48, 0.35, -0.08);

  for (const z of [-0.55, 0.55]) {
    addVehicleWheel(group, -0.22, 0.25, z);
  }
  addVehicleWheel(group, 0.68, 0.22, 0.38);

  for (const x of [-0.52, 0.08]) {
    addMesh(new THREE.BoxGeometry(0.08, 0.07, 0.07), obstacleMaterials.dark, group, x, 1.0, 0.34);
  }
}
function createObstacle(lane, kind) {
  const group = new THREE.Group();
  group.userData.wheels = [];

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
  } else if (kind === 'overhead') {
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
  } else if (kind === 'jeepney') {
    createJeepney(group);
  } else if (kind === 'tricycle') {
    createTricycle(group);
  }

  group.position.set(laneCenters[lane], 0, -72);
  group.userData.lane = lane;
  group.userData.kind = kind;
  group.userData.weavePhase = Math.random() * Math.PI * 2;

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

  const roll = Math.random();
  let kind = 'barrier';

  if (roll < 0.24) {
    kind = 'overhead';
  } else if (roll < 0.52) {
    kind = 'barrier';
  } else if (roll < 0.78) {
    kind = 'jeepney';
  } else {
    kind = 'tricycle';
  }

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
// POWER-UPS
// --------------------------------------------------

const powerups = [];
const powerupTypes = ['magnet', 'shield', 'multiplier'];

const multiplierTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext('2d');
  context.fillStyle = '#8654e8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#ffffff';
  context.lineWidth = 10;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.font = 'bold 108px Arial, sans-serif';
  context.fillText('2X', 128, 132);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  return texture;
})();

const multiplierLabelMaterial = new THREE.MeshBasicMaterial({
  map: multiplierTexture,
  side: THREE.DoubleSide,
});

function createPowerupMesh(type) {
  const group = new THREE.Group();

  if (type === 'magnet') {
    addMesh(
      new THREE.TorusGeometry(0.36, 0.12, 8, 18),
      materials.powerMagnet,
      group,
      0,
      0,
      0
    );

    for (const x of [-0.3, 0.3]) {
      addMesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.16),
        materials.powerWhite,
        group,
        x,
        0.24,
        0
      );
    }
  } else if (type === 'shield') {
    addMesh(
      new THREE.IcosahedronGeometry(0.43, 0),
      materials.powerShield,
      group,
      0,
      0,
      0
    );

    const ring = addMesh(
      new THREE.TorusGeometry(0.47, 0.055, 6, 18),
      materials.powerWhite,
      group,
      0,
      0,
      0.02
    );
    ring.rotation.z = Math.PI / 5;
  } else {
    addMesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.22),
      materials.powerMultiplier,
      group,
      0,
      0,
      0
    );

    addMesh(
      new THREE.PlaneGeometry(0.68, 0.68),
      multiplierLabelMaterial,
      group,
      0,
      0,
      0.116
    );
  }

  group.position.y = 1.45;
  group.userData.type = type;
  return group;
}

let powerupTimer = 0;
let powerupDelay = 2.5;

function spawnPowerup() {
  const lane = Math.floor(Math.random() * 3);
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  const mesh = createPowerupMesh(type);

  mesh.position.set(laneCenters[lane], 1.45, -82);
  scene.add(mesh);
  powerups.push({ mesh, lane, type, baseY: 1.45 });
  powerupDelay = 8 + Math.random() * 3.5;
}

function activatePowerup(type) {
  if (type === 'magnet') {
    magnetTimer = 10;
    playSound('magnet');
  } else if (type === 'shield') {
    shieldTimer = 12;
    playSound('shield');
  } else {
    multiplierTimer = 10;
    playSound('multiplier');
  }

  updatePowerupStatus();
}

let lastPowerupStatusMarkup = '';

function updatePowerupStatus() {
  const badges = [];

  if (magnetTimer > 0) {
    badges.push(
      `<span class="powerup-badge magnet-badge"><b>MAGNET</b><strong>${Math.ceil(magnetTimer)}s</strong></span>`
    );
  }

  if (shieldTimer > 0) {
    badges.push(
      `<span class="powerup-badge shield-badge"><b>SHIELD</b><strong>${Math.ceil(shieldTimer)}s</strong></span>`
    );
  }

  if (multiplierTimer > 0) {
    badges.push(
      `<span class="powerup-badge multiplier-badge"><b>2× SCORE</b><strong>${Math.ceil(multiplierTimer)}s</strong></span>`
    );
  }

  const markup = badges.join('');
  if (markup !== lastPowerupStatusMarkup) {
    powerupStatusEl.innerHTML = markup;
    lastPowerupStatusMarkup = markup;
    powerupStatusEl.classList.toggle('has-effects', badges.length > 0);
  }
}

// --------------------------------------------------
// GAME STATE AND CONTROLS
// --------------------------------------------------

let gameOver = false;
let hasStarted = false;
let isPaused = false;
let countdownActive = false;
let countdownElapsed = 0;
let lastCountdownLabel = '';
let score = 0;
let elapsedTime = 0;
let speed = 16;
let magnetTimer = 0;
let shieldTimer = 0;
let multiplierTimer = 0;
let bestScore = loadBestScore();

updateBestScoreUI();

function moveLane(direction) {
  if (!hasStarted || gameOver || isPaused || countdownActive) return;

  targetLane = THREE.MathUtils.clamp(
    targetLane + direction,
    0,
    2
  );
}

function jump() {
  if (!hasStarted || gameOver || isPaused || countdownActive || slideTime > 0 || jumpHeight > 0) return;

  jumpVelocity = 9.8;
  playSound('jump');
}

function slide() {
  if (!hasStarted || gameOver || isPaused || countdownActive || jumpHeight > 0.1) return;

  slideTime = 0.72;
  playSound('slide');
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
  countdownActive = false;
  countdownOverlay.classList.add('hidden');
  recordBestScore();
  playSound('crash');

  finalMessageEl.textContent =
    `Score: ${Math.floor(score)} | Coins: ${coinCount}`;

  pauseMenuEl.classList.add('hidden');
  gameOverEl.classList.remove('hidden');
}

function startRun() {
  if (hasStarted && !gameOver) recordBestScore();
  initAudio();
  resetGame();
  hasStarted = true;
  isPaused = false;
  countdownActive = true;
  countdownElapsed = 0;
  lastCountdownLabel = '';
  countdownText.textContent = '3';
  countdownOverlay.classList.remove('hidden');
  shell.classList.remove('is-menu');
  shell.classList.add('is-playing');
  mainMenuEl.classList.add('hidden');
  pauseMenuEl.classList.add('hidden');
  gameOverEl.classList.add('hidden');
}

function updateCountdown(delta) {
  countdownElapsed += delta;

  let label;
  if (countdownElapsed < 0.8) {
    label = '3';
  } else if (countdownElapsed < 1.6) {
    label = '2';
  } else if (countdownElapsed < 2.4) {
    label = '1';
  } else if (countdownElapsed < 2.9) {
    label = 'GO!';
  } else {
    countdownActive = false;
    countdownOverlay.classList.add('hidden');
    return;
  }

  if (label !== lastCountdownLabel) {
    lastCountdownLabel = label;
    countdownText.textContent = label;
    playSound(label === 'GO!' ? 'go' : 'countdown');
  }
}

function pauseGame() {
  if (!hasStarted || gameOver || isPaused) return;
  isPaused = true;
  pauseMenuEl.classList.remove('hidden');
  if (countdownActive) countdownOverlay.classList.add('hidden');
  playSound('pause');
}

function resumeGame() {
  if (!hasStarted || gameOver || !isPaused) return;
  isPaused = false;
  pauseMenuEl.classList.add('hidden');
  if (countdownActive) countdownOverlay.classList.remove('hidden');
  playSound('resume');
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
  for (const powerup of powerups) scene.remove(powerup.mesh);

  obstacles.length = 0;
  coins.length = 0;
  powerups.length = 0;

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
  powerupTimer = 0;
  powerupDelay = 2.5;

  magnetTimer = 0;
  shieldTimer = 0;
  multiplierTimer = 0;
  shieldAura.visible = false;
  updatePowerupStatus();

  gameOver = false;
  hasStarted = false;
  isPaused = false;
  countdownActive = false;
  countdownElapsed = 0;
  lastCountdownLabel = '';
  countdownText.textContent = '3';
  countdownOverlay.classList.add('hidden');
  scoreEl.textContent = '00000';
  coinCountEl.textContent = '0';
  gameOverEl.classList.add('hidden');
  pauseMenuEl.classList.add('hidden');
}

startButton.addEventListener('click', startRun);
restartButton.addEventListener('click', startRun);
menuSoundButton.addEventListener('click', toggleSound);
pauseSoundButton.addEventListener('click', toggleSound);
menuTestSoundButton.addEventListener('click', testSound);
pauseTestSoundButton.addEventListener('click', testSound);
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

  // Expire temporary power-ups.
  magnetTimer = Math.max(0, magnetTimer - delta);
  shieldTimer = Math.max(0, shieldTimer - delta);
  multiplierTimer = Math.max(0, multiplierTimer - delta);
  shieldAura.visible = shieldTimer > 0;
  if (shieldAura.visible) shieldAura.rotation.y += delta * 0.85;
  updatePowerupStatus();

  // The game gradually gets faster.
  speed = Math.min(25, 16 + elapsedTime * 0.12);
  score += speed * delta * 2 * (multiplierTimer > 0 ? 2 : 1);

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

  // Spawn collectible power-ups.
  powerupTimer += delta;

  if (powerupTimer >= powerupDelay) {
    powerupTimer = 0;
    spawnPowerup();
  }

  // Move and collect power-ups before obstacle collision checks.
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    const mesh = powerup.mesh;

    mesh.position.z += speed * delta;
    mesh.position.y = powerup.baseY + Math.sin(elapsedTime * 4 + i) * 0.12;
    mesh.rotation.y += delta * 1.8;
    mesh.rotation.z = Math.sin(elapsedTime * 2.3 + i) * 0.12;

    const sameLane =
      Math.abs(playerGroup.position.x - laneCenters[powerup.lane]) < 0.9;
    const closeEnough = Math.abs(mesh.position.z - playerZ) < 1.35;

    if (sameLane && closeEnough) {
      activatePowerup(powerup.type);
      scene.remove(mesh);
      powerups.splice(i, 1);
      continue;
    }

    if (mesh.position.z > playerZ + 5) {
      scene.remove(mesh);
      powerups.splice(i, 1);
    }
  }

  // Move obstacles and check collisions.
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.position.z += speed * delta;

    if (obstacle.userData.wheels) {
      for (const wheel of obstacle.userData.wheels) wheel.rotation.x -= speed * delta * 0.72;
    }

    // Vehicles gently weave within their lane as they approach.
    if (obstacle.userData.kind === 'jeepney' || obstacle.userData.kind === 'tricycle') {
      const weaveAmount = obstacle.userData.kind === 'tricycle' ? 0.16 : 0.09;
      obstacle.position.x = laneCenters[obstacle.userData.lane] +
        Math.sin(elapsedTime * 1.2 + obstacle.userData.weavePhase) * weaveAmount;
    } else {
      obstacle.position.x = laneCenters[obstacle.userData.lane];
    }

    const sameLane =
      Math.abs(playerGroup.position.x -
        laneCenters[obstacle.userData.lane]) < 0.85;

    const closeEnough =
      Math.abs(obstacle.position.z - playerZ) < 1.05;

    if (sameLane && closeEnough) {
      let hitObstacle = false;

      if (obstacle.userData.kind === 'barrier') {
        hitObstacle = jumpHeight < 1.22;
      } else if (obstacle.userData.kind === 'overhead') {
        hitObstacle = slideTime <= 0;
      } else {
        // Jeepneys and tricycles block the lane, so dodge by switching lanes.
        hitObstacle = true;
      }

      if (hitObstacle) {
        if (shieldTimer > 0) {
          shieldTimer = 0;
          scene.remove(obstacle);
          obstacles.splice(i, 1);
          playSound('shield');
          updatePowerupStatus();
          continue;
        }

        finishRun();
        return;
      }
    }

    if (obstacle.position.z > playerZ + 5) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
    }
  }

  // Move and collect coins. The magnet attracts nearby coins across lanes.
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.mesh.position.z += speed * delta;
    coin.mesh.rotation.y += delta * 3.5;

    if (
      magnetTimer > 0 &&
      coin.mesh.position.z < playerZ &&
      coin.mesh.position.z > playerZ - 20 &&
      Math.abs(coin.mesh.position.x - playerGroup.position.x) < 5.2
    ) {
      coin.mesh.position.x = THREE.MathUtils.damp(
        coin.mesh.position.x,
        playerGroup.position.x,
        7,
        delta
      );
      coin.mesh.position.z += speed * delta * 0.55;
    }

    const sameLane = magnetTimer > 0
      ? Math.abs(playerGroup.position.x - coin.mesh.position.x) < 0.85
      : Math.abs(playerGroup.position.x - laneCenters[coin.lane]) < 0.85;

    const closeEnough = Math.abs(coin.mesh.position.z - playerZ) <
      (magnetTimer > 0 ? 1.8 : 1.3);

    if (sameLane && closeEnough) {
      coinCount++;
      score += 100 * (multiplierTimer > 0 ? 2 : 1);
      playSound('coin');

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
    if (countdownActive) {
      updateCountdown(delta);
    } else {
      updateGame(delta);
    }
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
