// VOLFAI - hesap ve profil saklama
// Misafir: yalnız localStorage. Mastertool hesabı (sözleşme v1):
//   POST /api/vf/auth/prelogin {email} → {kdf:{alg:"PBKDF2-SHA256",iter,salt}}
//   istemcide master = PBKDF2(şifre, salt, iter); auth_hash = b64(PBKDF2(master, şifre, 1))  (şifre sunucuya gitmez)
//   POST /api/vf/auth/login {email, auth_hash, device, app_version, client:"web"} → {token?, user, sync_enabled}
//   Aynı kökende httpOnly çerez kurulur; çerezli POST/PUT'larda "x-sshm: 1" başlığı gerekir.
//   GET/PUT /api/vf/profile → oyun profili JSON'u (sunucu olduğu gibi saklar).
import { MASTERTOOL } from './config.js';
import { normalizeProfile, mergeProfiles, emptyProfile } from './profile.js';

const LS_SESSION = 'volfai.session';          // {token?, user:{id,name}}
const lsKey = uid => `volfai.profile.${uid || 'guest'}`;

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* özel mod */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } }

const utf8 = s => new TextEncoder().encode(s);
const b64enc = bytes => btoa(String.fromCharCode(...bytes));
function b64dec(s) { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
async function pbkdf2(keyBytes, saltBytes, iterations, len = 32) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, len * 8);
  return new Uint8Array(bits);
}
/** Mastertool auth_hash: şifre sunucuya gitmez. */
export async function computeAuthHash(password, kdf) {
  const master = await pbkdf2(utf8(password), b64dec(kdf.salt), kdf.iter, 32);
  const h = await pbkdf2(master, utf8(password), 1, 32);
  return b64enc(h);
}

const ERR_TR = {
  bad_credentials: 'E-posta veya parola hatalı.',
  session_expired: 'Oturum süresi doldu, yeniden giriş yap.',
  unverified: 'E-posta adresin doğrulanmamış. Mastertool\'dan doğrula.',
  suspended: 'Hesap askıya alınmış.',
  app_disabled: 'VOLFAI bu hesapta etkin değil.',
  rate_limited: 'Çok fazla deneme. Biraz bekle.',
  not_found: 'Bu e-posta ile hesap bulunamadı.',
};

export class Account {
  constructor() {
    this.session = lsGet(LS_SESSION);        // null = misafir
    this.profile = normalizeProfile(lsGet(lsKey(this.uid)));
    this.syncState = 'idle';                  // idle | syncing | error | ok | expired
    this.listeners = new Set();
    this._saveTimer = null;
    if (this.isLoggedIn && this.hasApi) this.pullProfile();
  }
  get uid() { return this.session?.user?.id || null; }
  get user() { return this.session?.user || null; }
  get isLoggedIn() { return !!this.session; }
  get hasApi() { return !!MASTERTOOL.API_BASE && typeof crypto !== 'undefined' && !!crypto.subtle; }
  get apiRoot() { return `${MASTERTOOL.API_BASE}/api/${MASTERTOOL.APP_CODE}`; }
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

  async api(path, { method = 'GET', body = null } = {}) {
    const headers = { 'Content-Type': 'application/json', 'x-sshm': '1' };
    if (this.session?.token) headers['Authorization'] = `Bearer ${this.session.token}`;
    const res = await fetch(this.apiRoot + path, { method, headers, body: body ? JSON.stringify(body) : null, credentials: 'include' });
    const text = await res.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) {
      const code = data?.code || (res.status === 401 ? 'session_expired' : '');
      const err = new Error(ERR_TR[code] || data?.message || `Sunucu hatası (${res.status})`);
      err.status = res.status; err.code = code; err.data = data; throw err;
    }
    return data;
  }

  /** Mastertool e-posta + parola ile giriş. */
  async login(email, password) {
    if (!this.hasApi) throw new Error('Hesap sunucusu bu adreste etkin değil. Oyunu mastertool.download üzerinden aç.');
    email = String(email || '').trim().toLowerCase();
    const pre = await this.api('/auth/prelogin', { method: 'POST', body: { email } });
    if (!pre?.kdf?.salt) throw new Error('Sunucu beklenmeyen yanıt verdi (kdf yok).');
    const auth_hash = await computeAuthHash(password, pre.kdf);
    const data = await this.api('/auth/login', { method: 'POST', body: { email, auth_hash, device: deviceName(), app_version: MASTERTOOL.APP_VERSION, client: 'web' } });
    if (!data?.user) throw new Error('Sunucu beklenmeyen yanıt verdi (user yok).');
    const guestProfile = this.profile;            // misafir ilerlemesini hesaba taşı
    const u = data.user;
    this.session = { token: data.token || null, user: { id: String(u.id ?? u.email ?? email), name: u.name || u.display_name || u.username || email.split('@')[0] } };
    lsSet(LS_SESSION, this.session);
    const local = normalizeProfile(lsGet(lsKey(this.uid)));
    this.profile = mergeProfiles(local, guestProfile);
    await this.pullProfile();
    this.save(true);
    return this.user;
  }

  async logout() {
    if (this.hasApi) { try { await this.api('/auth/logout', { method: 'POST', body: {} }); } catch (e) { /* yok say */ } }
    this.session = null; lsDel(LS_SESSION);
    this.profile = normalizeProfile(lsGet(lsKey(null)));
    this.syncState = 'idle';
    this.emit();
  }

  async pullProfile() {
    if (!this.isLoggedIn || !this.hasApi) return;
    this.syncState = 'syncing'; this.emit();
    try {
      const data = await this.api('/profile');
      if (data?.user?.name) this.session.user.name = data.user.name;
      if (data?.profile) this.profile = mergeProfiles(this.profile, data.profile);
      this.syncState = 'ok';
    } catch (e) {
      this.syncState = e.status === 401 ? 'expired' : 'error';
      if (e.status === 401) { this.session = null; lsDel(LS_SESSION); this.profile = normalizeProfile(lsGet(lsKey(null))); }
    }
    this.emit();
  }

  async pushProfile() {
    if (!this.isLoggedIn || !this.hasApi) return;
    this.syncState = 'syncing'; this.emit();
    try { await this.api('/profile', { method: 'PUT', body: { profile: this.profile } }); this.syncState = 'ok'; }
    catch (e) { this.syncState = e.status === 401 ? 'expired' : 'error'; }
    this.emit();
  }

  resetProgress() {
    const s = this.profile.settings;
    this.profile = emptyProfile(); this.profile.settings = s;
    this.save(true);
  }
}

function deviceName() {
  const ua = navigator.userAgent || '';
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Web';
  return `VOLFAI Web (${os})`;
}
