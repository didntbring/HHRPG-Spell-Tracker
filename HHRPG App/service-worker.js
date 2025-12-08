// Service Worker for basic caching and offline capability
const CACHE_NAME = 'gemini-app-v1';
const urlsToCache = [
  '/', // The root document (index.html)
  '/manifest.json',
  '/service-worker.js',
  // You would need to add all your bundled JS and CSS assets here
  // For example: '/static/js/main.js', '/static/css/main.css'
];

// Install event: cache all the necessary assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing and Caching Assets');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating and Cleaning Old Caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of unmanaged clients (useful for immediate activation)
  return self.clients.claim();
});

// Fetch event: serve content from cache first, then fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request);
      })
  );
});