// Cena "Janela chuvosa": quarto à noite com a cidade ao fundo.
// O que importa (janela, gato, luzes) fica no centro, que é o que sobra visível em
// celular em pé; as laterais (luminária, estante) só aparecem em telas largas.

const W = 480;
const H = 270;
const GLASS = { x: 140, y: 24, w: 200, h: 172 };
const SILL_Y = GLASS.y + GLASS.h;
const CAT = { x: 232, y: SILL_Y - 18 };

const COLORS = {
  sky: ['#0b0f2a', '#11163a', '#181e4a', '#22285a'],
  star: '#8a8fc0',
  moonHalo: '#1f2659',
  moon: '#e8e3c9',
  crater: '#cfc9ad',
  cloud: '#262c5c',
  cloudLight: '#323a70',
  far: '#161b3d',
  farWindow: '#2c3263',
  mid: '#0f1330',
  windows: ['#ffcf6e', '#ffcf6e', '#ffcf6e', '#e0a85a', '#7fd3e6', '#ff8fb8'],
  antenna: '#ff4d6d',
  rain: '#4a5896',
  rainNear: '#7d8fd0',
  drop: '#a9bcf0',
  wall: '#2a1f3d',
  wallStripe: '#241a35',
  glow: ['#30244a', '#382a52', '#41305c'],
  frame: '#3b2c4f',
  frameLight: '#57426f',
  sill: '#4a3656',
  sillLight: '#634a73',
  shadow: '#1a1326',
  lampShade: '#ffb36b',
  lampShadeLight: '#ffd59a',
  books: ['#8a4b3c', '#3e6b8a', '#c9a24b', '#5a3e7a', '#2f6b4f', '#b0605a'],
  pot: '#8a4b3c',
  potDark: '#6b3a2f',
  leaf: '#2f6b4f',
  leafLight: '#4a8f62',
  mug: '#d9d4c7',
  mugShade: '#a9a396',
  coffee: '#4a2f24',
  steam: '#c9c6d6',
  cat: '#0d0a18',
  bulbs: ['#ffcf6e', '#ff8fb8', '#8be9fd'],
};

const CAT_SPRITE = [
  '....#......#....',
  '...##......##...',
  '...###....###...',
  '...##########...',
  '..############..',
  '..############..',
  '..############..',
  '...##########...',
  '....########....',
  '...##########...',
  '..############..',
  '..############..',
  '.##############.',
  '.##############.',
  '.##############.',
  '.##############.',
  '..############..',
  '...##########...',
];

const PLANT_SPRITE = [
  '.....L....L.....',
  '....LL...LL..L..',
  '.L..LLl..Ll.LL..',
  '.LL..Ll.LL..Ll..',
  '..LL.LlLL..LL...',
  '...LLLlL..LL....',
  'L...LLlLLLL...L.',
  'LL...LLlLL...LL.',
  '.LL...LLl...LL..',
  '..LLL.LLl.LLL...',
  '....LLLLlLL.....',
  '......LLLL......',
];

// Gerador pseudoaleatório com semente: a cidade sai igual a cada visita.
function createRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createLayer(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  return canvas;
}

function rect(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function disc(g, color, cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    rect(g, color, cx - half, cy + dy, half * 2 + 1, 1);
  }
}

function sprite(g, rows, x, y, palette) {
  rows.forEach((row, dy) => {
    [...row].forEach((char, dx) => {
      if (palette[char]) rect(g, palette[char], x + dx, y + dy, 1, 1);
    });
  });
}

// Céu em faixas de cor com duas linhas de pontilhado entre elas (degradê de pixel art).
function drawSky(g, random) {
  const bandHeight = Math.ceil(GLASS.h / COLORS.sky.length);
  rect(g, COLORS.sky[0], 0, 0, W, H);
  COLORS.sky.forEach((color, i) => {
    const top = GLASS.y + i * bandHeight;
    rect(g, color, 0, top, W, H - top);
    if (i === 0) return;
    for (let y = top - 2; y < top; y++) {
      for (let x = y % 2; x < W; x += 2) rect(g, color, x, y, 1, 1);
    }
  });

  for (let i = 0; i < 25; i++) {
    rect(g, COLORS.star, GLASS.x + Math.floor(random() * GLASS.w), GLASS.y + Math.floor(random() * 50), 1, 1);
  }

  const moon = { x: 298, y: 50 };
  disc(g, COLORS.moonHalo, moon.x, moon.y, 15);
  disc(g, COLORS.moon, moon.x, moon.y, 11);
  disc(g, COLORS.crater, moon.x - 3, moon.y - 2, 2);
  disc(g, COLORS.crater, moon.x + 4, moon.y + 3, 1);
  rect(g, COLORS.crater, moon.x + 2, moon.y - 5, 2, 1);
}

