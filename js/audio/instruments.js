import { midiToFreq } from './theory.js';

// Voz genérica: soma de osciladores (parciais) passando por um envelope de volume e um filtro.
function playVoice({ ctx, music }, { midi, time, duration, peak, partials, attack, sustain, decay, release, cutoff }) {
  const env = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  env.connect(filter).connect(music);

  const end = time + duration;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + attack);
  env.gain.setTargetAtTime(peak * sustain, time + attack, decay);
  env.gain.setTargetAtTime(0, end, release / 4);

  const freq = midiToFreq(midi);
  partials.forEach(({ type, ratio, level, detune = 0 }) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * ratio;
    osc.detune.value = detune;
    const gain = ctx.createGain();
    gain.gain.value = level;
    osc.connect(gain).connect(env);
    osc.start(time);
    osc.stop(end + release);
  });
}

export function keys(engine, midi, time, duration) {
  playVoice(engine, {
    midi, time, duration,
    peak: 0.07, attack: 0.01, sustain: 0.35, decay: 0.6, release: 0.5, cutoff: 2200,
    partials: [
      { type: 'sine', ratio: 1, level: 1, detune: -4 },
      { type: 'sine', ratio: 1, level: 0.8, detune: 4 },
      { type: 'triangle', ratio: 2, level: 0.12 },
    ],
  });
}

export function bass(engine, midi, time, duration) {
  playVoice(engine, {
    midi, time, duration,
    peak: 0.3, attack: 0.01, sustain: 0.7, decay: 0.3, release: 0.08, cutoff: 500,
    partials: [
      { type: 'sine', ratio: 1, level: 1 },
      { type: 'triangle', ratio: 1, level: 0.25 },
    ],
  });
}

export function lead(engine, midi, time, duration) {
  playVoice(engine, {
    midi, time, duration,
    peak: 0.06, attack: 0.02, sustain: 0.5, decay: 0.4, release: 0.25, cutoff: 1800,
    partials: [
      { type: 'triangle', ratio: 1, level: 1 },
      { type: 'sine', ratio: 2, level: 0.2 },
    ],
  });
}

export function kick({ ctx, music }, time) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.9, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

  osc.connect(env).connect(music);
  osc.start(time);
  osc.stop(time + 0.42);
}

function noiseHit({ ctx, music, noise }, time, { type, frequency, q, peak, decay }) {
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const env = ctx.createGain();
  env.gain.setValueAtTime(peak, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + decay);

  source.connect(filter).connect(env).connect(music);
  source.start(time, Math.random() * (noise.duration - 1));
  source.stop(time + decay + 0.02);
}

export function snare(engine, time) {
  noiseHit(engine, time, { type: 'bandpass', frequency: 1800, q: 0.8, peak: 0.35, decay: 0.2 });

  const { ctx, music } = engine;
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(190, time);
  body.frequency.exponentialRampToValueAtTime(150, time + 0.1);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.2, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  body.connect(env).connect(music);
  body.start(time);
  body.stop(time + 0.12);
}

export function hat(engine, time, velocity) {
  noiseHit(engine, time, { type: 'highpass', frequency: 7000, q: 0.7, peak: 0.08 * velocity, decay: 0.04 });
}
