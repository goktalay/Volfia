// VOLFAI - 16 bölüm tanımı ve her bölüm için prosedürel "gezegen" sanatı
// Volfied'de her bölümün kendine özgü arka planı vardır; alan kapattıkça ortaya çıkar.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Her bölüm: isim, boss tipi, renkler, zorluk parametreleri
export const LEVELS = [
  { name: 'VOLFAI YÖRÜNGESİ', boss: 'amoeba',  bossR: 4.5, bossSpeed: 14, smalls: 2, smallSpeed: 10, shoot: 0,    time: 150, blocks: 2, hue: 200, art: 'planet' },
  { name: 'KIZIL ÇÖL',        boss: 'amoeba',  bossR: 4.5, bossSpeed: 16, smalls: 3, smallSpeed: 12, shoot: 0,    time: 140, blocks: 2, hue: 15,  art: 'desert' },
  { name: 'BUZ KUŞAĞI',       boss: 'crystal', bossR: 5,   bossSpeed: 17, smalls: 3, smallSpeed: 13, shoot: 0,    time: 140, blocks: 3, hue: 190, art: 'ice' },
  { name: 'NEBULA GEÇİDİ',    boss: 'crystal', bossR: 5,   bossSpeed: 18, smalls: 4, smallSpeed: 14, shoot: 0.15, time: 130, blocks: 3, hue: 280, art: 'nebula' },
  { name: 'HALKALI DEV',      boss: 'spiker',  bossR: 5.5, bossSpeed: 19, smalls: 4, smallSpeed: 15, shoot: 0.2,  time: 130, blocks: 3, hue: 40,  art: 'rings' },
  { name: 'TERK EDİLMİŞ ŞEHİR', boss: 'spiker', bossR: 5.5, bossSpeed: 20, smalls: 5, smallSpeed: 16, shoot: 0.25, time: 125, blocks: 3, hue: 160, art: 'city' },
  { name: 'LAV DENİZİ',       boss: 'amoeba',  bossR: 6,   bossSpeed: 22, smalls: 5, smallSpeed: 17, shoot: 0.3,  time: 120, blocks: 4, hue: 5,   art: 'lava' },
  { name: 'AY TÜNELLERİ',     boss: 'crystal', bossR: 6,   bossSpeed: 23, smalls: 6, smallSpeed: 18, shoot: 0.3,  time: 120, blocks: 4, hue: 220, art: 'moon' },
  { name: 'ASTEROİT KUŞAĞI',  boss: 'spiker',  bossR: 6,   bossSpeed: 24, smalls: 6, smallSpeed: 19, shoot: 0.35, time: 115, blocks: 4, hue: 30,  art: 'asteroids' },
  { name: 'YEŞİL OKYANUS',    boss: 'amoeba',  bossR: 6.5, bossSpeed: 25, smalls: 7, smallSpeed: 20, shoot: 0.4,  time: 115, blocks: 4, hue: 140, art: 'ocean' },
  { name: 'FIRTINA GEZEGENİ', boss: 'crystal', bossR: 6.5, bossSpeed: 26, smalls: 7, smallSpeed: 21, shoot: 0.45, time: 110, blocks: 4, hue: 250, art: 'storm' },
  { name: 'KRİSTAL MAĞARA',   boss: 'spiker',  bossR: 7,   bossSpeed: 27, smalls: 8, smallSpeed: 22, shoot: 0.5,  time: 110, blocks: 5, hue: 300, art: 'crystal' },
  { name: 'ÇİFT GÜNEŞ',       boss: 'amoeba',  bossR: 7,   bossSpeed: 28, smalls: 8, smallSpeed: 23, shoot: 0.55, time: 105, blocks: 5, hue: 50,  art: 'twinsun' },
  { name: 'KARA DELİK',       boss: 'crystal', bossR: 7,   bossSpeed: 30, smalls: 9, smallSpeed: 24, shoot: 0.6,  time: 105, blocks: 5, hue: 270, art: 'blackhole' },
  { name: 'ANA GEMİ',         boss: 'spiker',  bossR: 7.5, bossSpeed: 31, smalls: 9, smallSpeed: 25, shoot: 0.7,  time: 100, blocks: 5, hue: 0,   art: 'mothership' },
  { name: 'VOLFAI: EVE DÖNÜŞ', boss: 'amoeba', bossR: 8,   bossSpeed: 33, smalls: 10, smallSpeed: 26, shoot: 0.8, time: 100, blocks: 6, hue: 205, art: 'home' },
];

