const SCHEDULE_AHEAD = 0.12;

// A cada "tick" do worker, agenda no relógio do áudio todos os passos (semicolcheias)
// que caem nos próximos 120 ms. O worker não sofre a desaceleração de abas em segundo plano.
export function createScheduler(ctx, onStep) {
  const clock = new Worker(new URL('./clock.worker.js', import.meta.url));
  let bpm = 80;
  let swing = 0;
  let step = 0;
  let nextTime = 0;

  clock.onmessage = () => {
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime;
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const stepDuration = 60 / bpm / 4;
      const swingDelay = step % 2 === 1 ? swing * stepDuration : 0;
      onStep(step, nextTime + swingDelay);
      nextTime += 60 / bpm / 4;
      step++;
    }
  };

  return {
    start() {
      nextTime = ctx.currentTime + 0.05;
      clock.postMessage('start');
    },
    setTempo(newBpm, newSwing) {
      bpm = newBpm;
      swing = newSwing;
    },
  };
}