function createCloud(random) {
  const width = 50 + Math.floor(random() * 30);
  const height = 20;
  const puffs = Array.from({ length: 3 + Math.floor(random() * 3) }, () => {
    const r = 5 + Math.floor(random() * 5);
    return { x: 8 + Math.floor(random() * (width - 16)), y: height - r - 2, r };
  });
  return createLayer(width, height, (g) => {
    puffs.forEach(({ x, y, r }) => disc(g, COLORS.cloudLight, x, y - 1, r));
    puffs.forEach(({ x, y, r }) => disc(g, COLORS.cloud, x, y, r));
    rect(g, COLORS.cloud, 6, height - 6, width - 12, 4);
  });
}

// Prédios ao longe (silhuetas) e prédios próximos com janelas acesas.
function createCity(random) {
  const windows = [];
  let antenna = null;
  let tallest = 0;

  const layer = createLayer(W, H, (g) => {
    for (let x = GLASS.x - 10; x < GLASS.x + GLASS.w + 10;) {
      const w = 10 + Math.floor(random() * 14);
      const h = 50 + Math.floor(random() * 50);
      rect(g, COLORS.far, x, SILL_Y - h, w, h);
      for (let wy = SILL_Y - h + 3; wy < SILL_Y - 2; wy += 3) {
        for (let wx = x + 2; wx < x + w - 2; wx += 3) {
          if (random() < 0.08) rect(g, COLORS.farWindow, wx, wy, 1, 1);
        }
      }
      x += w - 2;
    }

    for (let x = GLASS.x - 6; x < GLASS.x + GLASS.w + 6;) {
      const w = 16 + Math.floor(random() * 16);
      const h = 25 + Math.floor(random() * 55);
      const top = SILL_Y - h;
      rect(g, COLORS.mid, x, top, w, h);
      if (random() < 0.3) rect(g, COLORS.mid, x + 3, top - 5, 6, 5);

      for (let wy = top + 4; wy < SILL_Y - 3; wy += 4) {
        for (let wx = x + 2; wx < x + w - 3; wx += 3) {
          const window = { x: wx, y: wy, color: COLORS.windows[Math.floor(random() * COLORS.windows.length)] };
          windows.push(window);
          if (random() < 0.35) rect(g, window.color, wx, wy, 2, 2);
        }
      }

      if (h > tallest) {
        tallest = h;
        antenna = { x: x + Math.floor(w / 2), y: top - 10 };
      }
      x += w + Math.floor(random() * 6);
    }

    rect(g, COLORS.mid, antenna.x, antenna.y, 1, 10);
  });

  return { layer, windows, antenna };
}

