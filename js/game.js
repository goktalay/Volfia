// VOLFIA - oyun durumu ve güncelleme mantığı
import { GRID_W, GRID_H, CELL, CLEAR_PERCENT, BASE_PLAYER_SPEED, SPEED_BOOST_MULT, FUSE_SPEED_RATIO, LIVES_START, POWERUPS, SCORE } from './config.js';
import { Grid } from './grid.js';
import { levelDef, mulberry32 } from './levels.js';
import { DIR, DIR_VEC } from './input.js';

export const STATE = { TITLE: 'title', INTRO: 'intro', PLAY: 'play', DYING: 'dying', CLEAR: 'clear', GAMEOVER: 'gameover', PAUSE: 'pause' };

export class Game {
  constructor(sfx, storage) {
    this.sfx = sfx;
    this.storage = storage;
    this.grid = new Grid(GRID_W, GRID_H);
    this.state = STATE.TITLE;
    this.hiScore = storage.getHiScore();
    this.events = [];          // render/ui tarafına bildirimler
    this.rng = mulberry32(Date.now() & 0xffff);
    this.levelNo = 1;
    this.score = 0;
    this.lives = LIVES_START;
    this.stateTime = 0;
    this.gridVersion = 0;      // grid değişince artar (maske yenileme)
    this.particles = [];
    this.texts = [];
    this.shake = 0;
  }

  emit(type, data = {}) { this.events.push({ type, ...data }); }

  // ---------------- oyun / bölüm kurulumu ----------------
  newGame() {
    this.score = 0;
    this.lives = LIVES_START;
    this.levelNo = 1;
    this.startLevel(this.levelNo);
  }

  startLevel(n) {
    const def = levelDef(n);
    this.def = def;
    this.levelNo = n;
    this.grid.reset();
    this.rng = mulberry32(n * 1337 + 7);
    this.gridVersion++;
    this.timeLeft = def.time;
    this.hurry = false;
    this.particles = []; this.texts = []; this.shots = []; this.beams = [];
    this.powers = { S: 0, T: 0, L: 0 };
    this.shield = false;
    this.superWeapon = false;
    this.allBlocksBonusGiven = false;
    this.laserCooldown = 0;
    this.bigClaimed = 0;

    // kutular: kenardan uzak, birbirinden ayrık
    for (let i = 0; i < def.blocks; i++) {
      for (let t = 0; t < 60; t++) {
        const size = 4;
        const x = 8 + Math.floor(this.rng() * (GRID_W - 16 - size));
        const y = 10 + Math.floor(this.rng() * (GRID_H - 20 - size));
        let ok = true;
        for (const b of this.grid.blocks) if (Math.abs(b.x - x) < 10 && Math.abs(b.y - y) < 10) ok = false;
        // merkez bölgesi boss için boş kalsın
        if (Math.abs(x - GRID_W / 2) < 10 && Math.abs(y - GRID_H / 2) < 12) ok = false;
        if (ok) { this.grid.addBlock(x, y, size); break; }
      }
    }

    // oyuncu: alt kenar ortası
    this.player = {
      x: GRID_W >> 1, y: GRID_H - 1, dir: DIR.NONE, face: DIR.UP,
      drawing: false, trail: [], start: null, acc: 0, invuln: 2.0, idle: 0,
    };
    // boss
    const a = this.rng() * Math.PI * 2;
    this.boss = {
      x: GRID_W / 2, y: GRID_H / 2, r: def.bossR, type: def.boss,
      vx: Math.cos(a) * def.bossSpeed, vy: Math.sin(a) * def.bossSpeed,
      speed: def.bossSpeed, turnT: 1.5, dashT: 0, shootT: 2 + this.rng() * 3,
      hp: 40 + n * 10, maxHp: 40 + n * 10, hitFlash: 0, angle: 0, alive: true,
    };
    // küçük düşmanlar
    this.smalls = [];
    for (let i = 0; i < def.smalls; i++) {
      const p = this.grid.randomEmptyCell(this.rng, 6);
      if (Math.hypot(p.x - this.boss.x, p.y - this.boss.y) < 12) { i--; continue; }
      const ang = this.rng() * Math.PI * 2;
      this.smalls.push({ x: p.x + 0.5, y: p.y + 0.5, vx: Math.cos(ang) * def.smallSpeed, vy: Math.sin(ang) * def.smallSpeed, speed: def.smallSpeed, alive: true, spin: this.rng() * 6 });
    }
    this.fuse = { active: false, idx: 0 };
    this.setState(STATE.INTRO);
    this.emit('level', { def });
  }

