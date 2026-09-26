const CHANNELS = ['keys', 'bass', 'drums', 'melody', 'fx'];

export function createEngine() {
  // No iOS, sem isso a Web Audio é tratada como som de ambiente e a chave de silencioso a emudece.
  if ('audioSession' in navigator) navigator.audioSession.type = 'playback';

  const ctx = new AudioContext();
  ctx.resume();

  const master = ctx.createGain();
  master.connect(ctx.destination);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 2.5;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.2;
  compressor.connect(master);

  const warmth = ctx.createBiquadFilter();
  warmth.type = 'highshelf';
  warmth.frequency.value = 7000;
  warmth.gain.value = -3;
  warmth.connect(compressor);

  const rumbleCut = ctx.createBiquadFilter();
  rumbleCut.type = 'highpass';
  rumbleCut.frequency.value = 30;
  rumbleCut.connect(warmth);

  const wobble = createTapeWobble(ctx);
  wobble.connect(rumbleCut);

  const music = ctx.createGain();
  music.connect(wobble);

  // Barramento de envio: cada instrumento manda uma parte do seu som para a "sala".
  const reverb = ctx.createGain();
  const room = ctx.createConvolver();
  room.buffer = createImpulse(ctx, 2.2);
  const roomTone = ctx.createBiquadFilter();
  roomTone.type = 'lowpass';
  roomTone.frequency.value = 5000;
  reverb.connect(room).connect(roomTone).connect(wobble);

  // Um canal por instrumento, como numa mesa de som: o volume do som direto e o do envio
  // ao reverb andam juntos, para que um instrumento silenciado não deixe o eco soando.
  const channels = Object.fromEntries(CHANNELS.map((name) => {
    const dry = ctx.createGain();
    dry.connect(music);
    const wet = ctx.createGain();
    wet.connect(reverb);
    return [name, { dry, wet }];
  }));

  const faders = { vinyl: startVinyl(ctx, master), ambience: ctx.createGain() };
  faders.ambience.connect(master);

  return {
    ctx,
    channels,
    ambience: faders.ambience,
    noise: createNoiseBuffer(ctx, 2),
    setVolume(value, fadeSeconds = 0.2) {
      master.gain.setTargetAtTime(value, ctx.currentTime, fadeSeconds / 4);
    },
    setLevel(name, value) {
      const params = faders[name] ? [faders[name].gain] : [channels[name].dry.gain, channels[name].wet.gain];
      params.forEach((param) => param.setTargetAtTime(value, ctx.currentTime, 0.05));
    },
    setBrightness(decibels) {
      warmth.gain.setTargetAtTime(decibels, ctx.currentTime, 0.3);
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

// Resposta de impulso de uma sala: ruído estéreo que se apaga ao longo de alguns segundos.
function createImpulse(ctx, seconds) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  return buffer;
}

export function createNoiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startVinyl(ctx, destination) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.004;
    if (Math.random() < 0.00005) data[i] += (Math.random() * 2 - 1) * Math.random() ** 3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;

  const level = ctx.createGain();
  level.gain.value = 0.35;

  const fader = ctx.createGain();
  source.connect(filter).connect(level).connect(fader).connect(destination);
  source.start();
  return fader;
}
