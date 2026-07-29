const CACHE_NAME = 'traffic-app-v9';
const STATIC_CACHE = 'traffic-static-v9';

// Files to cache on install (local files - always available offline)
const STATIC_FILES = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './logo.svg',
    './manifest.json'
];

// External CDN resources to cache after first load
const CDN_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'www.gstatic.com'  // Firebase
];

// Install Event - pre-cache all static files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(STATIC_FILES);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate Event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - smart caching strategy
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and Firebase database requests (always need fresh data)
    if (event.request.method !== 'GET') return;
    if (url.hostname.includes('firebaseio.com')) return;
    if (url.hostname.includes('firebaseapp.com') && url.pathname.includes('database')) return;

    // For local files: Cache First (fastest)
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        const cloned = response.clone();
                        caches.open(STATIC_CACHE).then(cache => cache.put(event.request, cloned));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // For CDN resources (fonts, FontAwesome, Firebase SDK): Stale While Revalidate
    const isCDN = CDN_HOSTS.some(host => url.hostname.includes(host));
    if (isCDN) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cached => {
                    const networkFetch = fetch(event.request).then(response => {
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(() => cached); // Fallback to cache if network fails

                    // Return cached immediately, update in background
                    return cached || networkFetch;
                });
            })
        );
        return;
    }

    // Default: network first, fallback to cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
