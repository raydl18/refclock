const CACHE = 'refclock-v15';
const ASSETS = [
  '/refclock', '/refclock/index.html', '/refclock/style.css', '/refclock/app.js',
  '/refclock/supabase.js', '/refclock/version.js', '/refclock/manifest.json',
  '/refclock/icons/icon-192.png', '/refclock/icons/icon-512.png',
  '/refclock/fonts/space-grotesk-400.woff2', '/refclock/fonts/space-grotesk-500.woff2',
  '/refclock/fonts/space-grotesk-600.woff2', '/refclock/fonts/space-grotesk-700.woff2',
  '/refclock/fonts/jetbrains-mono-400.woff2', '/refclock/fonts/jetbrains-mono-500.woff2',
  '/refclock/fonts/jetbrains-mono-700.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

let notifIds = [];
self.addEventListener('message', e => {
  if (!e.data || typeof e.data.type !== 'string') return;
  if (e.data.type === 'SCHEDULE_NOTIF') {
    const { delay, title, body, tag } = e.data;
    notifIds.push(setTimeout(() =>
      self.registration.showNotification(title, { body, icon: '/refclock/icons/icon-192.png', tag, silent: false }),
      delay
    ));
  } else if (e.data.type === 'CANCEL_NOTIFS') {
    notifIds.forEach(id => clearTimeout(id));
    notifIds = [];
  }
});
