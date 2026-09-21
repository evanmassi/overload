const CACHE = 'overload-v6';

const ASSETS = [
  './', './index.html', './manifest.json', './src/main.js',
  './src/data/constants.js', './src/data/extras.js', './src/data/howto.js', './src/data/muscles.js',
  './src/data/offdays.js', './src/data/program.js', './src/data/taxonomy.js',
  './src/rules/exercises.js', './src/rules/format.js', './src/rules/progression.js', './src/rules/rotation.js',
  './src/rules/sets.js',
  './src/store/backup.js', './src/store/customs.js', './src/store/holds.js', './src/store/session.js',
  './src/store/slots.js', './src/store/state.js', './src/store/storage.js',
  './src/views/app.js', './src/views/controls.js', './src/views/dom.js', './src/views/exerciseCard.js',
  './src/views/history.js', './src/views/log.js', './src/views/progress.js', './src/views/saveBar.js',
  './src/views/saveStatus.js', './src/views/settings.js', './src/views/sound.js', './src/views/timer.js',
  './src/views/sheets/howtoSheet.js', './src/views/sheets/relabelSheet.js', './src/views/sheets/sheet.js',
  './src/views/sheets/swapSheet.js', './src/views/sheets/timerSheet.js',
  './src/ui/button.js', './src/ui/field.js', './src/ui/panel.js',
  './src/ui/button.css', './src/ui/field.css', './src/ui/index.css', './src/ui/panel.css',
  './src/ui/stripe.css', './src/ui/tokens/animations.css', './src/ui/tokens/colors.css',
  './src/ui/tokens/fonts.css', './src/ui/tokens/motion.css', './src/ui/tokens/space.css',
  './src/ui/tokens/typography.css',
  './src/styles/app.css',
  './icons/apple-touch-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
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
