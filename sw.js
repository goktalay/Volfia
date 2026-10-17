// VOLFAI service worker - çevrimdışı oynanabilsin
const CACHE = 'volfai-v6';
const ASSETS = ['./index.html', './css/style.css', './manifest.webmanifest',
  './js/main.js', './js/game.js', './js/grid.js', './js/render.js', './js/input.js', './js/audio.js', './js/levels.js', './js/config.js', './js/profile.js', './js/account.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
