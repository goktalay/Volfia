# VOLFAI

Taito'nun klasik MS-DOS / arcade oyunu **Volfied**'in (Qix'in devamı) modern, dokunmatik
telefonlar için yeniden yapımı. Kurulum gerektirmez: tarayıcıda çalışır, PWA olarak ana
ekrana eklenebilir, çevrimdışı oynanır.

## Kampanya

- **30 bölüm**, her bölümde **5-10 parkur** (toplam 211). Zorluk sürekli artar; her bölümün
  son parkuru boss parkurudur, 12. bölümden sonra çift boss çıkabilir.
- **Onur puanı:** parkuru bitirmek 10, %80 üstü her yüzde +1 (en fazla 20), Özel Bitiriş +10,
  can kaybetmemek +5. Bir sonraki bölüm için bölümdeki parkur başına 15 onur gerekir; parkurlar
  tekrar oynanarak en iyi sonuç yükseltilebilir.
- **Bölüm seçme ekranı:** kaydırmalı kartlar, her bölümün sanatı, onur çubuğu, parkur ızgarası.
  Oyun her açılışta buradan başlar; otomatik "kaldığın yerden devam" yoktur.
- **HEPCOIN:** parkurda rastgele düşer, hatla üstünden geçince ya da kuşatınca toplanır; parkur
  sonu ve boss ödülleri de verir. Kasada birikir.
- **Hangar:** İyon motoru, kalkan jeneratörü, lazer çekirdeği, yedek güç hücresi, zaman dilatörü,
  coin mıknatısı. Her biri 3 seviye.
- **Koruma halkası:** kenardayken gemiyi saran mavi halka; çizime geçince kaybolur.
- **Hesap:** misafir (yerel) veya Mastertool hesabı. API ayrıntıları `docs/MASTERTOOL_API.md`.

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
js/levels.js          30 bölüm × 5-10 parkur tanımı + prosedürel arka plan sanatı
js/input.js           yüzen dokunmatik joystick + klavye
js/audio.js           WebAudio ile sentezlenmiş sesler
js/profile.js         ilerleme, onur, HEPCOIN, yükseltmeler (saf, test edilebilir)
js/account.js         misafir/Mastertool hesap ve eşitleme
promo/index.html      tanıtım (landing) sayfası
sw.js, manifest.webmanifest, icons/   PWA
test/*.test.mjs       birim testleri (ızgara, profil, bölümler)
docs/ARASTIRMA.md     Volfied araştırma notları ve tasarım kararları
```

## Lisans

MIT. Volfied ve Qix, Taito'nun tescilli markalarıdır; bu proje bağımsız bir hayran yapımıdır.