export function levelDef(n) {
  // 16'dan sonra döngü + zorluk artışı
  const base = LEVELS[(n - 1) % LEVELS.length];
  const loop = Math.floor((n - 1) / LEVELS.length);
  if (!loop) return { ...base, index: n };
  return {
    ...base, index: n,
    bossSpeed: base.bossSpeed + loop * 6,
    smallSpeed: base.smallSpeed + loop * 5,
    smalls: base.smalls + loop * 2,
    shoot: Math.min(1.2, base.shoot + loop * 0.2),
    time: Math.max(70, base.time - loop * 15),
  };
}

// --- Prosedürel sanat -------------------------------------------------------
function hsl(h, s, l, a = 1) { return `hsla(${h},${s}%,${l}%,${a})`; }

function stars(ctx, w, h, rng, n, bright = 1) {
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h, r = rng() * 1.4 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${(0.3 + rng() * 0.7) * bright})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

function spaceBg(ctx, w, h, hue, rng) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hsl(hue, 60, 6));
  g.addColorStop(1, hsl((hue + 40) % 360, 50, 12));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h, rng, 220);
}

function planet(ctx, x, y, r, hue, rng, opts = {}) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, hsl(hue, 70, 70));
  g.addColorStop(0.6, hsl(hue, 65, 45));
  g.addColorStop(1, hsl(hue, 60, 15));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // bantlar / kıtalar
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  const bands = opts.bands ?? 5;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = hsl((hue + rng() * 40 - 20) % 360, 60, 35 + rng() * 30, 0.35);
    const by = y - r + (i + 0.5) * (2 * r / bands);
    ctx.beginPath();
    ctx.ellipse(x, by, r * 1.1, r * (0.08 + rng() * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (opts.continents) {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = hsl((hue + 120) % 360, 50, 40, 0.7);
      const cx = x + (rng() - 0.5) * 1.6 * r, cy = y + (rng() - 0.5) * 1.6 * r;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, rr = r * (0.12 + rng() * 0.2);
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  // gölge
  const sh = ctx.createRadialGradient(x + r * 0.5, y + r * 0.4, r * 0.3, x, y, r * 1.05);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
  // atmosfer
  ctx.strokeStyle = hsl(hue, 80, 70, 0.5); ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, Math.PI * 2); ctx.stroke();
}

function nebula(ctx, w, h, hue, rng, n = 14) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h, r = (0.15 + rng() * 0.3) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hsl((hue + rng() * 80 - 40 + 360) % 360, 80, 50, 0.22));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function rings(ctx, x, y, r, hue, rng) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35); ctx.scale(1, 0.32);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = hsl((hue + i * 8) % 360, 50, 55 + i * 4, 0.55 - i * 0.05);
    ctx.lineWidth = r * (0.06 + rng() * 0.08);
    ctx.beginPath(); ctx.arc(0, 0, r * (1.45 + i * 0.16), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function city(ctx, w, h, hue, rng) {
  const horizon = h * 0.72;
  const g = ctx.createLinearGradient(0, horizon, 0, h);
  g.addColorStop(0, hsl(hue, 30, 12)); g.addColorStop(1, hsl(hue, 30, 4));
  ctx.fillStyle = g; ctx.fillRect(0, horizon, w, h - horizon);
  for (let x = 0; x < w; x += 6 + rng() * 10) {
    const bw = 8 + rng() * 16, bh = 30 + rng() * (h * 0.4);
    ctx.fillStyle = hsl(hue, 20, 8 + rng() * 10);
    ctx.fillRect(x, horizon - bh, bw, bh);
    for (let wy = horizon - bh + 4; wy < horizon - 4; wy += 7) for (let wx = x + 2; wx < x + bw - 2; wx += 5) {
      if (rng() < 0.45) { ctx.fillStyle = hsl((hue + 60) % 360, 90, 65, 0.8); ctx.fillRect(wx, wy, 2, 3); }
    }
  }
}

function terrain(ctx, w, h, hue, rng, { light = 30, rough = 1 } = {}) {
  let y0 = h * 0.6;
  for (let layer = 0; layer < 4; layer++) {
    ctx.fillStyle = hsl(hue, 45, light - layer * 6);
    ctx.beginPath(); ctx.moveTo(0, h);
    let y = y0 + layer * h * 0.09;
    for (let x = 0; x <= w; x += 8) {
      y += (rng() - 0.5) * 16 * rough;
      y = Math.max(h * 0.4, Math.min(h * 0.95, y));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
}

function craters(ctx, w, h, hue, rng, n) {
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = h * 0.55 + rng() * h * 0.45, r = 4 + rng() * 18;
    ctx.fillStyle = hsl(hue, 20, 18); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hsl(hue, 20, 45); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 1, r, r * 0.5, 0, Math.PI, Math.PI * 2); ctx.stroke();
  }
}

/** Bölüm arka plan sanatını (w x h piksel) üretir. */
export function drawLevelArt(ctx, w, h, def) {
  const rng = mulberry32(def.index * 7919 + 17);
  const hue = def.hue;
  spaceBg(ctx, w, h, hue, rng);
  switch (def.art) {
    case 'planet':   nebula(ctx, w, h, hue, rng, 6); planet(ctx, w * 0.55, h * 0.42, w * 0.3, hue, rng, { continents: true }); break;
    case 'desert':   planet(ctx, w * 0.75, h * 0.2, w * 0.12, 40, rng); terrain(ctx, w, h, hue, rng, { light: 38 }); break;
    case 'ice':      nebula(ctx, w, h, hue, rng, 5); terrain(ctx, w, h, hue, rng, { light: 70, rough: 2 }); break;
    case 'nebula':   nebula(ctx, w, h, hue, rng, 22); stars(ctx, w, h, rng, 120); break;
    case 'rings':    nebula(ctx, w, h, hue, rng, 4); planet(ctx, w * 0.5, h * 0.45, w * 0.26, hue, rng, { bands: 9 }); rings(ctx, w * 0.5, h * 0.45, w * 0.26, hue, rng); break;
    case 'city':     nebula(ctx, w, h, hue, rng, 5); planet(ctx, w * 0.3, h * 0.22, w * 0.1, (hue + 180) % 360, rng); city(ctx, w, h, hue, rng); break;
    case 'lava':     terrain(ctx, w, h, hue, rng, { light: 25, rough: 1.5 }); nebula(ctx, w, h * 0.6, 20, rng, 6); craters(ctx, w, h, 10, rng, 12); break;
    case 'moon':     planet(ctx, w * 0.7, h * 0.18, w * 0.14, 210, rng, { continents: true }); terrain(ctx, w, h, hue, rng, { light: 45, rough: 0.6 }); craters(ctx, w, h, hue, rng, 22); break;
    case 'asteroids': nebula(ctx, w, h, hue, rng, 6); for (let i = 0; i < 40; i++) { const r = 3 + rng() * 14; planet(ctx, rng() * w, rng() * h, r, hue, rng, { bands: 2 }); } break;
    case 'ocean':    planet(ctx, w * 0.5, h * 0.5, w * 0.42, hue, rng, { continents: true, bands: 3 }); break;
    case 'storm':    planet(ctx, w * 0.45, h * 0.4, w * 0.34, hue, rng, { bands: 14 }); nebula(ctx, w, h, hue, rng, 8); break;
    case 'crystal':  terrain(ctx, w, h, hue, rng, { light: 30, rough: 2.5 }); for (let i = 0; i < 30; i++) { const x = rng() * w, y = h * 0.5 + rng() * h * 0.5, s = 10 + rng() * 40; ctx.fillStyle = hsl((hue + rng() * 30) % 360, 70, 60, 0.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.3, y - s); ctx.lineTo(x + s * 0.6, y); ctx.closePath(); ctx.fill(); } break;
    case 'twinsun':  planet(ctx, w * 0.3, h * 0.3, w * 0.16, 50, rng, { bands: 2 }); planet(ctx, w * 0.62, h * 0.24, w * 0.11, 20, rng, { bands: 2 }); terrain(ctx, w, h, hue, rng, { light: 40 }); break;
    case 'blackhole': { nebula(ctx, w, h, hue, rng, 10); const x = w * 0.5, y = h * 0.45;
      for (let i = 10; i > 0; i--) { ctx.strokeStyle = hsl((hue + i * 10) % 360, 90, 60, 0.6); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, y, w * 0.08 + i * 9, (w * 0.08 + i * 9) * 0.35, 0.4, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, w * 0.1, 0, Math.PI * 2); ctx.fill(); break; }
    case 'mothership': { nebula(ctx, w, h, hue, rng, 6);
      ctx.fillStyle = hsl(hue, 10, 30); ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.42, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hsl(hue, 10, 45); ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.46, w * 0.2, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 24; i++) { ctx.fillStyle = hsl((hue + 180 + rng() * 40) % 360, 90, 60); ctx.beginPath(); ctx.arc(w * 0.1 + i * (w * 0.8 / 23), h * 0.53, 3, 0, Math.PI * 2); ctx.fill(); }
      break; }
    case 'home': default:
      nebula(ctx, w, h, hue, rng, 8); planet(ctx, w * 0.5, h * 0.5, w * 0.36, hue, rng, { continents: true, bands: 4 }); rings(ctx, w * 0.5, h * 0.5, w * 0.36, (hue + 30) % 360, rng); break;
  }
}
