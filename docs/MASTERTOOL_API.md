# VOLFAI ↔ Mastertool Hesap Bütünleşmesi

Oyun saf istemci tarafı (statik HTML/JS) çalışır. Kullanıcı yönetimi Mastertool'daki kayıtla
çalışsın diye oyun, aşağıdaki küçük JSON API'yi bekler. `js/config.js` içindeki
`MASTERTOOL.API_BASE` doldurulunca giriş formu etkinleşir; boşken oyun yalnız yerel misafir
profiliyle çalışır (hiçbir özellik kaybolmaz, ilerleme cihazda kalır).

## Uç noktalar (önerilen)

Temel URL örneği: `https://mastertool.download/api/volfai`

| Yöntem | Yol | Gövde / Başlık | Yanıt |
|---|---|---|---|
| POST | `/login` | `{ "identifier": "kullanıcı adı veya e-posta", "password": "..." }` | `200 { "token": "...", "user": { "id": "123", "name": "Görünen Ad" } }` · `401 { "message": "Hatalı giriş" }` |
| GET | `/me` | `Authorization: Bearer <token>` | `200 { "id": "123", "name": "..." }` · `401` |
| GET | `/profile` | `Authorization: Bearer <token>` | `200 { "profile": { ...oyun profili JSON... } }` (yoksa `{ "profile": null }`) |
| PUT | `/profile` | `Authorization: Bearer <token>`, gövde `{ "profile": { ... } }` | `200 { "ok": true }` |

- Token: opak dize veya JWT; oyun yalnızca `Authorization: Bearer` ile geri gönderir.
- `401` alınca oyun oturumu kapatır ve misafir moduna döner.
- Profil JSON'u oyun tarafından üretilir ve okunur; sunucu **olduğu gibi saklar** (≈2–20 KB,
  `profile.updatedAt` ms zaman damgası). Çakışmada istemci en iyi değerleri birleştirir.
- CORS: oyun `https://www.hepgo.com` (ve ileride mastertool.download) kökeninden çağırır.
  `Access-Control-Allow-Origin` bu kökenlere, `Allow-Headers: Authorization, Content-Type`,
  `Allow-Methods: GET, POST, PUT, OPTIONS` yeterlidir. Çerez kullanılmaz (`credentials: omit`).

## Masaüstü uygulamadan açma (isteğe bağlı)

Mastertool uygulaması oyunu bir WebView'da `index.html?token=<oturum token>` ile açarsa oyun,
`/me` ile doğrulayıp otomatik giriş yapar ve URL'den token'ı temizler.

## Profil JSON şeması (özet)

```json
{
  "v": 1,
  "coins": 0,
  "hiScore": 0,
  "upgrades": { "engine": 0, "shield": 0, "laser": 0, "cells": 0, "time": 0, "magnet": 0 },
  "levels": { "1": { "parkurs": { "1": { "honor": 25, "best": 79230, "special": true, "percent": 100 } } } },
  "settings": { "muted": false, "vibrate": true },
  "stats": { "parkursCleared": 1, "coinsEarned": 24, "bossKills": 1, "deaths": 0 },
  "updatedAt": 1760724000000
}
```

## Oyun içi davranış

- Giriş yapılınca misafir ilerlemesi hesaba taşınır (birleştirme: yüksek olan kazanır).
- Her parkur sonunda ve her satın almada profil yerel olarak kaydedilir ve sunucuya `PUT` edilir.
- Çıkış yapılınca misafir profiline dönülür; hesap verisi cihazda `volfai.profile.<id>` anahtarında kalır.
