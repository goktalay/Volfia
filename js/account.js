// VOLFAI - hesap ve profil saklama
// Misafir: yalnız localStorage. Mastertool hesabı: giriş + sunucuyla eşitleme (API_BASE tanımlıysa).
import { MASTERTOOL } from './config.js';
import { normalizeProfile, mergeProfiles, emptyProfile } from './profile.js';

const LS_SESSION = 'volfai.session';          // {token, user:{id,name}}
const lsKey = uid => `volfai.profile.${uid || 'guest'}`;

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* özel mod */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } }

export class Account {
  constructor() {
    this.session = lsGet(LS_SESSION);        // null = misafir
    this.profile = normalizeProfile(lsGet(lsKey(this.uid)));
    this.syncState = 'idle';                  // idle | syncing | error | ok
    this.listeners = new Set();
    this._saveTimer = null;
  }
  get uid() { return this.session?.user?.id || null; }
  get user() { return this.session?.user || null; }
  get isLoggedIn() { return !!this.session; }
  get hasApi() { return !!MASTERTOOL.API_BASE; }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(this); }

  /** Profili yerel olarak kaydet; girişliyse sunucuya da (gecikmeli) gönder. */
  save(immediate = false) {
    this.profile.updatedAt = Date.now();
    lsSet(lsKey(this.uid), this.profile);
    if (this.isLoggedIn && this.hasApi) {
      clearTimeout(this._saveTimer);
      if (immediate) this.pushProfile();
      else this._saveTimer = setTimeout(() => this.pushProfile(), 1500);
    }
    this.emit();
  }

  async api(path, { method = 'GET', body = null, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.session?.token) headers['Authorization'] = `Bearer ${this.session.token}`;
    const res = await fetch(MASTERTOOL.API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'omit' });
    const text = await res.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) { const err = new Error(data?.message || data?.error || `HTTP ${res.status}`); err.status = res.status; err.data = data; throw err; }
    return data;
  }

  /** Mastertool kullanıcı adı/e-posta + parola ile giriş. Beklenen yanıt: {token, user:{id,name}} */
  async login(identifier, password) {
    if (!this.hasApi) throw new Error('Hesap sunucusu henüz yapılandırılmadı.');
    const data = await this.api('/login', { method: 'POST', auth: false, body: { identifier, password } });
    if (!data?.token || !data?.user?.id) throw new Error('Sunucu beklenmeyen yanıt verdi.');
    const guestProfile = this.profile;            // misafir ilerlemesini hesaba taşı
    this.session = { token: data.token, user: { id: String(data.user.id), name: data.user.name || data.user.username || identifier } };
    lsSet(LS_SESSION, this.session);
    const local = normalizeProfile(lsGet(lsKey(this.uid)));
    this.profile = mergeProfiles(local, guestProfile);
    await this.pullProfile();
    this.save(true);
    return this.user;
  }

  /** Oturum token'ı ile giriş (Mastertool uygulaması oyunu ?token=... ile açarsa). */
  async loginWithToken(token) {
    if (!this.hasApi) return false;
    this.session = { token, user: { id: 'pending', name: '' } };
    const me = await this.api('/me');
    if (!me?.id) { this.session = null; return false; }
    this.session.user = { id: String(me.id), name: me.name || me.username || 'Oyuncu' };
    lsSet(LS_SESSION, this.session);
    this.profile = normalizeProfile(lsGet(lsKey(this.uid)));
    await this.pullProfile();
    this.save(true);
    return true;
  }

  logout() {
    this.session = null; lsDel(LS_SESSION);
    this.profile = normalizeProfile(lsGet(lsKey(null)));
    this.emit();
  }

  async pullProfile() {
    if (!this.isLoggedIn || !this.hasApi) return;
    this.syncState = 'syncing'; this.emit();
    try {
      const data = await this.api('/profile');
      if (data?.profile) this.profile = mergeProfiles(this.profile, data.profile);
      this.syncState = 'ok';
    } catch (e) {
      this.syncState = e.status === 401 ? 'expired' : 'error';
      if (e.status === 401) this.logout();
    }
    this.emit();
  }

  async pushProfile() {
    if (!this.isLoggedIn || !this.hasApi) return;
    this.syncState = 'syncing'; this.emit();
    try { await this.api('/profile', { method: 'PUT', body: { profile: this.profile } }); this.syncState = 'ok'; }
    catch (e) { this.syncState = e.status === 401 ? 'expired' : 'error'; if (e.status === 401) this.logout(); }
    this.emit();
  }

  resetProgress() {
    const s = this.profile.settings;
    this.profile = emptyProfile(); this.profile.settings = s;
    this.save(true);
  }
}
