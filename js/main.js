// VOLFAI - giriş noktası: döngü, HUD, ekranlar
import { Game, STATE } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { storage } from './storage.js';
import { POWERUPS, CLEAR_PERCENT } from './config.js';

const $ = id => document.getElementById(id);
const sfx = new Sfx();
const game = new Game(sfx, storage);
const renderer = new Renderer($('game'), $('stick'));
const input = new Input(document.body, $('btn-fire'));
window.__volfai = { game, input, renderer }; // hata ayıklama / otomatik test

const screens = { title: $('screen-title'), intro: $('screen-intro'), clear: $('screen-clear'), pause: $('screen-pause'), over: $('screen-over') };
function showScreen(name) { for (const k in screens) screens[k].classList.toggle('hidden', k !== name); }

// --- ses başlatma (ilk dokunuşta) ---
input.onAny = () => { sfx.init(); sfx.resume(); };
sfx.setMuted(storage.getMuted());
$('btn-mute').classList.toggle('off', storage.getMuted());

// --- boyutlandırma ---
function layout() {
  const field = $('field');
  const r = field.getBoundingClientRect();
  renderer.resize(r.width - 8, r.height - 8);
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 200));
layout();

// --- HUD ---
const fmt = n => n.toLocaleString('tr-TR');
function updateHud() {
  $('score').textContent = fmt(game.score);
  $('hiscore').textContent = fmt(Math.max(game.hiScore, game.score));
  const pct = Math.floor(game.grid.percent());
  const pe = $('percent');
  pe.innerHTML = `${pct}<small>%</small>`;
  pe.classList.toggle('done', pct >= CLEAR_PERCENT);
  $('lives').textContent = '▲'.repeat(Math.max(0, game.lives));
  const t = Math.ceil(game.timeLeft || 0);
  const te = $('timer'); te.textContent = t; te.classList.toggle('hurry', !!game.hurry);
  if (game.def) $('levelname').textContent = `${game.def.index}. ${game.def.name}`;
  // güçlendirmeler
  const pw = $('powers'); let html = '';
  for (const k of ['S', 'T', 'L']) if (game.powers[k] > 0) {
    const d = POWERUPS[k].duration; const frac = Math.min(1, game.powers[k] / (game.superWeapon && k === 'L' ? 20 : d));
    html += `<span class="power" style="color:${POWERUPS[k].color}">${k} ${POWERUPS[k].name}<span class="bar"><i style="width:${frac * 100}%"></i></span></span>`;
  }
  if (game.shield) html += `<span class="power" style="color:${POWERUPS.P.color}">P KALKAN</span>`;
  if (game.superWeapon) html += `<span class="power" style="color:#fff">SÜPER</span>`;
  pw.innerHTML = html;
  $('btn-fire').classList.toggle('hidden', !(game.powers.L > 0 && game.state === STATE.PLAY));
}

// --- oyun olayları ---
function handleEvents() {
  for (const ev of game.events) {
    switch (ev.type) {
      case 'trail': renderer.setTrailPixel(ev.x, ev.y); break;
      case 'level':
        $('intro-no').textContent = ev.def.index; $('intro-name').textContent = ev.def.name; break;
      case 'state':
        if (ev.state === STATE.INTRO) showScreen('intro');
        else if (ev.state === STATE.PLAY) showScreen(null);
        else if (ev.state === STATE.PAUSE) showScreen('pause');
        else if (ev.state === STATE.GAMEOVER) {
          $('over-score').textContent = fmt(game.score);
          $('over-newhi').classList.toggle('hidden', game.score < game.hiScore || game.score === 0);
          $('title-hi').textContent = fmt(game.hiScore);
          showScreen('over');
        }
        break;
      case 'clear': {
        const b = ev.bonus;
        $('clear-title').textContent = b.special ? 'ÖZEL BİTİRİŞ!' : 'BÖLÜM TEMİZLENDİ';
        $('clear-pct').textContent = `${Math.floor(b.percent)}%`;
        $('clear-over').textContent = fmt(b.over);
        $('clear-time').textContent = fmt(b.time);
        $('clear-special-row').classList.toggle('hidden', !b.special);
        $('clear-special').textContent = fmt(b.special);
        showScreen('clear');
        break;
      }
      default: break;
    }
  }
  game.events.length = 0;
}

// --- düğmeler ---
const tap = (el, fn) => { el.addEventListener('click', e => { e.preventDefault(); sfx.init(); sfx.resume(); fn(); }); el.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); sfx.init(); sfx.resume(); fn(); }, { passive: false }); };
tap($('btn-start'), () => game.newGame());
tap($('btn-again'), () => game.newGame());
tap($('btn-menu'), () => { game.setState(STATE.TITLE); showScreen('title'); });
tap($('btn-quit'), () => { game.setState(STATE.TITLE); showScreen('title'); });
tap($('btn-resume'), () => game.togglePause());
tap($('btn-pause'), () => game.togglePause());
tap($('btn-mute'), () => { const m = !sfx.muted; sfx.setMuted(m); storage.setMuted(m); $('btn-mute').classList.toggle('off', m); });
window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') game.togglePause(); if (e.key === 'Enter' && (game.state === STATE.TITLE || game.state === STATE.GAMEOVER)) game.newGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === STATE.PLAY) game.togglePause(); });
// ekranlardaki dokunuşlar joystick'i tetiklemesin
for (const k in screens) screens[k].addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
$('hud').addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
$('title-hi').textContent = fmt(game.hiScore);

// --- döngü ---
let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  if (game.state !== STATE.TITLE) {
    game.update(dt, input);
    handleEvents();
    renderer.draw(game, input);
    updateHud();
  } else {
    renderer.drawStick(input);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- PWA ---
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