  setState(s) { this.state = s; this.stateTime = 0; this.emit('state', { state: s }); }

  togglePause() {
    if (this.state === STATE.PLAY) this.setState(STATE.PAUSE);
    else if (this.state === STATE.PAUSE) this.setState(STATE.PLAY);
  }

  // ---------------- ana güncelleme ----------------
  update(dt, input) {
    dt = Math.min(dt, 0.05);
    this.stateTime += dt;
    this.updateFx(dt);
    switch (this.state) {
      case STATE.INTRO:
        if (this.stateTime > 2.2) this.setState(STATE.PLAY);
        break;
      case STATE.PLAY:
        this.updatePlay(dt, input);
        break;
      case STATE.DYING:
        if (this.stateTime > 1.3) this.afterDeath();
        break;
      case STATE.CLEAR:
        if (this.stateTime > 3.2) this.startLevel(this.levelNo + 1);
        break;
      default: break;
    }
  }

  updatePlay(dt, input) {
    const p = this.player;
    // zamanlayıcı
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.hurry = true; this.sfx.hurry(); this.emit('hurry'); this.floatText(GRID_W / 2, GRID_H / 2, 'ACELE ET!', '#ff5d5d', 2.2); }
    }
    for (const k of ['S', 'T', 'L']) if (this.powers[k] > 0) { this.powers[k] -= dt; if (this.powers[k] <= 0) { this.powers[k] = 0; if (k === 'L') this.superWeapon = false; this.emit('powers'); } }
    if (p.invuln > 0) p.invuln -= dt;
    if (this.laserCooldown > 0) this.laserCooldown -= dt;

    this.updatePlayer(dt, input);
    if (this.state !== STATE.PLAY) return;
    const frozen = this.powers.T > 0;
    const spd = this.hurry ? 1.6 : 1;
    if (!frozen) {
      this.updateBoss(dt * spd);
      this.updateSmalls(dt * spd);
      this.updateShots(dt * spd);
    }
    this.updateBeams(dt);
    this.updateFuse(dt);
    if ((input.fire || input.keyFire) && this.powers.L > 0 && this.laserCooldown <= 0) this.fireLaser();
  }

  // ---------------- oyuncu ----------------
  playerSpeed() { return BASE_PLAYER_SPEED * (this.powers.S > 0 ? SPEED_BOOST_MULT : 1); }

  updatePlayer(dt, input) {
    const p = this.player;
    const want = input.primary;
    if (want === DIR.NONE) { p.acc = 0; if (p.drawing) p.idle += dt; return; }
    p.acc += this.playerSpeed() * dt;
    let moved = false;
    while (p.acc >= 1) {
      p.acc -= 1;
      if (this.tryStep(input.primary) || (input.secondary && this.tryStep(input.secondary))) { moved = true; if (this.state !== STATE.PLAY) return; }
      else { p.acc = 0; break; }
    }
    if (moved) p.idle = 0; else if (p.drawing) p.idle += dt;
  }

  tryStep(dir) {
    const p = this.player, g = this.grid;
    const [dx, dy] = DIR_VEC[dir];
    const nx = p.x + dx, ny = p.y + dy;
    if (!g.inBounds(nx, ny)) return false;
    const v = g.get(nx, ny);
    if (!p.drawing) {
      if (v === CELL.CLAIMED) {
        if (!g.isWalkableEdge(nx, ny)) return false;
        p.x = nx; p.y = ny; p.face = dir; return true;
      }
      if (v === CELL.EMPTY) {
        // yeni hat başlat
        p.drawing = true; p.start = { x: p.x, y: p.y }; p.trail = [];
        this.fuse.active = false;
        return this.extend(nx, ny, dir);
      }
      return false;
    }
    // çizim halinde
    if (v === CELL.EMPTY) {
      if (!g.canExtendTrail(nx, ny, p.x, p.y)) return false;
      return this.extend(nx, ny, dir);
    }
    if (v === CELL.CLAIMED) { // hattı kapat
      p.x = nx; p.y = ny; p.face = dir;
      this.closeTrail();
      return true;
    }
    return false;
  }

  extend(nx, ny, dir) {
    const p = this.player;
    this.grid.set(nx, ny, CELL.TRAIL);
    p.trail.push([nx, ny]);
    p.x = nx; p.y = ny; p.face = dir;
    this.emit('trail', { x: nx, y: ny });
    // düşman tam o hücredeyse ölüm
    if (this.enemyAtCell(nx, ny)) { this.die(); return true; }
    return true;
  }

  enemyAtCell(x, y) {
    const b = this.boss;
    if (b.alive && Math.hypot(b.x - (x + 0.5), b.y - (y + 0.5)) < b.r + 0.4) return true;
    for (const s of this.smalls) if (s.alive && Math.abs(s.x - (x + 0.5)) < 1 && Math.abs(s.y - (y + 0.5)) < 1) return true;
    return false;
  }

  closeTrail() {
    const p = this.player, g = this.grid;
    const trail = p.trail;
    const seeds = this.boss.alive ? [{ x: this.boss.x, y: this.boss.y }] : [];
    const before = g.claimedInterior;
    const res = g.closeTrail(trail, seeds);
    p.drawing = false; p.trail = []; p.idle = 0;
    this.fuse.active = false;
    this.gridVersion++;

    // içeride kalan küçük düşmanlar ölür
    let chain = 0;
    for (const s of this.smalls) {
      if (!s.alive) continue;
      const cx = Math.floor(s.x), cy = Math.floor(s.y);
      if (res.filledRegion[g.idx(cx, cy)] || !g.isEmpty(cx, cy)) {
        s.alive = false; chain++;
        const pts = SCORE.SMALL_ENEMY * Math.pow(2, chain - 1);
        this.addScore(pts); this.floatText(s.x, s.y, `${pts}`, '#ffd23f');
        this.burst(s.x, s.y, '#ff8a5d', 14);
        this.sfx.enemyDie();
      }
    }
    // içeride kalan mermiler
    this.shots = this.shots.filter(sh => g.isEmpty(Math.floor(sh.x), Math.floor(sh.y)));

    const frac = res.claimedCells / Math.max(1, g.interiorTotal);
    let pts = res.claimedCells * SCORE.PER_CELL;
    const big = frac >= SCORE.BIG_AREA_THRESHOLD;
    if (big) { pts *= SCORE.BIG_AREA_MULT; this.floatText(p.x, p.y - 4, 'BÜYÜK ALAN x2!', '#5de4ff', 1.6); this.shake = 0.3; }
    this.addScore(pts);
    this.sfx.claim(big);
    this.emit('percent');

    // kutu yakalandı → güçlendirme
    for (const b of res.newlyCaptured) this.grantPower(b);
    if (g.blocks.length && g.blocks.every(b => b.captured) && !this.allBlocksBonusGiven) {
      this.allBlocksBonusGiven = true;
      this.addScore(SCORE.ALL_BLOCKS);
      this.superWeapon = true; this.powers.L = 20;
      this.floatText(GRID_W / 2, GRID_H / 2, 'SÜPER SİLAH!', '#ff5d8f', 2.4);
      this.sfx.power(); this.emit('powers');
    }

    if (g.percent() >= CLEAR_PERCENT) this.levelClear(false);
  }

  grantPower(block) {
    const keys = Object.keys(POWERUPS);
    let total = keys.reduce((a, k) => a + POWERUPS[k].weight, 0);
    let r = this.rng() * total, pick = 'B';
    for (const k of keys) { r -= POWERUPS[k].weight; if (r <= 0) { pick = k; break; } }
    block.letter = pick;
    const cx = block.x + block.size / 2, cy = block.y + block.size / 2;
    const pu = POWERUPS[pick];
    switch (pick) {
      case 'S': case 'T': case 'L': this.powers[pick] = Math.max(this.powers[pick], pu.duration); break;
      case 'P': this.shield = true; break;
      case 'E': this.lives++; this.emit('lives'); break;
      case 'B': this.addScore(SCORE.BONUS_BOX); break;
    }
    this.floatText(cx, cy - 3, pu.name, pu.color, 1.8);
    this.burst(cx, cy, pu.color, 20);
    this.sfx.power();
    this.emit('powers');
  }

  // ---------------- boss ----------------
  bossCollides(x, y, r) {
    const g = this.grid;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const cx = Math.floor(x + Math.cos(a) * r), cy = Math.floor(y + Math.sin(a) * r);
      const v = g.get(cx, cy);
      if (v !== CELL.EMPTY) return { cx, cy, v };
    }
    return null;
  }

  updateBoss(dt) {
    const b = this.boss; if (!b.alive) return;
    b.angle += dt * 1.5;
    if (b.hitFlash > 0) b.hitFlash -= dt;
    b.turnT -= dt;
    if (b.turnT <= 0) {
      b.turnT = 0.8 + this.rng() * 2.2;
      const ang = Math.atan2(b.vy, b.vx) + (this.rng() - 0.5) * 2.4;
      const sp = b.speed * (b.dashT > 0 ? 2 : 1);
      b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
      if (this.rng() < 0.25) { b.dashT = 0.6; b.vx *= 2; b.vy *= 2; }
    }
    if (b.dashT > 0) { b.dashT -= dt; if (b.dashT <= 0) { const k = 0.5; b.vx *= k; b.vy *= k; } }

    // eksen eksen hareket + sekme
    let nx = b.x + b.vx * dt;
    let hit = this.bossCollides(nx, b.y, b.r);
    if (hit) { b.vx = -b.vx; nx = b.x; this.onBossTouch(hit); }
    b.x = nx;
    let ny = b.y + b.vy * dt;
    hit = this.bossCollides(b.x, ny, b.r);
    if (hit) { b.vy = -b.vy; ny = b.y; this.onBossTouch(hit); }
    b.y = ny;
    // sıkışma güvenliği
    b.x = Math.max(b.r + 1, Math.min(GRID_W - 1 - b.r, b.x));
    b.y = Math.max(b.r + 1, Math.min(GRID_H - 1 - b.r, b.y));

    // ateş
    if (this.def.shoot > 0) {
      b.shootT -= dt;
      if (b.shootT <= 0) {
        b.shootT = (1.2 + this.rng() * 2.5) / this.def.shoot;
        const p = this.player;
        const ang = Math.atan2((p.y + 0.5) - b.y, (p.x + 0.5) - b.x) + (this.rng() - 0.5) * 0.3;
        const sp = 22 + this.levelNo * 1.2;
        this.shots.push({ x: b.x + Math.cos(ang) * (b.r + 0.5), y: b.y + Math.sin(ang) * (b.r + 0.5), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 6 });
      }
    }
    // oyuncuya temas (çizim halindeyse)
    const p = this.player;
    if (p.drawing && Math.hypot(b.x - (p.x + 0.5), b.y - (p.y + 0.5)) < b.r + 0.6) this.die();
  }

  onBossTouch(hit) {
    if (hit.v === CELL.TRAIL) this.igniteFuse(hit.cx, hit.cy);
  }

  // ---------------- küçük düşmanlar ----------------
  updateSmalls(dt) {
    const g = this.grid, p = this.player;
    for (const s of this.smalls) {
      if (!s.alive) continue;
      s.spin += dt * 6;
      let nx = s.x + s.vx * dt;
      let v = g.get(Math.floor(nx), Math.floor(s.y));
      if (v !== CELL.EMPTY) { if (v === CELL.TRAIL) this.igniteFuse(Math.floor(nx), Math.floor(s.y)); s.vx = -s.vx; nx = s.x; }
      s.x = nx;
      let ny = s.y + s.vy * dt;
      v = g.get(Math.floor(s.x), Math.floor(ny));
      if (v !== CELL.EMPTY) { if (v === CELL.TRAIL) this.igniteFuse(Math.floor(s.x), Math.floor(ny)); s.vy = -s.vy; ny = s.y; }
      s.y = ny;
      // hafif rastgele sapma
      if (this.rng() < dt * 0.4) { const a = Math.atan2(s.vy, s.vx) + (this.rng() - 0.5) * 1.2; s.vx = Math.cos(a) * s.speed; s.vy = Math.sin(a) * s.speed; }
      if (p.drawing && Math.abs(s.x - (p.x + 0.5)) < 1 && Math.abs(s.y - (p.y + 0.5)) < 1) { this.die(); return; }
    }
  }

  // ---------------- boss mermileri ----------------
  updateShots(dt) {
    const g = this.grid, p = this.player;
    for (const sh of this.shots) {
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
      const cx = Math.floor(sh.x), cy = Math.floor(sh.y);
      const v = g.get(cx, cy);
      if (v === CELL.TRAIL) { this.igniteFuse(cx, cy); sh.life = 0; this.burst(sh.x, sh.y, '#ff5d5d', 6); }
      else if (v !== CELL.EMPTY) { sh.life = 0; this.burst(sh.x, sh.y, '#8899aa', 4); }
      if (p.drawing && cx === p.x && cy === p.y) { this.die(); return; }
    }
    this.shots = this.shots.filter(s => s.life > 0);
  }

  // ---------------- fitil ----------------
  igniteFuse(cx, cy) {
    const p = this.player;
    if (!p.drawing) return;
    if (cx === p.x && cy === p.y) { this.die(); return; }
    // o hücrenin hattaki indeksi
    let idx = -1;
    for (let i = p.trail.length - 1; i >= 0; i--) if (p.trail[i][0] === cx && p.trail[i][1] === cy) { idx = i; break; }
    if (idx < 0) return;
    if (!this.fuse.active || idx > this.fuse.idx) { this.fuse.active = true; this.fuse.idx = idx; this.sfx.fuse(); }
  }

  updateFuse(dt) {
    const p = this.player, f = this.fuse;
    if (!p.drawing) { f.active = false; return; }
    // Qix klasiği: çizerken durursan hattın başından fitil yanar
    if (!f.active && p.idle > 0.6 && p.trail.length > 1) { f.active = true; f.idx = 0; this.sfx.fuse(); }
    if (!f.active) return;
    f.idx += this.playerSpeed() * FUSE_SPEED_RATIO * dt;
    if (Math.floor(f.idx) % 4 === 0 && this.rng() < 0.5) { const c = p.trail[Math.min(p.trail.length - 1, Math.floor(f.idx))]; this.spark(c[0] + 0.5, c[1] + 0.5); }
    if (f.idx >= p.trail.length - 1) this.die();
  }

  // ---------------- lazer ----------------
  fireLaser() {
    const p = this.player, b = this.boss;
    this.laserCooldown = this.superWeapon ? 0.12 : 0.2;
    // mobil için otomatik nişan: boss'a doğru
    let ang;
    if (b.alive) ang = Math.atan2(b.y - (p.y + 0.5), b.x - (p.x + 0.5));
    else { const [dx, dy] = DIR_VEC[p.face] || [0, -1]; ang = Math.atan2(dy, dx); }
    const sp = 110;
    this.beams.push({ x: p.x + 0.5, y: p.y + 0.5, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1.5, dmg: this.superWeapon ? 2 : 1, born: true });
    this.sfx.laser();
  }

  updateBeams(dt) {
    const g = this.grid, b = this.boss;
    for (const be of this.beams) {
      const steps = 3;
      for (let k = 0; k < steps && be.life > 0; k++) {
        be.x += be.vx * dt / steps; be.y += be.vy * dt / steps;
        const cx = Math.floor(be.x), cy = Math.floor(be.y);
        const v = g.get(cx, cy);
        if (v === CELL.EMPTY) be.born = false;
        else if (!be.born) { be.life = 0; this.burst(be.x, be.y, '#ff5d8f', 3); break; }
        for (const s of this.smalls) if (s.alive && Math.hypot(s.x - be.x, s.y - be.y) < 1.6) {
          s.alive = false; be.life = 0; this.addScore(SCORE.SMALL_ENEMY); this.floatText(s.x, s.y, `${SCORE.SMALL_ENEMY}`, '#ffd23f'); this.burst(s.x, s.y, '#ff8a5d', 14); this.sfx.enemyDie();
        }
        if (b.alive && Math.hypot(b.x - be.x, b.y - be.y) < b.r + 0.5) {
          be.life = 0; b.hp -= be.dmg; b.hitFlash = 0.12; this.addScore(SCORE.BOSS_HIT); this.sfx.bossHit(); this.burst(be.x, be.y, '#ffffff', 5);
          if (b.hp <= 0) { b.alive = false; this.burst(b.x, b.y, '#ffd23f', 60); this.shake = 0.8; this.levelClear(true); return; }
        }
      }
      be.life -= dt;
    }
    this.beams = this.beams.filter(b => b.life > 0);
  }

  // ---------------- ölüm / bölüm sonu ----------------
  die() {
    const p = this.player;
    if (this.state !== STATE.PLAY || p.invuln > 0) return;
    if (this.shield) {
      this.shield = false; p.invuln = 1.5; this.emit('powers');
      this.floatText(p.x, p.y - 3, 'KALKAN!', '#9bff8a', 1.2); this.burst(p.x + 0.5, p.y + 0.5, '#9bff8a', 24); this.sfx.bossHit();
      return;
    }
    this.burst(p.x + 0.5, p.y + 0.5, '#5de4ff', 40);
    this.shake = 0.6;
    this.sfx.die();
    if (navigator.vibrate) { try { navigator.vibrate([80, 40, 120]); } catch (e) { /* yok say */ } }
    this.setState(STATE.DYING);
  }

  afterDeath() {
    const p = this.player, g = this.grid;
    if (p.drawing) { g.clearTrail(p.trail); p.trail = []; p.drawing = false; }
    this.gridVersion++;
    this.fuse.active = false;
    this.lives--;
    this.emit('lives');
    if (this.lives < 0) { this.gameOver(); return; }
    if (p.start) { p.x = p.start.x; p.y = p.start.y; }
    p.invuln = 2.5; p.idle = 0; p.acc = 0;
    this.shots = [];
    this.setState(STATE.PLAY);
  }

  levelClear(special) {
    const g = this.grid;
    const pct = g.percent();
    const over = Math.max(0, Math.floor(pct) - CLEAR_PERCENT);
    const bonus = {
      special: special ? SCORE.SPECIAL_CLEAR : 0,
      over: over * SCORE.PER_PERCENT_OVER,
      time: Math.floor(this.timeLeft) * SCORE.PER_SECOND_LEFT,
      percent: special ? 100 : pct,
    };
    this.addScore(bonus.special + bonus.over + bonus.time);
    // görsel: tüm alan ortaya çıksın
    if (special) {
      for (let i = 0; i < g.cells.length; i++) if (g.cells[i] === CELL.EMPTY || g.cells[i] === CELL.TRAIL) g.cells[i] = CELL.CLAIMED;
      g.claimedInterior = g.interiorTotal;
    }
    this.player.drawing = false; this.player.trail = [];
    this.gridVersion++;
    this.lastBonus = bonus;
    this.sfx.levelClear();
    this.setState(STATE.CLEAR);
    this.emit('clear', { bonus });
  }

  gameOver() {
    if (this.score > this.hiScore) { this.hiScore = this.score; this.storage.setHiScore(this.score); }
    this.sfx.gameOver();
    this.setState(STATE.GAMEOVER);
  }

  addScore(n) { this.score += n; this.emit('score'); }

  // ---------------- efektler ----------------
  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2, sp = 6 + this.rng() * 22;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + this.rng() * 0.5, max: 0.9, color, size: 0.4 + this.rng() * 0.6 });
    }
  }
  spark(x, y) { this.particles.push({ x, y, vx: (this.rng() - 0.5) * 10, vy: (this.rng() - 0.5) * 10, life: 0.25, max: 0.25, color: '#fff2a0', size: 0.5 }); }
  floatText(x, y, text, color, life = 1.1) { this.texts.push({ x, y, text, color, life, max: life }); }
  updateFx(dt) {
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) { t.y -= dt * 4; t.life -= dt; }
    this.texts = this.texts.filter(t => t.life > 0);
    if (this.shake > 0) this.shake -= dt;
  }
}
