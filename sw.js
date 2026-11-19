// Offline shell for the countdown. Songs are cached as they are played, so the app opens and the
// countdown keeps working with no connection, and music survives once heard.
const SHELL_CACHE = 'xmas-shell-v1';
const AUDIO_CACHE = 'xmas-audio-v1';
const SHELL = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'uploads/santa-christmas-spirit.gif',
  'uploads/santa-happy-christmas.gif',
  'uploads/santa-merry-christmas.gif',
  'uploads/santa-party-time.gif',
  'uploads/santa-jonas-christmas.gif',
  'uploads/santa-jazz-holiday.gif',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('index.html', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('index.html')),
    );
    return;
  }

  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(request).then((hit) => hit || fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone()).catch(() => {});
          return response;
        })),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
      return response;
    })),
  );
});
