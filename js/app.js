import { createEngine } from './audio/engine.js';
import { createScheduler } from './audio/scheduler.js';
import { composeTrack, playStep } from './audio/composer.js';
import * as ui from './ui.js';

let engine = null;
let scheduler = null;
let track = null;
let trackStartStep = 0;
let skipRequested = false;

function startTrack(step, time) {
  track = composeTrack();
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
  playStep(engine, track, step - trackStartStep, time);
}

async function togglePlay() {
  if (!engine) {
    engine = createEngine();
    engine.setVolume(ui.volumeSlider.value / 100);
    scheduler = createScheduler(engine.ctx, onStep);
    startTrack(0, engine.ctx.currentTime);
    scheduler.start();
    ui.setPlaying(true);
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

ui.playButton.addEventListener('click', togglePlay);
ui.nextButton.addEventListener('click', () => {
  skipRequested = true;
});
ui.volumeSlider.addEventListener('input', () => {
  engine?.setVolume(ui.volumeSlider.value / 100);
});
