// VOLFAI - çizim katmanı
import { GRID_W, GRID_H, CELL, POWERUPS } from './config.js';
import { drawLevelArt } from './levels.js';
import { DIR_VEC } from './input.js';
import { STATE } from './game.js';

export class Renderer {
  constructor(canvas, stickCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stickCanvas = stickCanvas;
    this.sctx = stickCanvas.getContext('2d');
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cs = 4; // hücre boyutu (css px)
    this.art = document.createElement('canvas');
    this.comp = document.createElement('canvas');
    this.mask = document.createElement('canvas'); this.mask.width = GRID_W; this.mask.height = GRID_H;
    this.lines = document.createElement('canvas'); this.lines.width = GRID_W; this.lines.height = GRID_H;
    this.starsC = document.createElement('canvas');
    this.gridVersion = -1;
    this.artLevel = -1;
    this.t = 0;
  }

  resize(availW, availH) {
    const cs = Math.max(2, Math.floor(Math.min(availW / GRID_W, availH / GRID_H) * 4) / 4);
    this.cs = cs;
    const w = Math.round(cs * GRID_W), h = Math.round(cs * GRID_H);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.art.width = this.comp.width = this.canvas.width;
    this.art.height = this.comp.height = this.canvas.height;
    this.starsC.width = this.canvas.width; this.starsC.height = this.canvas.height;
    this.artLevel = -1;
    this.makeStars();
    this.stickCanvas.width = Math.round(window.innerWidth * this.dpr);
    this.stickCanvas.height = Math.round(window.innerHeight * this.dpr);
    this.stickCanvas.style.width = window.innerWidth + 'px';
    this.stickCanvas.style.height = window.innerHeight + 'px';
  }

