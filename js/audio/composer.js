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

export const VIBES = {
  chill: { label: 'Calmo', bpm: [60, 72], swing: [0.2, 0.3], melodyDensity: 0.3, drumPatterns: [0, 2], brightness: -8 },
  balanced: { label: 'Equilibrado', bpm: [68, 84], swing: [0.15, 0.3], melodyDensity: 0.45, drumPatterns: [0, 1, 2, 3], brightness: -3 },
  upbeat: { label: 'Animado', bpm: [80, 94], swing: [0.12, 0.22], melodyDensity: 0.6, drumPatterns: [1, 3], brightness: 0 },
};

export const BANDS = {
  full: { label: 'Completa', parts: { keys: true, bass: true, drums: true, melody: true } },
  noDrums: { label: 'Sem bateria', parts: { keys: true, bass: true, drums: false, melody: true } },
  keysOnly: { label: 'Só teclado', parts: { keys: true, bass: false, drums: false, melody: true } },
};

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
const humanize = (time) => time + (Math.random() - 0.5) * 0.012;
const velocity = () => 0.8 + Math.random() * 0.2;

export function composeTrack(vibeName) {
  const vibe = VIBES[vibeName];
  const key = randInt(0, 11);
  const progression = pick(PROGRESSIONS);
  const bars = SECTIONS.flatMap((section) => Array(section.bars).fill(section.parts));

  return {
    name: `${pick(NOUNS)} ${pick(COMPLEMENTS)}`,
    keyName: NOTE_NAMES[key],
    key,
    bpm: randInt(...vibe.bpm),
    swing: rand(...vibe.swing),
    progression,
    chordNames: progression.map((chord) => chordName(key, chord)),
    drums: DRUM_PATTERNS[pick(vibe.drumPatterns)],
    keysRhythm: pick(KEYS_RHYTHMS),
    melody: composeMelody(key, vibe.melodyDensity),
    bars,
    totalSteps: bars.length * STEPS_PER_BAR,
  };
}

// Frase de 4 compassos: um motivo rítmico repetido, com as notas caminhando em
// passos curtos pela escala pentatônica. O último compasso respira na segunda metade.
function composeMelody(key, density) {
  const scale = [];
  for (let midi = 67; midi <= 86; midi++) {
    if (PENTATONIC.includes((midi - key + 12) % 12)) scale.push(midi);
  }

  let motif = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14].filter(() => Math.random() < density);
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

// `band` é a formação escolhida: filtra na hora quais partes da partitura soam.
export function playStep(engine, track, step, time, band) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const beat = step % STEPS_PER_BAR;
  const plays = (part) => track.bars[bar][part] && band[part];
  const stepDuration = 60 / track.bpm / 4;
  const chord = track.progression[bar % track.progression.length];
  const chordRoot = (track.key + chord[0]) % 12;
  const kickHit = track.drums.kick[beat] === 'x';

  if (plays('keys')) {
    const hit = track.keysRhythm.find((h) => h.step === beat);
    if (hit) {
      const notes = voiceChord(track.key, chord);
      notes.forEach((midi, i) => {
        const pan = -0.35 + (0.7 * i) / (notes.length - 1);
        keys(engine, midi, humanize(time + i * 0.012), hit.length * stepDuration, { velocity: velocity(), pan });
      });
    }
  }

  if (plays('bass') && kickHit) {
    const interval = beat !== 0 && Math.random() < 0.3 ? 7 : 0;
    bass(engine, 36 + chordRoot + interval, humanize(time), (beat === 0 ? 6 : 3) * stepDuration, { velocity: velocity() });
  }

  if (plays('drums')) {
    if (kickHit) kick(engine, humanize(time), { velocity: velocity() });
    if (track.drums.snare[beat] === 'x') snare(engine, humanize(time), { velocity: velocity() });
    if (track.drums.hat[beat] === 'x' && Math.random() > 0.1) {
      const accent = beat % 4 === 0 ? 1 : 0.55 + Math.random() * 0.25;
      hat(engine, humanize(time), { velocity: accent * velocity() });
    }
  }

  if (plays('melody')) {
    const note = track.melody[(bar % 4) * STEPS_PER_BAR + beat];
    if (note) lead(engine, note.midi, humanize(time), note.steps * stepDuration, { velocity: velocity() });
  }
}
