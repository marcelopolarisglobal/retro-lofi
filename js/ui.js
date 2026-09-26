const $ = (selector) => document.querySelector(selector);

export const playButton = $('#play');
export const nextButton = $('#next');
export const volumeSlider = $('#volume');
export const muteButton = $('#mute');
export const fullscreenButton = $('#fullscreen');
export const sceneCanvas = $('#scene');
export const vibeOptions = $('#vibe-options');
export const bandOptions = $('#band-options');
export const mixerPanel = $('#panel-mixer');
export const queueList = $('#queue');
export const timerPanel = $('#panel-timer');
export const timerStopButton = $('#timer-stop');
export const tabs = document.querySelectorAll('.tab');

const trackName = $('#track-name');
const trackMeta = $('#track-meta');
const chordList = $('#chords');
const timerDisplay = $('#timer-display');
const panels = document.querySelectorAll('.panel');

export function showTrack(track) {
  trackName.textContent = track.name;
  trackMeta.textContent = `Tom ${track.keyName} · ${track.bpm} BPM`;
  chordList.replaceChildren(
    ...track.chordNames.map((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      return item;
    }),
  );
}

export function setPlaying(playing) {
  playButton.textContent = playing ? '❚❚ Pausar' : '▶ Tocar';
  playButton.setAttribute('aria-pressed', String(playing));
  nextButton.disabled = false;
}

export function setMuted(muted) {
  muteButton.setAttribute('aria-pressed', String(muted));
}

export function renderOptions(container, options, selectedId) {
  container.replaceChildren(
    ...Object.entries(options).map(([id, { label }]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      button.dataset.id = id;
      button.textContent = label;
      button.setAttribute('aria-pressed', String(id === selectedId));
      return button;
    }),
  );
}

export function showQueue(queue) {
  queueList.replaceChildren(
    ...queue.map((track, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.index = index;
      button.textContent = `${track.name} · ${track.keyName} · ${track.bpm} BPM`;
      const item = document.createElement('li');
      item.append(button);
      return item;
    }),
  );
}

export function togglePanel(name) {
  const target = $(`#panel-${name}`);
  const opening = target.hidden;
  panels.forEach((panel) => { panel.hidden = true; });
  target.hidden = !opening;
  tabs.forEach((tab) => tab.setAttribute('aria-expanded', String(opening && tab.dataset.panel === name)));
}

export function isAnyPanelOpen() {
  return [...panels].some((panel) => !panel.hidden);
}

export function setUiHidden(hidden) {
  document.body.classList.toggle('ui-hidden', hidden);
}

export function closePanels() {
  panels.forEach((panel) => { panel.hidden = true; });
  tabs.forEach((tab) => tab.setAttribute('aria-expanded', 'false'));
}

const PHASE_LABELS = { focus: 'Foco', rest: 'Pausa', sleep: 'Sono' };

export function showTimer(status) {
  timerDisplay.hidden = !status;
  timerStopButton.hidden = !status;
  if (!status) return;
  const minutes = String(Math.floor(status.remaining / 60)).padStart(2, '0');
  const seconds = String(status.remaining % 60).padStart(2, '0');
  timerDisplay.textContent = `${PHASE_LABELS[status.phase]} ${minutes}:${seconds}`;
}
