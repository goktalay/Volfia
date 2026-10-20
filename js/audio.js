// VOLFAI - WebAudio ile sentezlenmiş retro sesler (harici dosya yok)
export class Sfx {
  constructor() { this.ctx = null; this.muted = false; this.master = null; }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.35; }

  tone({ f = 440, f2 = null, type = 'square', dur = 0.1, vol = 0.5, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2 !== null) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  noise(dur = 0.3, vol = 0.4) {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(this.master); s.start();
  }

  step()     { this.tone({ f: 900, type: 'square', dur: 0.025, vol: 0.06 }); }
  claim(big) { this.tone({ f: 300, f2: 900, type: 'triangle', dur: 0.18, vol: 0.4 }); if (big) this.tone({ f: 600, f2: 1400, type: 'triangle', dur: 0.3, vol: 0.4, delay: 0.1 }); }
  power()    { [523, 659, 784, 1046].forEach((f, i) => this.tone({ f, type: 'square', dur: 0.09, vol: 0.3, delay: i * 0.07 })); }
  enemyDie() { this.tone({ f: 800, f2: 100, type: 'sawtooth', dur: 0.25, vol: 0.3 }); }
  laser()    { this.tone({ f: 1400, f2: 300, type: 'sawtooth', dur: 0.08, vol: 0.2 }); }
  bossHit()  { this.tone({ f: 200, f2: 120, type: 'square', dur: 0.08, vol: 0.3 }); }
  fuse()     { this.tone({ f: 2000, f2: 1500, type: 'square', dur: 0.05, vol: 0.12 }); }
  die()      { this.noise(0.5, 0.5); this.tone({ f: 400, f2: 40, type: 'sawtooth', dur: 0.7, vol: 0.5 }); }
  coin()     { this.tone({ f: 1500, type: 'square', dur: 0.06, vol: 0.2 }); this.tone({ f: 2200, type: 'square', dur: 0.1, vol: 0.2, delay: 0.06 }); }
  buy()      { [660, 880, 1320].forEach((f, i) => this.tone({ f, type: 'triangle', dur: 0.12, vol: 0.3, delay: i * 0.08 })); }
  tap()      { this.tone({ f: 700, type: 'triangle', dur: 0.04, vol: 0.15 }); }
  tick(last)  { this.tone({ f: last ? 1200 : 880, type: 'square', dur: last ? 0.25 : 0.07, vol: 0.35 }); }
  hit()      { this.noise(0.15, 0.35); this.tone({ f: 220, f2: 90, type: 'sawtooth', dur: 0.2, vol: 0.4 }); }
  deflect()  { this.tone({ f: 600, f2: 2400, type: 'sine', dur: 0.15, vol: 0.35 }); this.noise(0.12, 0.25); }
  missile()  { this.tone({ f: 300, f2: 500, type: 'sawtooth', dur: 0.3, vol: 0.15 }); }
  count()    { this.tone({ f: 1000 + Math.random() * 400, type: 'square', dur: 0.03, vol: 0.12 }); }
  cash()     { this.tone({ f: 1800, type: 'square', dur: 0.06, vol: 0.25 }); this.tone({ f: 2600, type: 'square', dur: 0.12, vol: 0.25, delay: 0.06 }); }
  bossDie()  { this.noise(0.8, 0.6); [100, 80, 60].forEach((f, i) => this.tone({ f, f2: 30, type: 'sawtooth', dur: 0.5, vol: 0.5, delay: i * 0.15 })); }
  levelClear() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ f, type: 'triangle', dur: 0.2, vol: 0.4, delay: i * 0.1 })); }
  hurry()    { this.tone({ f: 660, type: 'square', dur: 0.1, vol: 0.3 }); this.tone({ f: 660, type: 'square', dur: 0.1, vol: 0.3, delay: 0.15 }); }
  gameOver() { [440, 415, 392, 349, 330, 262].forEach((f, i) => this.tone({ f, type: 'sawtooth', dur: 0.35, vol: 0.35, delay: i * 0.25 })); }
}

// ---- Arka plan müziği: WebAudio ile sentezlenmiş, döngülü (dış dosya yok, CSP uyumlu) ----
// mood: 'menu' (sakin pad + arpej) | 'play' (bas + arpej + hi-hat) | hurry → tempo artar
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// A minör ilerleme: Am - F - C - G (MIDI kök notaları)
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
export class Music {
  constructor(sfx) {
    this.sfx = sfx; this.enabled = true; this.mood = 'menu'; this.hurry = false;
    this.step = 0; this.nextT = 0; this.timer = null; this.bus = null; this.started = false;
  }
  get ctx() { return this.sfx.ctx; }
  start() {
    if (!this.ctx || this.started) return;
    this.started = true;
    this.bus = this.ctx.createGain(); this.bus.gain.value = this.enabled ? 0.16 : 0;
    this.filter = this.ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 1800;
    this.bus.connect(this.filter); this.filter.connect(this.sfx.master);
    this.nextT = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 90);
  }
  setEnabled(on) { this.enabled = on; if (this.bus) this.bus.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.1); }
  setMood(m) { if (this.mood !== m) { this.mood = m; this.step = 0; } }
  setHurry(h) { this.hurry = h; }
  stepDur() { const bpm = this.mood === 'play' ? (this.hurry ? 160 : 128) : 92; return 60 / bpm / 4; } // 16'lık
  tone(f, t0, dur, type, vol, dest, slide) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.bus); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  hat(t0, vol) {
    const n = Math.floor(this.ctx.sampleRate * 0.04), buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf; const g = this.ctx.createGain(); g.gain.value = vol;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    s.connect(hp); hp.connect(g); g.connect(this.bus); s.start(t0);
  }
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ahead = this.ctx.currentTime + 0.25;
    while (this.nextT < ahead) {
      const sd = this.stepDur(), st = this.step, bar = Math.floor(st / 16) % PROG.length, pos = st % 16;
      const chord = PROG[bar];
      if (this.mood === 'play') {
        // bas: her çeyrekte kök, 8'likte oktav
        if (pos % 4 === 0) this.tone(NOTE(chord[0] - 24), this.nextT, sd * 3.5, 'triangle', 0.5);
        else if (pos % 4 === 2) this.tone(NOTE(chord[0] - 12), this.nextT, sd * 1.5, 'triangle', 0.25);
        // arpej: 16'lık, akor notaları + oktav
        const arp = [chord[0], chord[1], chord[2], chord[1] + 12, chord[2], chord[1], chord[0] + 12, chord[2]][pos % 8];
        this.tone(NOTE(arp), this.nextT, sd * 0.9, 'square', 0.12);
        // hi-hat
        if (pos % 2 === 0) this.hat(this.nextT, pos % 4 === 0 ? 0.08 : 0.04);
        // kick benzeri
        if (pos % 8 === 0) this.tone(120, this.nextT, 0.12, 'sine', 0.6, null, 40);
      } else {
        // menü: yumuşak pad + seyrek arpej
        if (pos === 0) for (const n of chord) this.tone(NOTE(n), this.nextT, sd * 16, 'sine', 0.12);
        if (pos % 4 === 0) this.tone(NOTE(chord[(pos / 4) % 3] + 12), this.nextT, sd * 3, 'triangle', 0.08);
      }
      this.nextT += sd; this.step++;
    }
  }
}
