import { createNoiseBuffer } from './engine.js';

// Chuva sintetizada em três camadas: chiado com rajadas lentas, ronco grave e gotas no vidro.
// Vai direto para o fader de ambiente, fora da cadeia da música (sem wobble de fita).
export function startRain({ ctx, ambience }) {
  const noise = createNoiseBuffer(ctx, 5);

  const hiss = ctx.createBufferSource();
  hiss.buffer = noise;
  hiss.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2500;
  band.Q.value = 0.4;
  const gusts = ctx.createGain();
  gusts.gain.value = 0.08;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.025;
  lfo.connect(lfoDepth).connect(gusts.gain);
  hiss.connect(band).connect(gusts).connect(ambience);

  const rumbleSource = ctx.createBufferSource();
  rumbleSource.buffer = noise;
  rumbleSource.loop = true;
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 300;
  const rumbleLevel = ctx.createGain();
  rumbleLevel.gain.value = 0.12;
  rumbleSource.connect(rumbleFilter).connect(rumbleLevel).connect(ambience);

  const drops = ctx.createBufferSource();
  drops.buffer = createDropsBuffer(ctx, 4, 25);
  drops.loop = true;
  const dropsFilter = ctx.createBiquadFilter();
  dropsFilter.type = 'highpass';
  dropsFilter.frequency.value = 1000;
  const dropsLevel = ctx.createGain();
  dropsLevel.gain.value = 0.5;
  drops.connect(dropsFilter).connect(dropsLevel).connect(ambience);

  lfo.start();
  hiss.start();
  rumbleSource.start(0, 2.5);
  drops.start();
}

// Cada gota é um "plink": uma senoide aguda que some em poucos milésimos de segundo.
function createDropsBuffer(ctx, seconds, dropsPerSecond) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const dropLength = Math.floor(ctx.sampleRate * 0.012);

  for (let n = 0; n < seconds * dropsPerSecond; n++) {
    const start = Math.floor(Math.random() * (data.length - dropLength));
    const frequency = 1500 + Math.random() * 3000;
    const amplitude = 0.05 + Math.random() * 0.15;
    for (let i = 0; i < dropLength; i++) {
      const t = i / ctx.sampleRate;
      data[start + i] += amplitude * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t / 0.003);
    }
  }
  return buffer;
}
