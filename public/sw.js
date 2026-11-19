/* FANCY LEAGUE offline cache — © 2026 Mohsen ~ Danial */
const CACHE = 'fancy-v3.0.1';
const FILES = ['./', './index.html', './config.js', './css/style.css', './js/engine.js', './js/data.js', './js/audio.js', './js/input.js', './js/gl.js', './js/net.js', './js/match.js', './js/main.js', './assets/logo.png', './assets/keyart.jpg', './assets/fl_models.bin', './assets/fl_meta.json', './fonts/ArchivoBlack.woff', './fonts/Montserrat.woff', './icons/icon-192.png', './icons/icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/__') || u.pathname === '/health') return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