  makeStars() {
    const c = this.starsC.getContext('2d');
    c.fillStyle = '#04060d'; c.fillRect(0, 0, this.starsC.width, this.starsC.height);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(120,160,255,${0.15 + Math.random() * 0.35})`;
      c.fillRect(Math.random() * this.starsC.width, Math.random() * this.starsC.height, 2, 2);
    }
  }

  ensureArt(def) {
    if (this.artLevel === def.index) return;
    this.artLevel = def.index;
    const c = this.art.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawLevelArt(c, this.art.width, this.art.height, def);
  }

  rebuildMask(grid) {
    const m = this.mask.getContext('2d');
    const l = this.lines.getContext('2d');
    const img = m.createImageData(GRID_W, GRID_H);
    const limg = l.createImageData(GRID_W, GRID_H);
    const d = img.data, ld = limg.data;
    for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
      const i = y * GRID_W + x, v = grid.cells[i], o = i * 4;
      if (v === CELL.CLAIMED || v === CELL.BLOCK) { d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = 255; }
      if (v === CELL.CLAIMED && grid.hasEmptyNeighbour8(x, y)) { ld[o] = 120; ld[o + 1] = 230; ld[o + 2] = 255; ld[o + 3] = 255; }
      else if (v === CELL.TRAIL) { ld[o] = 255; ld[o + 1] = 90; ld[o + 2] = 140; ld[o + 3] = 255; }
    }
    m.putImageData(img, 0, 0);
    l.putImageData(limg, 0, 0);
  }

  setTrailPixel(x, y) {
    const l = this.lines.getContext('2d');
    l.fillStyle = '#ff5a8c'; l.fillRect(x, y, 1, 1);
  }

  // --- ana çizim ---
  draw(game, input) {
    const ctx = this.ctx, g = game.grid, S = this.cs * this.dpr;
    this.t += 1 / 60;
    if (!game.def) return;
    this.ensureArt(game.def);
    if (this.gridVersion !== game.gridVersion) { this.rebuildMask(g); this.gridVersion = game.gridVersion; }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (game.shake > 0) { const k = game.shake * 6 * this.dpr; ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }

    // 1) boş alan: uzay
    ctx.drawImage(this.starsC, 0, 0);
    // 2) ele geçirilmiş alan: bölüm sanatı maske ile
    const cc = this.comp.getContext('2d');
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalCompositeOperation = 'source-over';
    cc.clearRect(0, 0, this.comp.width, this.comp.height);
    cc.drawImage(this.art, 0, 0);
    cc.globalCompositeOperation = 'destination-in';
    cc.imageSmoothingEnabled = false;
    cc.drawImage(this.mask, 0, 0, this.comp.width, this.comp.height);
    ctx.drawImage(this.comp, 0, 0);
    // 3) kenar çizgileri ve hat
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.lines, 0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = true;

    // 4) kutular
    for (const b of g.blocks) this.drawBlock(ctx, b, S);
    // 5) fitil
    if (game.fuse.active && game.player.drawing) {
      const i = Math.min(game.player.trail.length - 1, Math.floor(game.fuse.idx));
      const c = game.player.trail[i];
      if (c) {
        const x = (c[0] + 0.5) * S, y = (c[1] + 0.5) * S;
        ctx.fillStyle = `rgba(255,240,150,${0.6 + 0.4 * Math.sin(this.t * 40)})`;
        ctx.beginPath(); ctx.arc(x, y, S * 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, S * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 6) düşmanlar
    const frozen = game.powers.T > 0;
    for (const s of game.smalls) if (s.alive) this.drawSmall(ctx, s, S, frozen);
    if (game.boss.alive) this.drawBoss(ctx, game.boss, S, frozen, game.def);
    for (const sh of game.shots) {
      ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(sh.x * S, sh.y * S, S * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sh.x * S, sh.y * S, S * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    for (const be of game.beams) {
      const len = S * 3.5, a = Math.atan2(be.vy, be.vx);
      ctx.strokeStyle = be.dmg > 1 ? '#fff' : '#ff5d8f'; ctx.lineWidth = S * (be.dmg > 1 ? 1.2 : 0.7); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(be.x * S, be.y * S); ctx.lineTo(be.x * S - Math.cos(a) * len, be.y * S - Math.sin(a) * len); ctx.stroke();
    }
    // 7) oyuncu
    if (game.state !== STATE.DYING) this.drawPlayer(ctx, game, S);
    // 8) parçacıklar & yazılar
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.fillRect(p.x * S - p.size * S / 2, p.y * S - p.size * S / 2, p.size * S, p.size * S);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of game.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 0.3);
      ctx.font = `bold ${Math.round(S * 3.2)}px "Segoe UI", system-ui, sans-serif`;
      ctx.lineWidth = S * 0.8; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(t.text, t.x * S, t.y * S); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x * S, t.y * S);
    }
    ctx.globalAlpha = 1;
    // donma efekti
    if (frozen) { ctx.fillStyle = `rgba(93,228,255,${0.08 + 0.04 * Math.sin(this.t * 10)})`; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }

    this.drawStick(input);
  }

  drawBlock(ctx, b, S) {
    const x = b.x * S, y = b.y * S, w = b.size * S;
    const grad = ctx.createLinearGradient(x, y, x + w, y + w);
    if (b.captured) { grad.addColorStop(0, '#3a4660'); grad.addColorStop(1, '#1a2030'); }
    else { grad.addColorStop(0, '#b8c2d6'); grad.addColorStop(1, '#5a6478'); }
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, w);
    ctx.strokeStyle = b.captured ? '#5de4ff' : '#eef2ff'; ctx.lineWidth = Math.max(1, S * 0.25); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, w - 1);
    ctx.fillStyle = b.captured ? (POWERUPS[b.letter]?.color || '#fff') : '#1a2030';
    ctx.font = `bold ${Math.round(w * 0.6)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.captured ? b.letter : '?', x + w / 2, y + w / 2 + w * 0.03);
  }