function drawRoom(g, random) {
  rect(g, COLORS.wall, 0, 0, W, H);
  [[70, 0], [52, 1], [34, 2]].forEach(([r, i]) => disc(g, COLORS.glow[i], 60, 112, r));
  for (let x = 4; x < W; x += 12) {
    for (let y = 0; y < H; y += 2) rect(g, COLORS.wallStripe, x, y, 1, 1);
  }
  rect(g, COLORS.shadow, 0, 258, W, H - 258);

  g.clearRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h);

  rect(g, COLORS.frame, GLASS.x - 6, GLASS.y - 6, GLASS.w + 12, 6);
  rect(g, COLORS.frameLight, GLASS.x - 6, GLASS.y - 6, GLASS.w + 12, 1);
  rect(g, COLORS.frame, GLASS.x - 6, GLASS.y, 6, GLASS.h);
  rect(g, COLORS.frame, GLASS.x + GLASS.w, GLASS.y, 6, GLASS.h);
  rect(g, COLORS.frame, GLASS.x, 66, GLASS.w, 4);
  rect(g, COLORS.frameLight, GLASS.x, 66, GLASS.w, 1);

  rect(g, COLORS.sill, GLASS.x - 14, SILL_Y, GLASS.w + 28, 8);
  rect(g, COLORS.sillLight, GLASS.x - 14, SILL_Y, GLASS.w + 28, 1);
  rect(g, COLORS.shadow, GLASS.x - 12, SILL_Y + 8, GLASS.w + 24, 3);

  // Fio do varal de luzes, em curvas entre os ganchos.
  for (let x = GLASS.x - 4; x <= GLASS.x + GLASS.w + 4; x++) {
    const along = ((x - GLASS.x + 4) % 26) / 26;
    rect(g, COLORS.shadow, x, GLASS.y + 3 + Math.round(Math.sin(along * Math.PI) * 4), 1, 1);
  }

  // Luminária de chão (lado esquerdo).
  rect(g, COLORS.shadow, 59, 118, 3, 140);
  rect(g, COLORS.shadow, 52, 255, 17, 3);
  for (let i = 0; i < 18; i++) {
    const width = 12 + i;
    rect(g, i > 15 ? COLORS.lampShadeLight : COLORS.lampShade, 60 - Math.floor(width / 2), 100 + i, width, 1);
  }

  // Estante com livros (lado direito).
  rect(g, COLORS.frame, 378, 118, 84, 4);
  rect(g, COLORS.frameLight, 378, 118, 84, 1);
  for (let x = 382; x < 440;) {
    const w = 4 + Math.floor(random() * 3);
    const h = 12 + Math.floor(random() * 8);
    rect(g, COLORS.books[Math.floor(random() * COLORS.books.length)], x, 118 - h, w, h);
    rect(g, COLORS.shadow, x + w - 1, 118 - h, 1, h);
    x += w + (random() < 0.2 ? 1 : 0);
  }
  rect(g, COLORS.pot, 446, 110, 8, 8);
  rect(g, COLORS.leaf, 448, 100, 4, 10);

  // Parapeito: planta, caneca e o gato.
  sprite(g, PLANT_SPRITE, 146, SILL_Y - 26, { L: COLORS.leaf, l: COLORS.leafLight });
  rect(g, COLORS.potDark, 148, SILL_Y - 14, 18, 3);
  rect(g, COLORS.pot, 150, SILL_Y - 12, 14, 12);

  rect(g, COLORS.mug, 312, SILL_Y - 9, 9, 9);
  rect(g, COLORS.mugShade, 312, SILL_Y - 2, 9, 2);
  rect(g, COLORS.coffee, 313, SILL_Y - 9, 7, 1);
  rect(g, COLORS.mug, 321, SILL_Y - 7, 2, 1);
  rect(g, COLORS.mug, 322, SILL_Y - 6, 1, 3);
  rect(g, COLORS.mug, 321, SILL_Y - 3, 2, 1);

  sprite(g, CAT_SPRITE, CAT.x, CAT.y, { '#': COLORS.cat });
}

function spawnRaindrop(anywhere) {
  const near = Math.random() < 0.25;
  return {
    x: GLASS.x - 20 + Math.random() * (GLASS.w + 60),
    y: anywhere ? GLASS.y + Math.random() * GLASS.h : GLASS.y - Math.random() * 20,
    speed: near ? 260 : 170 + Math.random() * 40,
    length: near ? 5 : 3,
    color: near ? COLORS.rainNear : COLORS.rain,
  };
}

function spawnGlassDrop() {
  return {
    x: GLASS.x + 2 + Math.floor(Math.random() * (GLASS.w - 4)),
    y: GLASS.y + Math.random() * GLASS.h * 0.6,
    trailTop: null,
    speed: 0,
    wait: Math.random() * 6,
  };
}

