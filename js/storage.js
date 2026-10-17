// VOLFIA - yerel kayıt (yüksek skor, ayarlar)
const KEY = 'volfia.v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* özel mod */ } }
export const storage = {
  getHiScore() { return load().hiScore || 0; },
  setHiScore(v) { const d = load(); d.hiScore = v; save(d); },
  getMuted() { return !!load().muted; },
  setMuted(m) { const d = load(); d.muted = m; save(d); },
};
