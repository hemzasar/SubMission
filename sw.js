/*
  Service worker : il garde une copie des fichiers sur le téléphone
  pour que l'app marche même sans réseau au club.
  Si tu modifies l'app, change le numéro de version ci-dessous.
*/
const CACHE = 'submission-v6';
const FICHIERS = [
  './', 'index.html', 'style.css', 'pictos.js', 'app.js', 'missions.json', 'manifest.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// Réseau d'abord (pour avoir la dernière version), copie locale si pas de réseau
// ou si le réseau met plus de 3 secondes à répondre.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(new Promise((resolve) => {
    let fini = false;
    const repondre = (r) => { if (!fini && r) { fini = true; resolve(r); } };
    const depuisCache = () => caches.match(req, { ignoreSearch: true })
      .then((r) => r || caches.match('./'));
    const minuteur = setTimeout(() => depuisCache().then(repondre), 3000);
    fetch(req).then((res) => {
      clearTimeout(minuteur);
      if (res.ok) { const copie = res.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
      repondre(res);
    }).catch(() => {
      clearTimeout(minuteur);
      depuisCache().then((r) => { if (!fini) { fini = true; resolve(r || Response.error()); } });
    });
  }));
});
