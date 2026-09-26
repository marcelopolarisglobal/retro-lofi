import { createEngine } from './audio/engine.js';
import { createScheduler } from './audio/scheduler.js';
import { composeTrack, playStep, VIBES, BANDS } from './audio/composer.js';
import { chime } from './audio/instruments.js';
import { startRain } from './audio/ambience.js';
import { startScene } from './scene/renderer.js';
import { createRainyWindow } from './scene/rainy-window.js';
import { createAutoHide } from './autohide.js';
import { createTimer } from './timer.js';
import * as ui from './ui.js';

const QUEUE_SIZE = 3;
const SLEEP_FADE_SECONDS = 8;

const settings = { vibe: 'balanced', band: 'full', muted: false };
let engine = null;
let scheduler = null;
let track = null;
let queue = [];
let trackStartStep = 0;
let skipRequested = false;

function refillQueue() {
  while (queue.length < QUEUE_SIZE) queue.push(composeTrack(settings.vibe));
  ui.showQueue(queue);
}

function startTrack(step, time) {
  track = queue.shift();
  refillQueue();
  trackStartStep = step;
  scheduler.setTempo(track.bpm, track.swing);

  const shownTrack = track;
  const delay = Math.max(0, (time - engine.ctx.currentTime) * 1000);
  setTimeout(() => ui.showTrack(shownTrack), delay);
}

// Chamado pelo agendador a cada semicolcheia. Trocas de faixa só acontecem no início
// de um tempo (a cada 4 passos) para a nova música entrar no ritmo.
function onStep(step, time) {
  const trackEnded = step - trackStartStep >= track.totalSteps;
  if (trackEnded || (skipRequested && step % 4 === 0)) {
    skipRequested = false;
    startTrack(step, time);
  }
  playStep(engine, track, step - trackStartStep, time, BANDS[settings.band].parts);
}

function applyVolume() {
  engine?.setVolume(settings.muted ? 0 : ui.volumeSlider.value / 100);
}

function applyMixer() {
  if (!engine) return;
  ui.mixerPanel.querySelectorAll('input').forEach((input) => {
    engine.setLevel(input.dataset.channel, input.value / 100);
  });
}

function startEngine() {
  engine = createEngine();
  startRain(engine);
  applyVolume();
  applyMixer();
  engine.setBrightness(VIBES[settings.vibe].brightness);
  scheduler = createScheduler(engine.ctx, onStep);
  startTrack(0, engine.ctx.currentTime);
  scheduler.start();
  ui.setPlaying(true);
}

async function togglePlay() {
  if (!engine) {
    startEngine();
    return;
  }
  if (engine.ctx.state === 'running') {
    await engine.ctx.suspend();
    ui.setPlaying(false);
  } else {
    await engine.ctx.resume();
    ui.setPlaying(true);
  }
}

async function skip() {
  if (!engine) {
    startEngine();
    return;
  }
  skipRequested = true;
  if (engine.ctx.state !== 'running') {
    await engine.ctx.resume();
    ui.setPlaying(true);
  }
}

function pickFromQueue(index) {
  const [chosen] = queue.splice(index, 1);
  queue.unshift(chosen);
  ui.showQueue(queue);
  skip();
}

// A fila foi composta com a vibe antiga: descarta, recompõe e troca a faixa atual.
function changeVibe(id) {
  settings.vibe = id;
  ui.renderOptions(ui.vibeOptions, VIBES, id);
  queue = [];
  refillQueue();
  if (!engine) return;
  engine.setBrightness(VIBES[id].brightness);
  skipRequested = true;
}

function changeBand(id) {
  settings.band = id;
  ui.renderOptions(ui.bandOptions, BANDS, id);
}

function toggleMute() {
  settings.muted = !settings.muted;
  ui.setMuted(settings.muted);
  applyVolume();
}

function ring(notes) {
  if (engine?.ctx.state !== 'running') return;
  notes.forEach((midi, i) => chime(engine, midi, engine.ctx.currentTime + 0.05 + i * 0.4));
}

function fallAsleep() {
  if (engine?.ctx.state !== 'running') return;
  engine.setVolume(0, SLEEP_FADE_SECONDS);
  setTimeout(async () => {
    await engine.ctx.suspend();
    applyVolume();
    ui.setPlaying(false);
  }, SLEEP_FADE_SECONDS * 1000);
}

const timer = createTimer({
  onTick: ui.showTimer,
  onPhaseEnd: (phase) => ring(phase === 'rest' ? [84, 79] : [79, 84]),
  onSleep: fallAsleep,
});

function toggleFullscreen() {
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

const autoHide = createAutoHide({
  canIdle: () => engine?.ctx.state === 'running' && !ui.isAnyPanelOpen(),
  onChange: ui.setUiHidden,
});

const SHORTCUTS = {
  ' ': togglePlay,
  n: skip,
  m: toggleMute,
  v: () => ui.togglePanel('vibe'),
  x: () => ui.togglePanel('mixer'),
  q: () => ui.togglePanel('queue'),
  t: () => ui.togglePanel('timer'),
  '?': () => ui.togglePanel('help'),
  h: autoHide.toggle,
  f: toggleFullscreen,
  escape: ui.closePanels,
};

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
  const action = SHORTCUTS[event.key.toLowerCase()];
  if (!action) return;
  event.preventDefault();
  action();
});

// O toque na cena é tratado antes da atividade geral (o evento chega primeiro ao canvas).
ui.sceneCanvas.addEventListener('pointerdown', autoHide.toggle);
['pointermove', 'pointerdown', 'keydown'].forEach((type) => document.addEventListener(type, autoHide.activity));

ui.playButton.addEventListener('click', togglePlay);
ui.nextButton.addEventListener('click', skip);
ui.volumeSlider.addEventListener('input', applyVolume);
ui.muteButton.addEventListener('click', toggleMute);
ui.fullscreenButton.addEventListener('click', toggleFullscreen);
ui.mixerPanel.addEventListener('input', applyMixer);
ui.timerStopButton.addEventListener('click', timer.stop);
ui.tabs.forEach((tab) => tab.addEventListener('click', () => ui.togglePanel(tab.dataset.panel)));

ui.vibeOptions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (button) changeVibe(button.dataset.id);
});
ui.bandOptions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (button) changeBand(button.dataset.id);
});
ui.queueList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-index]');
  if (button) pickFromQueue(Number(button.dataset.index));
});
ui.timerPanel.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pomodoro], [data-sleep]');
  if (!button) return;
  if (button.dataset.pomodoro) {
    const [focus, rest] = button.dataset.pomodoro.split(',').map(Number);
    timer.startPomodoro(focus, rest);
  } else {
    timer.startSleep(Number(button.dataset.sleep));
  }
});

ui.fullscreenButton.hidden = !document.fullscreenEnabled;
ui.renderOptions(ui.vibeOptions, VIBES, settings.vibe);
ui.renderOptions(ui.bandOptions, BANDS, settings.band);
refillQueue();
startScene(ui.sceneCanvas, createRainyWindow());
