export function createEngine() {
  // No iOS, sem isso a Web Audio é tratada como som de ambiente e a chave de silencioso a emudece.
  if ('audioSession' in navigator) navigator.audioSession.type = 'playback';

  const ctx = new AudioContext();
  ctx.resume();

  const master = ctx.createGain();
  master.connect(ctx.destination);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  compressor.connect(master);

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3800;
  tone.connect(compressor);

  const wobble = createTapeWobble(ctx);
  wobble.connect(tone);

  const music = ctx.createGain();
  music.connect(wobble);

  startVinyl(ctx, master);

  return {
    ctx,
    music,
    noise: createNoiseBuffer(ctx, 2),
    setVolume(value) {
      master.gain.setTargetAtTime(value, ctx.currentTime, 0.05);
    },
  };
}

// Um atraso curto cujo tempo oscila devagar: o tom sobe e desce levemente, como fita gasta.
function createTapeWobble(ctx) {
  const delay = ctx.createDelay(0.05);
  delay.delayTime.value = 0.012;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.6;
  const depth = ctx.createGain();
  depth.gain.value = 0.0012;
  lfo.connect(depth).connect(delay.delayTime);
  lfo.start();

  return delay;
}

function createNoiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startVinyl(ctx, destination) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.02;
    if (Math.random() < 0.00015) data[i] += (Math.random() * 2 - 1) * Math.random() ** 2;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 5000;

  const level = ctx.createGain();
  level.gain.value = 0.5;

  source.connect(filter).connect(level).connect(destination);
  source.start();
}
