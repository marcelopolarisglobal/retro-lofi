import { midiToFreq } from './theory.js';

// Curva de saturação suave: achata os picos da onda e cria harmônicos audíveis em celulares.
const SATURATION = new Float32Array(1024).map((_, i) => Math.tanh(2.5 * (i / 511.5 - 1)));

// Saída de cada som: posição no estéreo, sinal direto para a mixagem e uma parte enviada ao reverb.
function createOutput({ ctx, music, reverb }, pan, reverbSend) {
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(music);

  const send = ctx.createGain();
  send.gain.value = reverbSend;
  panner.connect(send).connect(reverb);

  return panner;
}

function applyEnvelope(param, { time, end, peak, attack, sustain, decay, release }) {
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(peak, time + attack);
  param.setTargetAtTime(peak * sustain, time + attack, decay);
  param.setTargetAtTime(0, end, release / 4);
}

function startOscillators(ctx, destination, freq, partials, time, stop) {
  partials.forEach(({ type, ratio, level }) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * ratio;
    const gain = ctx.createGain();
    gain.gain.value = level;
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(stop);
  });
}

// Piano elétrico por síntese FM: a moduladora deixa o ataque brilhante e metálico,
// e o brilho se apaga em frações de segundo, como a lâmina de um Rhodes.
export function keys(engine, midi, time, duration, { velocity, pan }) {
  const { ctx } = engine;
  const freq = midiToFreq(midi);
  const end = time + duration;
  const stop = end + 0.6;

  const output = createOutput(engine, pan, 0.25);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3000 + 3000 * velocity;
  tone.connect(output);

  const amp = ctx.createGain();
  amp.connect(tone);
  applyEnvelope(amp.gain, { time, end, peak: 0.06 * velocity, attack: 0.005, sustain: 0.3, decay: 0.8, release: 0.6 });

  [-5, 5].forEach((detune) => {
    const carrier = ctx.createOscillator();
    carrier.frequency.value = freq;
    carrier.detune.value = detune;

    const modulator = ctx.createOscillator();
    modulator.frequency.value = freq;
    modulator.detune.value = detune;

    const depth = ctx.createGain();
    depth.gain.setValueAtTime(freq * 2.2 * velocity, time);
    depth.gain.setTargetAtTime(freq * 0.3, time, 0.25);

    modulator.connect(depth).connect(carrier.frequency);
    carrier.connect(amp);
    [carrier, modulator].forEach((osc) => {
      osc.start(time);
      osc.stop(stop);
    });
  });

  const bell = ctx.createOscillator();
  bell.frequency.value = freq * 14;
  const bellAmp = ctx.createGain();
  bellAmp.gain.setValueAtTime(0.012 * velocity, time);
  bellAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  bell.connect(bellAmp).connect(output);
  bell.start(time);
  bell.stop(time + 0.1);
}

export function bass(engine, midi, time, duration, { velocity }) {
  const { ctx } = engine;
  const end = time + duration;

  const output = createOutput(engine, 0, 0.05);
  const level = ctx.createGain();
  level.gain.value = 0.3;
  level.connect(output);

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1200;
  tone.connect(level);

  const drive = ctx.createWaveShaper();
  drive.curve = SATURATION;
  drive.connect(tone);

  const amp = ctx.createGain();
  amp.connect(drive);
  applyEnvelope(amp.gain, { time, end, peak: 0.9 * velocity, attack: 0.01, sustain: 0.7, decay: 0.3, release: 0.08 });

  startOscillators(ctx, amp, midiToFreq(midi), [
    { type: 'sine', ratio: 1, level: 1 },
    { type: 'triangle', ratio: 1, level: 0.3 },
  ], time, end + 0.1);
}

export function lead(engine, midi, time, duration, { velocity }) {
  const { ctx } = engine;
  const end = time + duration;

  const output = createOutput(engine, -0.15, 0.35);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3500;
  tone.connect(output);

  const amp = ctx.createGain();
  amp.connect(tone);
  applyEnvelope(amp.gain, { time, end, peak: 0.07 * velocity, attack: 0.02, sustain: 0.5, decay: 0.4, release: 0.3 });

  startOscillators(ctx, amp, midiToFreq(midi), [
    { type: 'triangle', ratio: 1, level: 1 },
    { type: 'sine', ratio: 2, level: 0.2 },
  ], time, end + 0.3);
}

function noiseHit(engine, time, { type, frequency, q, peak, decay, pan, reverbSend }) {
  const { ctx, noise } = engine;
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const env = ctx.createGain();
  env.gain.setValueAtTime(peak, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + decay);

  source.connect(filter).connect(env).connect(createOutput(engine, pan, reverbSend));
  source.start(time, Math.random() * (noise.duration - 1));
  source.stop(time + decay + 0.02);
}

function drumTone(engine, output, time, { type, from, to, peak, decay }) {
  const { ctx } = engine;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, time);
  osc.frequency.exponentialRampToValueAtTime(to, time + decay);

  const env = ctx.createGain();
  env.gain.setValueAtTime(peak, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(env).connect(output);
  osc.start(time);
  osc.stop(time + decay + 0.02);
}

export function kick(engine, time, { velocity }) {
  const output = createOutput(engine, 0, 0.05);
  drumTone(engine, output, time, { type: 'sine', from: 150, to: 45, peak: 0.9 * velocity, decay: 0.5 });
  noiseHit(engine, time, { type: 'highpass', frequency: 3000, q: 0.7, peak: 0.15 * velocity, decay: 0.012, pan: 0, reverbSend: 0 });
}

export function snare(engine, time, { velocity }) {
  noiseHit(engine, time, { type: 'bandpass', frequency: 2000, q: 0.7, peak: 0.3 * velocity, decay: 0.25, pan: 0, reverbSend: 0.3 });

  const output = createOutput(engine, 0, 0.3);
  drumTone(engine, output, time, { type: 'triangle', from: 185, to: 150, peak: 0.15 * velocity, decay: 0.1 });
  drumTone(engine, output, time, { type: 'triangle', from: 330, to: 280, peak: 0.08 * velocity, decay: 0.08 });
}

export function hat(engine, time, { velocity }) {
  noiseHit(engine, time, { type: 'bandpass', frequency: 9000, q: 0.8, peak: 0.1 * velocity, decay: 0.045, pan: 0.25, reverbSend: 0.12 });
}
