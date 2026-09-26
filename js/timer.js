// Contagem regressiva baseada no horário de término, e não em "segundos passados":
// assim o tempo não escorrega se o navegador atrasar a atualização.
export function createTimer({ onTick, onPhaseEnd, onSleep }) {
  let interval = null;
  let endsAt = 0;
  let mode = null;

  function run(minutes) {
    endsAt = Date.now() + minutes * 60 * 1000;
    clearInterval(interval);
    interval = setInterval(tick, 1000);
    tick();
  }

  function tick() {
    const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    onTick({ phase: mode.phase, remaining });
    if (remaining > 0) return;

    if (mode.phase === 'sleep') {
      stop();
      onSleep();
      return;
    }
    mode.phase = mode.phase === 'focus' ? 'rest' : 'focus';
    onPhaseEnd(mode.phase);
    run(mode.phase === 'focus' ? mode.focus : mode.rest);
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    mode = null;
    onTick(null);
  }

  return {
    startPomodoro(focus, rest) {
      mode = { phase: 'focus', focus, rest };
      run(focus);
    },
    startSleep(minutes) {
      mode = { phase: 'sleep' };
      run(minutes);
    },
    stop,
  };
}
