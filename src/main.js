import p5 from 'p5';
import './style.css';

const params = new URLSearchParams(location.search);
const baselineMode = params.get('baseline') === '1';
const forceError = params.get('forceError') === '1';
const stage = document.querySelector('.bl-stage');
const host = document.querySelector('#canvasHost');
const hud = document.querySelector('#hud');
const ghost = document.querySelector('#ghost');
const resetButton = document.querySelector('#resetButton');
const errorPanel = document.querySelector('#error');

if (baselineMode) { hud.hidden = true; ghost.hidden = true; }

let active = false;
let activePointer = null;
let pressStarted = 0;
let releaseStarted = -1;
let userHasActed = false;
let ghostState = 'waiting';
let ghostStarted = 0;
let ghostSample = -1;
let tensionTarget = 0;
let tension = 0;
let pointerXTarget = 0;
let pointerYTarget = 0;
let pointerX = 0;
let pointerY = 0;
let release = 0;
let audioContext = null;
let lastFrame = performance.now();
let startTime = performance.now();

function installControls() {
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  resetButton.addEventListener('pointerdown', event => { event.stopPropagation(); resetState(); });
  addEventListener('keydown', event => { if (event.key.toLowerCase() === 'r') resetState(); });
}

function normalized(clientX, clientY) {
  pointerXTarget = clientX / innerWidth * 2 - 1;
  pointerYTarget = clientY / innerHeight * 2 - 1;
}

function onPointerDown(event) {
  if (event.target === resetButton || resetButton.contains(event.target)) return;
  userHasActed = true;
  endGhost();
  active = true;
  activePointer = event.pointerId;
  pressStarted = performance.now();
  releaseStarted = -1;
  tensionTarget = .12;
  normalized(event.clientX, event.clientY);
  stage.setPointerCapture?.(event.pointerId);
  tone(92, .1, .018);
}

function onPointerMove(event) {
  if (!active || event.pointerId !== activePointer) return;
  normalized(event.clientX, event.clientY);
}

function onPointerUp(event) {
  if (!active || event.pointerId !== activePointer) return;
  active = false;
  activePointer = null;
  tensionTarget = 0;
  releaseStarted = performance.now();
  tone(138, .7, .028);
  tone(276, .3, .014, .04);
}

function resetState() {
  userHasActed = true;
  endGhost();
  active = false;
  activePointer = null;
  tensionTarget = 0;
  pointerXTarget = 0;
  pointerYTarget = 0;
  releaseStarted = -1;
  release = 0;
}

function applyGhostSample(progress) {
  const x = .30 + .42 * progress;
  const y = .68 - .38 * Math.sin(progress * Math.PI);
  normalized(x * innerWidth, y * innerHeight);
  tensionTarget = Math.sin(progress * Math.PI) * .92;
  ghost.style.left = `${x * 100}%`;
  ghost.style.top = `${y * 100}%`;
}

function updateGhost(now) {
  if (baselineMode || userHasActed || ghostState === 'done') return;
  const age = now - startTime;
  if (ghostState === 'waiting' && age >= 1000) {
    ghostState = 'drawing';
    ghostStarted = now;
    ghostSample = -1;
    ghost.classList.add('bl-ghost--visible');
  }
  if (ghostState !== 'drawing') return;
  const progress = Math.min(1, (now - ghostStarted) / 1100);
  const expected = Math.min(71, Math.floor(progress * 71));
  while (ghostSample < expected) {
    ghostSample += 1;
    applyGhostSample(ghostSample / 71);
  }
  if (progress >= 1) {
    ghostState = 'release';
    releaseStarted = now;
    tensionTarget = 0;
    ghost.classList.add('bl-ghost--ending');
    setTimeout(() => { ghost.hidden = true; ghostState = 'done'; }, 380);
  }
}

function endGhost() {
  if (ghostState === 'done') return;
  ghostState = 'done';
  ghost.classList.add('bl-ghost--ending');
  setTimeout(() => { ghost.hidden = true; }, 340);
}

