export const playButton = document.querySelector('#play');
export const nextButton = document.querySelector('#next');
export const volumeSlider = document.querySelector('#volume');

const trackName = document.querySelector('#track-name');
const trackMeta = document.querySelector('#track-meta');
const chordList = document.querySelector('#chords');

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
