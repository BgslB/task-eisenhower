const CACHE_NAME = 'task-eisenhower-v1';
const urlsToCache = [
  '/task-eisenhower/',
  '/task-eisenhower/index.html',
  '/task-eisenhower/style.css',
  '/task-eisenhower/app.js',
  '/task-eisenhower/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});