function updateState(now) {
  const dt = Math.min(100, now - lastFrame);
  lastFrame = now;
  updateGhost(now);
  if (active) tensionTarget = Math.min(1, .12 + (now - pressStarted) / 700);
  const fast = 1 - Math.exp(-dt / 85);
  const slow = 1 - Math.exp(-dt / 130);
  tension += (tensionTarget - tension) * fast;
  pointerX += (pointerXTarget - pointerX) * slow;
  pointerY += (pointerYTarget - pointerY) * slow;

  if (releaseStarted >= 0) {
    const elapsed = now - releaseStarted;
    if (elapsed < 300) release = -(elapsed / 300);
    else if (elapsed < 950) release = -1 + ((elapsed - 300) / 650) * 2;
    else if (elapsed < 2600) release = Math.pow(1 - (elapsed - 950) / 1650, 3);
    else { release = 0; releaseStarted = -1; }
  } else release *= Math.exp(-dt / 120);

  if (!active && ghostState !== 'drawing') {
    const settle = 1 - Math.exp(-dt / 900);
    pointerXTarget += (0 - pointerXTarget) * settle;
    pointerYTarget += (0 - pointerYTarget) * settle;
  }
}

const sketch = p => {
  p.setup = () => {
    const canvas = p.createCanvas(innerWidth, innerHeight);
    canvas.parent(host);
    p.pixelDensity(Math.min(devicePixelRatio, 2));
    p.background(0);
    requestAnimationFrame(() => stage.classList.add('bl-ready'));
  };

  p.draw = () => {
    if (!baselineMode) updateState(performance.now());
    p.background(0, 25);
    p.translate(p.width / 2, p.height / 2);
    p.noFill();
    p.stroke(255, baselineMode ? 10 : 10 + tension * 14 + Math.abs(release) * 9);
    p.strokeWeight(1);

    const time = p.frameCount * .008;
    const numLines = 80;
    const numPoints = 200;
    const twist = baselineMode ? 0 : pointerX * tension * 1.35;
    const squeeze = baselineMode ? 0 : pointerY * tension;
    const releaseScale = baselineMode ? 0 : release;

    for (let i = 0; i < numLines; i += 1) {
      const linePhase = (i / numLines) * p.TWO_PI + twist;
      for (const mirror of [-1, 1]) {
        p.beginShape();
        for (let j = 0; j <= numPoints; j += 1) {
          const pointPhase = j / numPoints;
          const y = p.map(pointPhase, 0, 1, -p.height / 2.5, p.height / 2.5);
          const envelope = p.sin(pointPhase * p.PI);
          const wave1 = p.sin(time + linePhase) * 60 * (1 + tension * .42);
          const wave2 = p.sin(pointPhase * 8 + time * 2 + twist * .55) * 40 * (1 - squeeze * .28);
          const centerComplexity = p.pow(p.cos(pointPhase * p.PI - p.HALF_PI), 2) * 100 * (1 + tension * .55 - releaseScale * .22);
          const wave3 = p.cos(linePhase * 4 - time) * centerComplexity;
          const base = 60 * (1 + squeeze * .35 + releaseScale * .48);
          const x = envelope * (wave1 + wave2 + wave3 + base);
          p.vertex(mirror * x, y);
        }
        p.endShape();
      }
    }
  };

  p.windowResized = () => p.resizeCanvas(innerWidth, innerHeight);
};

function ensureAudio() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(frequency, duration, gainValue, delay = 0) {
  const ctx = ensureAudio();
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + .03);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .03);
}

window.__BREATH_LOOM__ = {
  baselineMode,
  get state() { return { active, tension, release, pointer:[pointerX,pointerY], ghostState }; },
  reset: resetState
};

try {
  if (forceError || !HTMLCanvasElement.prototype.getContext) throw new Error('Forced Canvas error');
  if (!baselineMode) installControls();
  new p5(sketch);
} catch (error) {
  console.error(error);
  document.querySelector('#loader').hidden = true;
  errorPanel.hidden = false;
}
