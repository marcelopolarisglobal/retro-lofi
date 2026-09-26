// Cena "Janela chuvosa": quarto de madeira à noite com a cidade ao fundo.
// O essencial (janela, gato, luzinhas) fica no centro, que é o que sobra visível em
// celular em pé; as laterais (luminária, estante, vitrola) só aparecem em telas largas.

const W = 480;
const H = 270;
const GLASS = { x: 152, y: 42, w: 176, h: 144 };
const SILL_Y = GLASS.y + GLASS.h;
const MULLION = { x: 238, y: 104 };
const CAT = { x: 228, y: SILL_Y - 24 };
const MUG = { x: 268, y: SILL_Y - 9 };
const TURNTABLE = { cx: 404, cy: 173, rx: 17, ry: 6 };
const WIRE_Y = 28;

const COLORS = {
  sky: ['#0b0f2a', '#11163a', '#181e4a', '#22285a'],
  star: '#8a8fc0',
  moonHalo: '#1f2659',
  moon: '#eee6c8',
  crater: '#cfc6a6',
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

  wall: '#3a2418',
  wallDark: '#2e1c13',
  wallLight: '#462c1d',
  wallSeam: '#24160f',
  beam: '#2a1810',
  beamLight: '#4a2f1f',
  panel: '#4a2e1c',
  panelDark: '#36210f',
  panelLight: '#5e3b24',
  floor: '#2e1d12',
  floorSeam: '#1f130b',
  floorLight: '#3a2517',
  warmLight: '#ffb35c',
  coolLight: '#7f95d6',
  vignette: '#120a06',

  frame: '#e3cfa3',
  frameShade: '#b89a6c',
  frameDark: '#7e6446',
  sillTop: '#a0683a',
  sillLight: '#bd8350',
  sillFront: '#6e4424',
  sillDark: '#4e2f19',
  wood: '#7a4a28',
  woodLight: '#9a6236',
  woodDark: '#55331b',

  lampShade: '#e8b36b',
  lampShadeLight: '#ffd9a0',
  lampPole: '#20140d',
  bulbs: ['#ffd98a', '#ffb45e', '#fff0c2'],
  wire: '#1a0f09',

  books: ['#7a3b2e', '#35566e', '#b08a3e', '#4e3a66', '#2f5a44', '#9a5048', '#c9b48a'],
  pot: '#b0603c',
  potDark: '#83432a',
  potLight: '#cf7a50',
  soil: '#3a2415',
  leaf: '#3f7a4a',
  leafDark: '#2b5a36',
  leafLight: '#6aa05a',
  mug: '#e9e2d0',
  mugShade: '#b9b09c',
  mugLight: '#fbf6ea',
  coffee: '#4a2f24',
  steam: '#d9d4e0',

  catOutline: '#120d18',
  catBody: '#2b2433',
  catRim: '#5c5572',
  catWhite: '#ece6da',
  catEye: '#c6e05a',
  catPupil: '#15121a',
  catPink: '#e89aa6',

  plinth: '#8a5530',
  plinthLight: '#a86b3e',
  plinthFront: '#5a3620',
  platter: '#3a3440',
  disc: '#15111a',
  groove: '#2c2632',
  grooveShine: '#6a6276',
  label: '#e0703a',
  labelLight: '#ffc07a',
  arm: '#cfcad6',
  armDark: '#8c8796',
  albumBack: '#2f5a6e',
  albumArt: '#ff9ec7',
  records: ['#15111a', '#e0703a', '#35566e', '#c9b48a', '#9a5048', '#2f5a44'],
};

// Gerador pseudoaleatório com semente: a cena sai igual a cada visita.
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

function ellipse(g, color, cx, cy, rx, ry) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const dy = (y - cy) / ry;
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
    rect(g, color, Math.round(cx) - half, y, half * 2 + 1, 1);
  }
}