  drawPlayer(ctx, game, S) {
    const p = game.player;
    const x = (p.x + 0.5) * S, y = (p.y + 0.5) * S;
    const blink = p.invuln > 0 && Math.floor(this.t * 12) % 2 === 0;
    if (blink) return;
    const [dx, dy] = DIR_VEC[p.face] || [0, -1];
    const a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
    // parlama
    ctx.shadowColor = p.drawing ? '#ff5d8f' : '#5de4ff'; ctx.shadowBlur = S * 2;
    ctx.fillStyle = p.drawing ? '#ffd1df' : '#d8f7ff';
    ctx.beginPath(); ctx.moveTo(0, -S * 1.6); ctx.lineTo(S * 1.2, S * 1.2); ctx.lineTo(0, S * 0.6); ctx.lineTo(-S * 1.2, S * 1.2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.drawing ? '#ff5d8f' : '#5de4ff'; ctx.beginPath(); ctx.arc(0, 0, S * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (game.shield) { ctx.strokeStyle = `rgba(155,255,138,${0.5 + 0.3 * Math.sin(this.t * 8)})`; ctx.lineWidth = S * 0.4; ctx.beginPath(); ctx.arc(x, y, S * 2.4, 0, Math.PI * 2); ctx.stroke(); }
  }

  drawSmall(ctx, s, S, frozen) {
    const x = s.x * S, y = s.y * S, r = S * 1.1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(frozen ? 0 : s.spin);
    ctx.fillStyle = frozen ? '#9fdcff' : '#ff8a5d';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r : r * 0.5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a0a00'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawBoss(ctx, b, S, frozen, def) {
    const x = b.x * S, y = b.y * S, r = b.r * S;
    const hue = (def.hue + 180) % 360;
    const flash = b.hitFlash > 0;
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = `hsl(${hue},90%,60%)`; ctx.shadowBlur = S * 3;
    if (b.type === 'amoeba') {
      ctx.fillStyle = flash ? '#fff' : (frozen ? '#9fdcff' : `hsl(${hue},80%,55%)`);
      ctx.beginPath();
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const rr = r * (1 + 0.14 * Math.sin(a * 5 + b.angle * 3) + 0.06 * Math.sin(a * 9 - b.angle * 5));
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    } else if (b.type === 'crystal') {
      ctx.rotate(b.angle * 0.7);
      ctx.fillStyle = flash ? '#fff' : (frozen ? '#9fdcff' : `hsl(${hue},85%,60%)`);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = `hsla(${hue},90%,85%,0.6)`; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.5; ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.rotate(-b.angle);
      ctx.fillStyle = flash ? '#fff' : (frozen ? '#9fdcff' : `hsl(${hue},85%,55%)`);
      ctx.beginPath();
      for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, rr = i % 2 ? r : r * 0.62; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // göz
    ctx.fillStyle = '#0a0a14'; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#ff3b3b'; ctx.beginPath(); ctx.arc(r * 0.1 * Math.cos(b.angle), r * 0.1 * Math.sin(b.angle), r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // can çubuğu
    if (b.hp < b.maxHp) {
      const w = r * 2.4, h = S * 0.8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2, y - r - h * 2.2, w, h);
      ctx.fillStyle = '#ff5d8f'; ctx.fillRect(x - w / 2, y - r - h * 2.2, w * (b.hp / b.maxHp), h);
    }
  }

  drawStick(input) {
    const c = this.sctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.stickCanvas.width, this.stickCanvas.height);
    if (!input.visible || !input.anchor) return;
    const a = input.anchor, p = input.pos || a;
    c.strokeStyle = 'rgba(93,228,255,0.45)'; c.lineWidth = 2;
    c.beginPath(); c.arc(a.x, a.y, 44, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(93,228,255,0.1)'; c.fill();
    let dx = p.x - a.x, dy = p.y - a.y; const d = Math.hypot(dx, dy);
    if (d > 44) { dx *= 44 / d; dy *= 44 / d; }
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(a.x + dx, a.y + dy, 18, 0, Math.PI * 2); c.fill();
  }
}
