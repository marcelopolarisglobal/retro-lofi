export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const PENTATONIC = [0, 2, 4, 7, 9];

const CHORDS = {
  maj7: { intervals: [0, 4, 7, 11], symbol: 'maj7' },
  maj9: { intervals: [0, 4, 7, 11, 14], symbol: 'maj9' },
  m7: { intervals: [0, 3, 7, 10], symbol: 'm7' },
  m9: { intervals: [0, 3, 7, 10, 14], symbol: 'm9' },
  dom7: { intervals: [0, 4, 7, 10], symbol: '7' },
  dom9: { intervals: [0, 4, 7, 10, 14], symbol: '9' },
};

// Cada acorde: [distância da tônica em semitons, tipo]
export const PROGRESSIONS = [
  [[2, 'm9'], [7, 'dom9'], [0, 'maj9'], [9, 'm7']],
  [[0, 'maj7'], [9, 'm7'], [2, 'm7'], [7, 'dom7']],
  [[5, 'maj7'], [4, 'm7'], [2, 'm7'], [0, 'maj7']],
  [[9, 'm9'], [5, 'maj7'], [0, 'maj9'], [7, 'dom9']],
  [[0, 'maj9'], [2, 'm9'], [4, 'm7'], [5, 'maj9']],
];

const VOICING_LOW = 53;

export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function chordName(key, [root, type]) {
  return NOTE_NAMES[(key + root) % 12] + CHORDS[type].symbol;
}

// Acordes de 5 notas perdem a fundamental (o baixo já a toca) e todas as notas
// são dobradas para dentro de uma mesma oitava, o que mantém as trocas suaves.
export function voiceChord(key, [root, type]) {
  const { intervals } = CHORDS[type];
  const tones = intervals.length > 4 ? intervals.slice(1) : intervals;
  return tones
    .map((interval) => {
      const pitchClass = (key + root + interval) % 12;
      return VOICING_LOW + ((pitchClass - (VOICING_LOW % 12) + 12) % 12);
    })
    .sort((a, b) => a - b);
}