export function createRainyWindow() {
  const random = createRandom(20260926);
  const sky = createLayer(W, H, (g) => drawSky(g, random));
  const clouds = Array.from({ length: 4 }, (_, i) => ({
    image: createCloud(random),
    offset: i * 70 + random() * 40,
    y: 28 + Math.floor(random() * 60),
    speed: 2 + random() * 3,
  }));
  const city = createCity(random);
  const flickers = Array.from({ length: 14 }, () => ({
    ...city.windows[Math.floor(random() * city.windows.length)],
    period: 4 + random() * 8,
    phase: random(),
  }));
  const room = createLayer(W, H, (g) => drawRoom(g, random));
  const bulbs = [];
  for (let x = GLASS.x + 9; x < GLASS.x + GLASS.w + 4; x += 26) bulbs.push({ x: x - 1, y: GLASS.y + 7 });
  const rain = Array.from({ length: 140 }, () => spawnRaindrop(true));
  const glassDrops = Array.from({ length: 16 }, spawnGlassDrop);

  function drawClouds(ctx, time) {
    const span = GLASS.w + 160;
    clouds.forEach(({ image, offset, y, speed }) => {
      const x = GLASS.x - 80 + ((offset + time * speed) % span);
      ctx.drawImage(image, Math.floor(x), y);
    });
  }

  function drawCityLights(ctx, time) {
    flickers.forEach(({ x, y, color, period, phase }) => {
      const lit = (time / period + phase) % 1 < 0.6;
      rect(ctx, lit ? color : COLORS.mid, x, y, 2, 2);
    });
    if (time % 2 < 0.3) rect(ctx, COLORS.antenna, city.antenna.x, city.antenna.y, 1, 1);
  }

  function drawRain(ctx, dt) {
    rain.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.x -= drop.speed * dt * 0.25;
      if (drop.y > SILL_Y) Object.assign(drop, spawnRaindrop(false));
      for (let i = 0; i < drop.length; i++) {
        rect(ctx, drop.color, Math.round(drop.x + i * 0.25), Math.round(drop.y - i), 1, 1);
      }
    });
  }

  // Gotas no vidro: param, escorrem aos trancos e deixam um rastro claro.
  function drawGlassDrops(ctx, dt) {
    glassDrops.forEach((drop) => {
      if (drop.speed === 0) {
        drop.wait -= dt;
        if (drop.wait <= 0) {
          drop.speed = 6 + Math.random() * 14;
          drop.trailTop ??= drop.y;
        }
      } else {
        drop.y += drop.speed * dt;
        if (Math.random() < dt * 0.5) {
          drop.speed = 0;
          drop.wait = Math.random() * 3;
        }
        if (drop.y > SILL_Y - 2) Object.assign(drop, spawnGlassDrop());
      }

      const y = Math.floor(drop.y);
      if (drop.trailTop !== null) {
        ctx.globalAlpha = 0.35;
        rect(ctx, COLORS.drop, drop.x, Math.floor(drop.trailTop), 1, y - Math.floor(drop.trailTop));
        ctx.globalAlpha = 1;
      }
      rect(ctx, COLORS.drop, drop.x, y, 2, 2);
    });
  }

  function drawBulbs(ctx, time) {
    bulbs.forEach(({ x, y }, i) => {
      const on = Math.sin(time * 1.2 + i * 1.7) > -0.5;
      const color = COLORS.bulbs[i % COLORS.bulbs.length];
      if (on) {
        ctx.globalAlpha = 0.25;
        rect(ctx, color, x - 2, y - 1, 6, 4);
        ctx.globalAlpha = 1;
      }
      rect(ctx, on ? color : COLORS.frame, x, y, 2, 2);
    });
  }

  function drawTail(ctx, time) {
    const lift = 1 + Math.sin(time * 1.6);
    for (let i = 0; i < 10; i++) {
      const y = SILL_Y - 2 - (i > 5 ? Math.round((i - 5) * lift) : 0);
      rect(ctx, COLORS.cat, CAT.x + 14 + i, y, 1, 2);
    }
  }

  function drawSteam(ctx, time) {
    for (let wisp = 0; wisp < 2; wisp++) {
      for (let p = 0; p < 7; p++) {
        const rise = (time * 5 + p * 2 + wisp * 7) % 14;
        const x = 315 + wisp * 3 + Math.round(Math.sin(time * 1.3 + rise * 0.5 + wisp) * 1.5);
        ctx.globalAlpha = 0.4 * (1 - rise / 14);
        rect(ctx, COLORS.steam, x, Math.round(SILL_Y - 11 - rise), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    width: W,
    height: H,
    focusX: 0.5,
    focusY: 0.35,
    render(ctx, time, dt) {
      ctx.drawImage(sky, 0, 0);
      drawClouds(ctx, time);
      ctx.drawImage(city.layer, 0, 0);
      drawCityLights(ctx, time);
      drawRain(ctx, dt);
      drawGlassDrops(ctx, dt);
      ctx.drawImage(room, 0, 0);
      drawBulbs(ctx, time);
      drawTail(ctx, time);
      drawSteam(ctx, time);
    },
  };
}
