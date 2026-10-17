# VOLFAI ↔ Mastertool Hesap Bütünleşmesi (sözleşme v1)

Oyun saf istemci tarafıdır (statik HTML/JS). Kullanıcı yönetimi Mastertool hesabıyla çalışır.
Mastertool backend'i (Python/FastAPI, mastertool.download) için VOLFAI'ye **`vf` uygulama kodu**
gerekir. Oyun `mastertool.download` altında sunulduğunda (`/oyunlar/volfai/`) API otomatik
etkinleşir ve aynı kökende çerezli web oturumu kullanılır. Başka bir kökende (ör. hepgo.com)
yalnız yerel misafir profili çalışır; hiçbir özellik kaybolmaz.

## Oyunun kullandığı uç noktalar

Temel: `https://mastertool.download/api/vf`

| Yöntem | Yol | İstek | Yanıt |
|---|---|---|---|
| POST | `/auth/prelogin` | `{ "email" }` | `{ "kdf": { "alg": "PBKDF2-SHA256", "iter", "salt" } }` |
| POST | `/auth/login` | `{ "email", "auth_hash", "device": "VOLFAI Web (Android)", "app_version": "0.2.0", "client": "web" }` | `{ "token"?, "user": { "id", "name" }, "sync_enabled" }` + httpOnly çerez |
| POST | `/auth/logout` | `{}` | `{ "ok": true }` |
| GET | `/profile` | çerez (veya `Authorization: Bearer`) | `{ "user": { "id", "name" }, "profile": { ... } \| null }` |
| PUT | `/profile` | `{ "profile": { ... } }` | `{ "ok": true }` |

- `auth_hash` istemcide hesaplanır, parola sunucuya gitmez:
  `master = PBKDF2-SHA256(parola, b64dec(salt), iter, 32)`,
  `auth_hash = b64(PBKDF2-SHA256(key=master, salt=parola_utf8, 1, 32))`.
  Uygulaması `js/account.js` → `computeAuthHash`; `test/auth.test.mjs` Python `hashlib` ile doğrular.
- Çerezli POST/PUT isteklerinde oyun `x-sshm: 1` başlığını gönderir (CSRF).
- Hata biçimi `{ "code", "message", "detail" }`; oyun `bad_credentials, session_expired,
  unverified, suspended, app_disabled, rate_limited` kodlarını Türkçe gösterir. `401` alınca misafir moduna döner.
- Profil JSON'u oyun üretir/okur; sunucu **olduğu gibi saklar** (≈2–20 KB, `updatedAt` ms).
  Çakışmada istemci en iyi değerleri birleştirir (`mergeProfiles`), sürüm kilidi gerekmez.
- CORS gerekmez (aynı köken). Oyun başka kökenden sunulacaksa `Access-Control-Allow-Origin`
  + `Allow-Credentials` + `Allow-Headers: Content-Type, Authorization, x-sshm` gerekir.

## Sunucu tarafından istenenler (Hepgo/Mastertool oturumu)

1. `vf` uygulama kodu: prelogin/login/logout mevcut akışla; lisans gerekmiyorsa `app_disabled` dönmemeli.
2. `GET/PUT /api/vf/profile` (kullanıcı başına tek JSON belge, 64 KB üst sınır yeterli).
3. Oyun dosyalarının `https://mastertool.download/oyunlar/volfai/` altında sunulması
   (depo: goktalay/Volfia, `release/*` dalı; `index.html, manifest.webmanifest, sw.js, css/, js/, icons/`).
4. Tanıtım sayfası: `promo/index.html` + `promo/volfai.css` (CSP uyumlu: satır içi style/script yok)
   → ör. `https://mastertool.download/oyunlar/volfai/tanitim/` veya `/araclar/volfai`.
5. İsteğe bağlı: `GET /api/mt/apps` kataloğuna `group:"games", kind:"web", url:...` kaydı
   (Master Tool masaüstü, `kind:"web"` desteğini ekledikten sonra).

## Profil JSON şeması (özet)

```json
{
  "v": 1, "coins": 0, "hiScore": 0,
  "upgrades": { "engine": 0, "shield": 0, "laser": 0, "cells": 0, "time": 0, "magnet": 0 },
  "levels": { "1": { "parkurs": { "1": { "honor": 25, "best": 79230, "special": true, "percent": 100 } } } },
  "settings": { "muted": false, "vibrate": true },
  "stats": { "parkursCleared": 1, "coinsEarned": 24, "bossKills": 1, "deaths": 0 },
  "updatedAt": 1760724000000
}
```