function ellipseRing(g, color, cx, cy, rx, ry) {
  for (let a = 0; a < Math.PI * 2; a += 0.08) {
    rect(g, color, Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
}

// Luz em faixas: círculos concêntricos semitransparentes, como na pixel art clássica.
function glow(g, color, cx, cy, radius, bands, alpha) {
  g.globalAlpha = alpha;
  for (let i = 0; i < bands; i++) ellipse(g, color, cx, cy, radius * (1 - i / bands), radius * (1 - i / bands));
  g.globalAlpha = 1;
}

// Madeira: cor base com veios curtos aleatórios, mais claros e mais escuros.
function woodRect(g, random, x, y, w, h, base, dark, light, vertical = false) {
  rect(g, base, x, y, w, h);
  const streaks = Math.floor((w * h) / 30);
  for (let i = 0; i < streaks; i++) {
    const length = 2 + Math.floor(random() * 5);
    const sx = x + Math.floor(random() * w);
    const sy = y + Math.floor(random() * h);
    const color = random() < 0.6 ? dark : light;
    if (vertical) rect(g, color, sx, sy, 1, Math.min(length, y + h - sy));
    else rect(g, color, sx, sy, Math.min(length, x + w - sx), 1);
  }
}

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

  const moon = { x: 298, y: 66 };
  ellipse(g, COLORS.moonHalo, moon.x, moon.y, 14, 14);
  ellipse(g, COLORS.moon, moon.x, moon.y, 10, 10);
  ellipse(g, COLORS.crater, moon.x - 3, moon.y - 2, 2, 2);
  ellipse(g, COLORS.crater, moon.x + 4, moon.y + 3, 1, 1);
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
    puffs.forEach(({ x, y, r }) => ellipse(g, COLORS.cloudLight, x, y - 1, r, r));
    puffs.forEach(({ x, y, r }) => ellipse(g, COLORS.cloud, x, y, r, r));
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
      const h = 45 + Math.floor(random() * 45);
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
      const h = 22 + Math.floor(random() * 50);
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

function wirePoint(x) {
  const along = ((x - 20) % 30) / 30;
  return WIRE_Y + Math.round(Math.sin(along * Math.PI) * 5);
}

function drawWalls(g, random) {
  for (let x = 0; x < W; x += 14) {
    woodRect(g, random, x, 0, 14, 198, COLORS.wall, COLORS.wallDark, COLORS.wallLight, true);
    rect(g, COLORS.wallSeam, x, 0, 1, 198);
  }

  woodRect(g, random, 0, 0, W, 12, COLORS.beam, COLORS.wallSeam, COLORS.wallDark);
  rect(g, COLORS.beamLight, 0, 12, W, 1);

  woodRect(g, random, 0, 198, W, 50, COLORS.panel, COLORS.panelDark, COLORS.panelLight);
  rect(g, COLORS.panelLight, 0, 198, W, 2);
  for (let x = 6; x < W; x += 48) {
    rect(g, COLORS.panelDark, x, 206, 40, 1);
    rect(g, COLORS.panelDark, x, 206, 1, 34);
    rect(g, COLORS.panelLight, x, 240, 40, 1);
    rect(g, COLORS.panelLight, x + 40, 206, 1, 35);
  }

  for (let y = 248; y < H; y += 5) {
    woodRect(g, random, 0, y, W, 5, COLORS.floor, COLORS.floorSeam, COLORS.floorLight);
    rect(g, COLORS.floorSeam, 0, y, W, 1);
    for (let x = Math.floor(random() * 60); x < W; x += 50 + Math.floor(random() * 40)) rect(g, COLORS.floorSeam, x, y, 1, 5);
  }

  glow(g, COLORS.warmLight, 60, 120, 90, 6, 0.05);
}

function drawVignette(g) {
  g.fillStyle = COLORS.vignette;
  g.globalAlpha = 0.07;
  for (let i = 1; i <= 6; i++) {
    const t = i * 9;
    g.fillRect(0, 0, W, t);
    g.fillRect(0, H - t, W, t);
    g.fillRect(0, 0, t * 1.4, H);
    g.fillRect(W - t * 1.4, 0, t * 1.4, H);
  }
  g.globalAlpha = 1;
}

function drawWindowFrame(g) {
  const outer = { x: GLASS.x - 6, y: GLASS.y - 6, w: GLASS.w + 12, h: GLASS.h + 6 };
  rect(g, COLORS.frameDark, outer.x - 1, outer.y - 1, outer.w + 2, outer.h + 1);
  g.clearRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h);
  rect(g, COLORS.frame, outer.x, outer.y, outer.w, 6);
  rect(g, COLORS.frame, outer.x, GLASS.y, 6, GLASS.h);
  rect(g, COLORS.frame, GLASS.x + GLASS.w, GLASS.y, 6, GLASS.h);
  rect(g, COLORS.frameShade, GLASS.x - 1, GLASS.y - 1, GLASS.w + 2, 1);
  rect(g, COLORS.frameShade, GLASS.x - 1, GLASS.y, 1, GLASS.h);
  rect(g, COLORS.frameShade, outer.x + outer.w - 2, outer.y, 2, outer.h);

  rect(g, COLORS.frame, MULLION.x, GLASS.y, 3, GLASS.h);
  rect(g, COLORS.frameShade, MULLION.x + 2, GLASS.y, 1, GLASS.h);
  rect(g, COLORS.frame, GLASS.x, MULLION.y, GLASS.w, 3);
  rect(g, COLORS.frameShade, GLASS.x, MULLION.y + 2, GLASS.w, 1);
}

function drawSill(g, random) {
  woodRect(g, random, GLASS.x - 16, SILL_Y, GLASS.w + 32, 6, COLORS.sillTop, COLORS.sillFront, COLORS.sillLight);
  rect(g, COLORS.sillLight, GLASS.x - 16, SILL_Y + 5, GLASS.w + 32, 1);
  rect(g, COLORS.sillFront, GLASS.x - 16, SILL_Y + 6, GLASS.w + 32, 5);
  rect(g, COLORS.sillDark, GLASS.x - 16, SILL_Y + 10, GLASS.w + 32, 1);
  g.globalAlpha = 0.25;
  rect(g, COLORS.vignette, GLASS.x - 14, SILL_Y + 11, GLASS.w + 28, 3);
  g.globalAlpha = 0.12;
  rect(g, COLORS.coolLight, GLASS.x, SILL_Y, GLASS.w, 5);
  g.globalAlpha = 1;
}

function drawStringLightWire(g) {
  for (let x = 20; x <= W - 20; x++) rect(g, COLORS.wire, x, wirePoint(x), 1, 1);
}

function drawHangingPlant(g, random) {
  const pot = { x: 112, y: 30 };
  rect(g, COLORS.wire, pot.x + 1, 12, 1, pot.y - 12);
  rect(g, COLORS.wire, pot.x + 12, 12, 1, pot.y - 12);
  for (let i = 0; i < 5; i++) {
    const vineX = pot.x + 2 + i * 2 + Math.floor(random() * 2);
    const length = 30 + Math.floor(random() * 50);
    for (let y = 0; y < length; y++) {
      const x = vineX + Math.round(Math.sin(y * 0.15 + i) * 1.5);
      rect(g, COLORS.leafDark, x, pot.y + 8 + y, 1, 1);
      if (y % 4 === 0) ellipse(g, y % 8 ? COLORS.leaf : COLORS.leafLight, x + (i % 2 ? 2 : -2), pot.y + 8 + y, 2, 1);
    }
  }
  rect(g, COLORS.potDark, pot.x - 1, pot.y, 16, 2);
  rect(g, COLORS.pot, pot.x, pot.y + 2, 14, 7);
  rect(g, COLORS.potLight, pot.x + 1, pot.y + 2, 2, 7);
}

function drawLamp(g) {
  rect(g, COLORS.lampPole, 59, 128, 3, 118);
  rect(g, COLORS.lampPole, 51, 244, 19, 4);
  for (let i = 0; i < 20; i++) {
    const width = 12 + i;
    rect(g, i > 17 ? COLORS.lampShadeLight : COLORS.lampShade, 60 - Math.floor(width / 2), 108 + i, width, 1);
  }
  glow(g, COLORS.warmLight, 60, 132, 40, 4, 0.06);
}

function drawShelf(g, random) {
  woodRect(g, random, 370, 104, 100, 5, COLORS.wood, COLORS.woodDark, COLORS.woodLight);
  rect(g, COLORS.woodLight, 370, 104, 100, 1);
  rect(g, COLORS.woodDark, 378, 109, 3, 6);
  rect(g, COLORS.woodDark, 458, 109, 3, 6);
  for (let x = 376; x < 440;) {
    const w = 4 + Math.floor(random() * 3);
    const h = 13 + Math.floor(random() * 9);
    rect(g, COLORS.books[Math.floor(random() * COLORS.books.length)], x, 104 - h, w, h);
    rect(g, COLORS.vignette, x + w - 1, 104 - h, 1, h);
    rect(g, COLORS.mugLight, x + 1, 104 - h + 3, w - 2, 1);
    x += w + (random() < 0.2 ? 1 : 0);
  }
  rect(g, COLORS.pot, 448, 94, 10, 10);
  rect(g, COLORS.potLight, 449, 94, 2, 10);
  ellipse(g, COLORS.leaf, 453, 88, 4, 5);
  ellipse(g, COLORS.leafLight, 452, 86, 2, 2);
}

// Mesa sob a estante com a vitrola (as partes que giram são desenhadas a cada quadro).
function drawRecordTable(g, random) {
  woodRect(g, random, 366, 184, 108, 4, COLORS.sillTop, COLORS.sillFront, COLORS.sillLight);
  rect(g, COLORS.sillLight, 366, 184, 108, 1);
  rect(g, COLORS.sillFront, 366, 188, 108, 4);
  rect(g, COLORS.woodDark, 370, 192, 4, 56);
  rect(g, COLORS.woodDark, 466, 192, 4, 56);

  rect(g, COLORS.woodDark, 384, 224, 66, 24);
  rect(g, COLORS.wood, 385, 225, 64, 2);
  for (let x = 387; x < 447; x += 2) rect(g, COLORS.records[Math.floor(random() * COLORS.records.length)], x, 228, 1, 20);
  rect(g, COLORS.wood, 384, 240, 66, 8);
  rect(g, COLORS.woodLight, 384, 240, 66, 1);

  rect(g, COLORS.plinthFront, 380, 180, 66, 4);
  woodRect(g, random, 380, 163, 66, 17, COLORS.plinth, COLORS.plinthFront, COLORS.plinthLight);
  rect(g, COLORS.plinthLight, 380, 163, 66, 1);
  rect(g, COLORS.arm, 438, 181, 3, 1);
  rect(g, COLORS.labelLight, 384, 181, 1, 1);

  rect(g, COLORS.albumBack, 450, 162, 18, 22);
  ellipse(g, COLORS.albumArt, 459, 172, 5, 5);
  rect(g, COLORS.vignette, 466, 162, 2, 22);
}

function drawPlant(g, random) {
  const base = { x: 199, y: SILL_Y - 12 };
  for (let s = 0; s < 8; s++) {
    const lean = (random() - 0.5) * 1.4;
    const length = 12 + Math.floor(random() * 12);
    for (let i = 0; i < length; i++) {
      const x = Math.round(base.x + lean * i * 0.6 + Math.sin(i * 0.4 + s) * 0.8);
      const y = base.y - i;
      rect(g, COLORS.leafDark, x, y, 1, 1);
      if (i > 3 && i % 3 === 0) ellipse(g, i % 2 ? COLORS.leaf : COLORS.leafLight, x + ((i / 3) % 2 ? 2 : -2), y, 2, 1);
    }
    const tipX = Math.round(base.x + lean * length * 0.6);
    ellipse(g, COLORS.leafLight, tipX, base.y - length, 2, 2);
  }

  const pot = { x: 190, y: SILL_Y - 12 };
  for (let row = 0; row < 15; row++) {
    const inset = Math.floor(row / 5);
    rect(g, COLORS.pot, pot.x + inset, pot.y + row, 18 - inset * 2, 1);
    rect(g, COLORS.potLight, pot.x + inset + 1, pot.y + row, 2, 1);
    rect(g, COLORS.potDark, pot.x + 15 - inset, pot.y + row, 3 - (inset ? 1 : 0), 1);
  }
  rect(g, COLORS.potDark, pot.x - 2, pot.y - 3, 22, 4);
  rect(g, COLORS.potLight, pot.x - 2, pot.y - 3, 22, 1);
  rect(g, COLORS.soil, pot.x, pot.y - 2, 18, 1);
}

function drawMug(g) {
  const { x, y } = MUG;
  rect(g, COLORS.mug, x, y, 12, 12);
  rect(g, COLORS.mugLight, x, y, 12, 1);
  rect(g, COLORS.coffee, x + 1, y + 1, 10, 1);
  rect(g, COLORS.mugLight, x + 1, y + 2, 2, 9);
  rect(g, COLORS.mugShade, x + 10, y + 2, 2, 10);
  rect(g, COLORS.mugShade, x, y + 11, 12, 1);
  rect(g, COLORS.mug, x + 12, y + 3, 3, 1);
  rect(g, COLORS.mug, x + 14, y + 4, 2, 4);
  rect(g, COLORS.mugShade, x + 12, y + 8, 3, 1);
}

function catEars(g, color, x, y, grow) {
  [x + 6, x + 17].forEach((apexX) => {
    for (let i = 0; i <= 6; i++) {
      rect(g, color, apexX - Math.floor(i / 2) - grow, y + i - grow, i + 1 + grow * 2, 1);
    }
  });
}

// Gato preto e branco sentado de frente: contorno escuro, luz de recorte vinda da janela.
// Olhos e rabo são desenhados a cada quadro (piscar e balançar).
function drawCat(g) {
  const { x, y } = CAT;
  catEars(g, COLORS.catOutline, x, y, 1);
  ellipse(g, COLORS.catOutline, x + 12, y + 9, 9, 7.5);
  ellipse(g, COLORS.catOutline, x + 12, y + 20, 10, 7.5);

  catEars(g, COLORS.catBody, x, y, 0);
  ellipse(g, COLORS.catBody, x + 12, y + 9, 8, 6.5);
  ellipse(g, COLORS.catBody, x + 12, y + 20, 9, 6.5);
  [x + 6, x + 17].forEach((apexX) => {
    for (let i = 2; i <= 4; i++) rect(g, COLORS.catPink, apexX - Math.floor(i / 2) + 1, y + i, i - 1, 1);
  });

  rect(g, COLORS.catRim, x + 7, y + 3, 10, 1);
  rect(g, COLORS.catRim, x + 5, y + 4, 2, 1);
  rect(g, COLORS.catRim, x + 17, y + 4, 2, 1);
  rect(g, COLORS.catRim, x + 4, y + 16, 1, 4);
  rect(g, COLORS.catRim, x + 20, y + 16, 1, 4);

  ellipse(g, COLORS.catWhite, x + 12, y + 20, 4, 5);
  ellipse(g, COLORS.catWhite, x + 12, y + 12, 3.5, 2);
  rect(g, COLORS.catPink, x + 11, y + 11, 2, 1);
  rect(g, COLORS.catWhite, x + 6, y + 24, 5, 3);
  rect(g, COLORS.catWhite, x + 13, y + 24, 5, 3);
  rect(g, COLORS.catOutline, x + 11, y + 24, 2, 3);
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
    y: 46 + Math.floor(random() * 40),
    speed: 2 + random() * 3,
  }));
  const city = createCity(random);
  const flickers = Array.from({ length: 14 }, () => ({
    ...city.windows[Math.floor(random() * city.windows.length)],
    period: 4 + random() * 8,
    phase: random(),
  }));
  const room = createLayer(W, H, (g) => {
    drawWalls(g, random);
    drawVignette(g);
    drawWindowFrame(g);
    drawSill(g, random);
    drawStringLightWire(g);
    drawHangingPlant(g, random);
    drawLamp(g);
    drawShelf(g, random);
    drawRecordTable(g, random);
    drawPlant(g, random);
    drawMug(g);
    drawCat(g);
  });
  const bulbs = [];
  for (let x = 35; x < W - 20; x += 30) bulbs.push({ x, y: wirePoint(x) + 1 });
  const rain = Array.from({ length: 140 }, () => spawnRaindrop(true));
  const glassDrops = Array.from({ length: 16 }, spawnGlassDrop);
  let playing = false;
  let discAngle = 0;

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
      const color = COLORS.bulbs[i % COLORS.bulbs.length];
      const brightness = 0.75 + Math.sin(time * 1.1 + i * 1.9) * 0.25;
      ctx.globalAlpha = 0.16 * brightness;
      ellipse(ctx, COLORS.warmLight, x, y + 2, 6, 5);
      ctx.globalAlpha = 0.35 * brightness;
      ellipse(ctx, COLORS.warmLight, x, y + 2, 3, 2);
      ctx.globalAlpha = 1;
      rect(ctx, COLORS.wire, x, y - 1, 2, 1);
      rect(ctx, color, x, y, 2, 3);
    });
  }

  // Disco em perspectiva: os reflexos e a marca do selo percorrem a elipse enquanto gira.
  function drawTurntable(ctx, dt) {
    if (playing) discAngle += dt * Math.PI * 2 * 0.55;
    const { cx, cy, rx, ry } = TURNTABLE;
    ellipse(ctx, COLORS.platter, cx, cy + 1, rx + 1, ry + 1);
    ellipse(ctx, COLORS.disc, cx, cy, rx, ry);
    ellipseRing(ctx, COLORS.groove, cx, cy, rx - 4, ry - 1.5);
    ellipseRing(ctx, COLORS.groove, cx, cy, rx - 8, ry - 3);
    [0, Math.PI].forEach((offset) => {
      for (let j = 0; j < 3; j++) {
        const a = discAngle + offset + j * 0.12;
        rect(ctx, COLORS.grooveShine, Math.round(cx + Math.cos(a) * (rx - 6)), Math.round(cy + Math.sin(a) * (ry - 2)), 1, 1);
      }
    });
    ellipse(ctx, COLORS.label, cx, cy, 5, 2);
    rect(ctx, COLORS.labelLight, Math.round(cx + Math.cos(discAngle) * 3), Math.round(cy + Math.sin(discAngle) * 1.2), 1, 1);
    rect(ctx, COLORS.arm, cx, cy, 1, 1);

    const pivot = { x: 434, y: 168 };
    const head = { x: 416, y: 176 };
    ellipse(ctx, COLORS.armDark, pivot.x, pivot.y, 3, 2);
    ellipse(ctx, COLORS.arm, pivot.x, pivot.y - 1, 2, 1);
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      rect(ctx, COLORS.arm, Math.round(pivot.x + (head.x - pivot.x) * t), Math.round(pivot.y + (head.y - pivot.y) * t), 1, 1);
    }
    rect(ctx, COLORS.armDark, head.x - 1, head.y, 3, 2);
  }

  function drawCatFace(ctx, time) {
    const { x, y } = CAT;
    if (time % 5 < 0.15) {
      rect(ctx, COLORS.catOutline, x + 7, y + 9, 3, 1);
      rect(ctx, COLORS.catOutline, x + 14, y + 9, 3, 1);
      return;
    }
    [x + 7, x + 14].forEach((eyeX) => {
      rect(ctx, COLORS.catEye, eyeX, y + 8, 3, 3);
      rect(ctx, COLORS.catPupil, eyeX + 1, y + 8, 1, 3);
      rect(ctx, COLORS.catWhite, eyeX, y + 8, 1, 1);
    });
  }

  function drawCatTail(ctx, time) {
    const lift = 1 + Math.sin(time * 1.6);
    for (let i = 0; i < 12; i++) {
      const x = CAT.x + 21 + i;
      const y = CAT.y + 24 - (i > 6 ? Math.round((i - 6) * lift) : 0);
      rect(ctx, COLORS.catOutline, x, y - 1, 1, 4);
      rect(ctx, i > 9 ? COLORS.catWhite : COLORS.catBody, x, y, 1, 2);
    }
  }

  function drawSteam(ctx, time) {
    for (let wisp = 0; wisp < 2; wisp++) {
      for (let p = 0; p < 8; p++) {
        const rise = (time * 5 + p * 2 + wisp * 7) % 16;
        const x = MUG.x + 4 + wisp * 4 + Math.round(Math.sin(time * 1.3 + rise * 0.5 + wisp) * 1.5);
        ctx.globalAlpha = 0.4 * (1 - rise / 16);
        rect(ctx, COLORS.steam, x, Math.round(MUG.y - 2 - rise), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    width: W,
    height: H,
    focusX: 0.5,
    focusY: 0.35,
    setPlaying(value) {
      playing = value;
    },
    render(ctx, time, dt) {
      ctx.drawImage(sky, 0, 0);
      drawClouds(ctx, time);
      ctx.drawImage(city.layer, 0, 0);
      drawCityLights(ctx, time);
      drawRain(ctx, dt);
      drawGlassDrops(ctx, dt);
      ctx.drawImage(room, 0, 0);
      drawBulbs(ctx, time);
      drawTurntable(ctx, dt);
      drawCatFace(ctx, time);
      drawCatTail(ctx, time);
      drawSteam(ctx, time);
    },
  };
}
