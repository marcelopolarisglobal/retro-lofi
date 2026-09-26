import { NOTE_NAMES, PENTATONIC, PROGRESSIONS, chordName, voiceChord } from './theory.js';
import { keys, bass, lead, kick, snare, hat } from './instruments.js';

const STEPS_PER_BAR = 16;

// Cada caractere é uma semicolcheia do compasso: "x" toca, "." silêncio.
const DRUM_PATTERNS = [
  { kick: 'x.........x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  { kick: 'x..x......x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx' },
  { kick: 'x......x.x......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  { kick: 'x.........x..x..', snare: '....x.......x...', hat: 'x.xxx.x.x.xxx.x.' },
];

const KEYS_RHYTHMS = [
  [{ step: 0, length: 16 }],
  [{ step: 0, length: 10 }, { step: 10, length: 6 }],
  [{ step: 0, length: 7 }, { step: 7, length: 9 }],
];

const SECTIONS = [
  { bars: 4, parts: { keys: true } },
  { bars: 8, parts: { keys: true, drums: true, bass: true } },
  { bars: 8, parts: { keys: true, drums: true, bass: true, melody: true } },
  { bars: 8, parts: { keys: true, drums: true, bass: true } },
  { bars: 8, parts: { keys: true, drums: true, bass: true, melody: true } },
  { bars: 4, parts: { keys: true } },
];

const NOUNS = ['Café', 'Chuva', 'Janela', 'Neon', 'Vinil', 'Madrugada', 'Bonde', 'Varanda', 'Rádio', 'Poeira'];
const COMPLEMENTS = ['de Domingo', 'na Sacada', 'das Três', 'sem Pressa', 'em Fita', 'ao Luar', 'no Terraço', 'de Inverno'];

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function composeTrack() {
  const key = randInt(0, 11);
  const progression = pick(PROGRESSIONS);
  const bars = SECTIONS.flatMap((section) => Array(section.bars).fill(section.parts));

  return {
    name: `${pick(NOUNS)} ${pick(COMPLEMENTS)}`,
    keyName: NOTE_NAMES[key],
    key,
    bpm: randInt(68, 88),
    swing: rand(0.15, 0.3),
    progression,
    chordNames: progression.map((chord) => chordName(key, chord)),
    drums: pick(DRUM_PATTERNS),
    keysRhythm: pick(KEYS_RHYTHMS),
    melody: composeMelody(key),
    bars,
    totalSteps: bars.length * STEPS_PER_BAR,
  };
}

// Frase de 4 compassos: um motivo rítmico repetido, com as notas caminhando em
// passos curtos pela escala pentatônica. O último compasso respira na segunda metade.
function composeMelody(key) {
  const scale = [];
  for (let midi = 67; midi <= 86; midi++) {
    if (PENTATONIC.includes((midi - key + 12) % 12)) scale.push(midi);
  }

  let motif = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14].filter(() => Math.random() < 0.45);
  if (motif.length < 3) motif = [0, 6, 10];

  const phrase = Array(4 * STEPS_PER_BAR).fill(null);
  let index = Math.floor(scale.length / 2);

  for (let bar = 0; bar < 4; bar++) {
    const onsets = bar === 3 ? motif.filter((step) => step < 8) : motif;
    onsets.forEach((step, i) => {
      index = clamp(index + pick([-2, -1, -1, 0, 1, 1, 2]), 0, scale.length - 1);
      if (Math.random() < 0.15) return;
      const nextOnset = onsets[i + 1] ?? STEPS_PER_BAR;
      phrase[bar * STEPS_PER_BAR + step] = { midi: scale[index], steps: Math.min(nextOnset - step, 4) };
    });
  }
  return phrase;
}

export function playStep(engine, track, step, time) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const beat = step % STEPS_PER_BAR;
  const parts = track.bars[bar];
  const stepDuration = 60 / track.bpm / 4;
  const chord = track.progression[bar % track.progression.length];
  const chordRoot = (track.key + chord[0]) % 12;
  const kickHit = track.drums.kick[beat] === 'x';

  if (parts.keys) {
    const hit = track.keysRhythm.find((h) => h.step === beat);
    if (hit) {
      voiceChord(track.key, chord).forEach((midi, i) => {
        keys(engine, midi, time + i * 0.012, hit.length * stepDuration);
      });
    }
  }

  if (parts.bass && kickHit) {
    const interval = beat !== 0 && Math.random() < 0.3 ? 7 : 0;
    bass(engine, 36 + chordRoot + interval, time, (beat === 0 ? 6 : 3) * stepDuration);
  }

  if (parts.drums) {
    if (kickHit) kick(engine, time);
    if (track.drums.snare[beat] === 'x') snare(engine, time);
    if (track.drums.hat[beat] === 'x' && Math.random() > 0.1) {
      hat(engine, time, beat % 4 === 0 ? 1 : 0.55 + Math.random() * 0.25);
    }
  }

  if (parts.melody) {
    const note = track.melody[(bar % 4) * STEPS_PER_BAR + beat];
    if (note) lead(engine, note.midi, time, note.steps * stepDuration);
  }
}
