// Service worker do Sítio dos Bichos: abre mesmo sem internet (o modo offline do jogo continua funcionando).
const V = 'sitio-v3';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Mesma origem: tenta a rede primeiro (jogo sempre atualizado) e cai para o cache sem internet.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(ch => ch.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./')));
});
