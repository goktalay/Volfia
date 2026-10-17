# VOLFAI

Taito'nun klasik MS-DOS / arcade oyunu **Volfied**'in (Qix'in devamı) modern, dokunmatik
telefonlar için yeniden yapımı. Kurulum gerektirmez: tarayıcıda çalışır, PWA olarak ana
ekrana eklenebilir, çevrimdışı oynanır.

## Oynanış

- **Sürükle:** Parmağını ekranın herhangi bir yerine koyup sürükle, gemi o yöne gider.
- **Hat çiz:** Kenardan boş alana gir. Kenara geri döndüğünde boss'un olmadığı taraf senin olur.
- **%80** alanı ele geçir, bölümü geç. Fazlası bonus puan.
- **Çizerken savunmasızsın.** Düşman hatta değerse fitil yanar; çizerken durursan hattın
  başından fitil yanar. Kenarda güvendesin.
- **Kutuları kuşat:** `S` hız, `T` dondur, `L` lazer, `P` kalkan, `E` ek can, `B` bonus.
- **Lazer** (otomatik nişan, LAZER düğmesi) ile boss'u yok edersen **Özel Bitiriş** ve 50.000 bonus.
- Bölümdeki tüm kutuları kuşatırsan **Süper Silah**.
- Süre bitince düşmanlar hızlanır. 16 farklı bölüm, sonra artan zorlukla döngü.
- Klavye: Ok tuşları / WASD, Boşluk = lazer, P veya Esc = duraklat, Enter = başla.

## Çalıştırma

```bash
npm start          # http://localhost:8080
npm test           # ızgara / alan kapatma birim testleri
```

ES modülleri kullanıldığı için dosya `file://` ile değil, bir HTTP sunucusundan açılmalıdır.
Telefonda denemek için bilgisayar ile aynı Wi-Fi'da `http://<bilgisayar-ip>:8080` adresine girin.

## GitHub Pages

`.github/workflows/pages.yml` her `master` push'unda testleri çalıştırıp siteyi GitHub Pages'e
yayınlar. Depo ayarlarından **Settings → Pages → Source: GitHub Actions** seçilmelidir.

## Yapı

```
index.html            uygulama kabuğu, HUD ve ekranlar
css/style.css         dikey telefon düzeni
js/config.js          sabitler (ızgara, puanlar, güçlendirmeler)
js/grid.js            ızgara, hat, flood-fill ile alan kapatma (saf, test edilebilir)
js/game.js            oyun durumu: oyuncu, boss, küçük düşmanlar, fitil, lazer, bölüm akışı
js/render.js          canvas çizimi (maske ile bölüm sanatı ortaya çıkarma)
js/levels.js          16 bölüm tanımı + prosedürel arka plan sanatı
js/input.js           yüzen dokunmatik joystick + klavye
js/audio.js           WebAudio ile sentezlenmiş sesler
js/storage.js         rekor ve ayarlar (localStorage)
sw.js, manifest.webmanifest, icons/   PWA
test/grid.test.mjs    birim testleri
docs/ARASTIRMA.md     Volfied araştırma notları ve tasarım kararları
```

## Lisans

MIT. Volfied ve Qix, Taito'nun tescilli markalarıdır; bu proje bağımsız bir hayran yapımıdır.
