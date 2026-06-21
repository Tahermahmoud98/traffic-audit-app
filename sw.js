const CACHE_NAME = 'traffic-app-v1';

// Install Event
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// Fetch Event - network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
