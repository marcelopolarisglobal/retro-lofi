const FPS = 24;

// Desenha a cena na resolução nativa (ex.: 480×270); o CSS amplia sem suavizar os pixels.
// requestAnimationFrame pausa sozinho com a aba escondida, e 24 quadros/s poupam bateria.
export function startScene(canvas, scene) {
  canvas.width = scene.width;
  canvas.height = scene.height;
  canvas.style.objectPosition = `${scene.focusX * 100}% ${scene.focusY * 100}%`;
  const ctx = canvas.getContext('2d');
  let last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    scene.render(ctx, now / 1000, dt);
  }

  requestAnimationFrame(frame);
}
