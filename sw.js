const CACHE = 'overload-v2';

const ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './src/main.js', './src/state.js', './src/session.js', './src/render.js',
  './src/savestate.js',
  './src/sheet.js', './src/timer.js', './src/backup.js', './src/storage.js',
  './src/rotation.js', './src/progression.js', './src/swaps.js',
  './src/movements.js', './src/constants.js',
  './src/program.js', './src/howto.js', './src/taxonomy.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  const cached = caches.open(CACHE).then(cache => cache.match(req).then(hit => ({ cache, hit })));

  const fresh = cached.then(({ cache, hit }) =>
    fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined)
      .then(res => {
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      })
      .catch(() => hit || (req.mode === 'navigate' ? cache.match('./index.html') : undefined)));

  e.waitUntil(fresh);
  e.respondWith(cached.then(({ hit }) => hit || fresh));
});
