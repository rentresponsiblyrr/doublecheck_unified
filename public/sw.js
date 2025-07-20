/**
 * BLEEDING EDGE: Service Worker Implementation
 * 
 * This file is the actual service worker that gets registered by the browser.
 * It implements bleeding-edge caching strategies and offline functionality.
 */

const SW_VERSION = '1.0.0';
const CACHE_PREFIX = 'str-certified-v';
const OFFLINE_QUEUE_NAME = 'offline-queue';
const MAX_RETRY_ATTEMPTS = 3;

// Cache configurations
const CACHE_STRATEGIES = [
  {
    name: 'app-shell',
    pattern: /\.(html|js|css)$/,
    strategy: 'cacheFirst',
    options: {
      cacheName: `${CACHE_PREFIX}app-shell`,
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    }
  },
  {
    name: 'images',
    pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    strategy: 'cacheFirst',
    options: {
      cacheName: `${CACHE_PREFIX}images`,
      maxEntries: 200,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    }
  },
  {
    name: 'fonts',
    pattern: /\.(woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst',
    options: {
      cacheName: `${CACHE_PREFIX}fonts`,
      maxEntries: 50,
      maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
    }
  },
  {
    name: 'api',
    pattern: /\/api\//,
    strategy: 'staleWhileRevalidate',
    options: {
      cacheName: `${CACHE_PREFIX}api`,
      maxEntries: 100,
      maxAgeSeconds: 5 * 60, // 5 minutes
    }
  }
];

// Install event
self.addEventListener('install', (event) => {
  console.log(`🚀 BLEEDING EDGE: Service Worker v${SW_VERSION} installing`);
  
  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      
      // Precache critical resources
      await precacheCriticalResources();
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log(`✅ BLEEDING EDGE: Service Worker v${SW_VERSION} activated`);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      await cleanupOldCaches();
      
      // Take control of all clients immediately
      await self.clients.claim();
      
      // Initialize background sync
      await initializeBackgroundSync();
    })()
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) return;
  
  // Skip requests to chrome-extension URLs
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(handleFetchWithStrategy(event.request));
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

// Message event
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload.cacheName));
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Cache strategy implementations
async function handleFetchWithStrategy(request) {
  const url = new URL(request.url);
  
  // Find matching cache strategy
  const strategy = CACHE_STRATEGIES.find(s => s.pattern.test(url.href));
  
  if (!strategy) {
    return handleNetworkFirst(request, `${CACHE_PREFIX}default`);
  }
  
  switch (strategy.strategy) {
    case 'networkFirst':
      return handleNetworkFirst(request, strategy.options.cacheName);
      
    case 'cacheFirst':
      return handleCacheFirst(request, strategy.options.cacheName, strategy.options.maxAgeSeconds);
      
    case 'staleWhileRevalidate':
      return handleStaleWhileRevalidate(request, strategy.options.cacheName);
      
    default:
      return handleNetworkFirst(request, strategy.options.cacheName);
  }
}

async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Queue for background sync if it's a mutating request
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await queueOfflineRequest(request);
    }
    
    // Return offline fallback
    return getOfflineFallback(request);
  }
}

async function handleCacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse && maxAge) {
    const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0).getTime();
    const now = Date.now();
    
    if (now - cachedTime > maxAge * 1000) {
      // Cache expired, remove it
      await cache.delete(request);
    } else {
      return cachedResponse;
    }
  } else if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Add timestamp header for cache expiration
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-time': new Date().toISOString()
        }
      });
      
      await cache.put(request, responseWithTimestamp.clone());
      return responseWithTimestamp;
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network and cache failed:', error);
    return getOfflineFallback(request);
  }
}

async function handleStaleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.warn('Background fetch failed:', error);
      return null;
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network response if no cache
  const networkResponse = await networkResponsePromise;
  return networkResponse || getOfflineFallback(request);
}

// Cache management
async function precacheCriticalResources() {
  const cache = await caches.open(`${CACHE_PREFIX}precache`);
  
  const criticalResources = [
    '/',
    '/manifest.json'
  ];
  
  try {
    await cache.addAll(criticalResources);
    console.log('✅ Critical resources precached');
  } catch (error) {
    console.error('❌ Failed to precache critical resources:', error);
  }
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith(CACHE_PREFIX) && !name.includes(SW_VERSION)
  );
  
  await Promise.all(
    oldCaches.map(cacheName => {
      console.log('🗑️ Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    })
  );
}

async function cacheUrls(urls) {
  const cache = await caches.open(`${CACHE_PREFIX}runtime`);
  
  await Promise.allSettled(
    urls.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`Failed to cache ${url}:`, error);
      }
    })
  );
}

async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

// Offline support
async function queueOfflineRequest(request) {
  try {
    const body = await request.text();
    const queueItem = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body || undefined,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Store in IndexedDB for persistence
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_QUEUE_NAME], 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_NAME);
    await store.add(queueItem);
    
    console.log('📥 Queued offline request:', request.url);
    
    // Register for background sync
    if ('serviceWorker' in self && 'sync' in self.registration) {
      await self.registration.sync.register('offline-sync');
    }
  } catch (error) {
    console.error('Failed to queue offline request:', error);
  }
}

async function processOfflineQueue() {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_QUEUE_NAME], 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_NAME);
    const queueItems = await store.getAll();
    
    for (const item of queueItems) {
      try {
        const request = new Request(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        const response = await fetch(request);
        
        if (response.ok) {
          // Success - remove from queue
          await store.delete(item.timestamp);
          console.log('✅ Processed offline request:', item.url);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('Failed to process offline request:', error);
        
        // Increment retry count
        item.retryCount++;
        
        if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Max retries reached - remove from queue
          await store.delete(item.timestamp);
          console.error('❌ Max retries reached for:', item.url);
        } else {
          // Update retry count
          await store.put(item);
        }
      }
    }
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

async function initializeBackgroundSync() {
  if ('serviceWorker' in self && 'sync' in self.registration) {
    try {
      await self.registration.sync.register('offline-sync');
      console.log('✅ Background sync initialized');
    } catch (error) {
      console.warn('Background sync not supported:', error);
    }
  }
}

function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return appropriate offline fallback based on request type
  if (request.mode === 'navigate') {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>STR Certified - Offline</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 margin: 0; padding: 2rem; text-align: center; background: #f5f5f5; }
          .container { max-width: 400px; margin: 2rem auto; padding: 2rem; background: white; 
                      border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { color: #333; margin-bottom: 1rem; }
          p { color: #666; line-height: 1.5; }
          .retry { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; 
                  border-radius: 4px; cursor: pointer; font-size: 1rem; margin-top: 1rem; }
          .retry:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>You're Offline</h1>
          <p>No internet connection detected. Please check your network and try again.</p>
          <button class="retry" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Return JSON error for API requests
  if (url.pathname.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'This request will be retried when you come back online',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Return generic network error
  return new Response('Network Error', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// IndexedDB utilities
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('STRCertifiedOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_NAME)) {
        const store = db.createObjectStore(OFFLINE_QUEUE_NAME, { keyPath: 'timestamp' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('method', 'method', { unique: false });
      }
    };
  });
}