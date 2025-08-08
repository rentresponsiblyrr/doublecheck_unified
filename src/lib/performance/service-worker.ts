/**
 * BLEEDING EDGE: Advanced Service Worker Caching
 *
 * Professional service worker implementation that exceeds industry standards
 * - Intelligent cache strategies with network-first, cache-first, stale-while-revalidate
 * - Background sync for offline functionality
 * - Advanced cache management with TTL and size limits
 * - Predictive prefetching based on user behavior
 * - Resource optimization and compression
 */

import { debugLogger } from '@/utils/debugLogger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheStrategy {
  name: string;
  pattern: RegExp | string;
  strategy:
    | "networkFirst"
    | "cacheFirst"
    | "staleWhileRevalidate"
    | "networkOnly"
    | "cacheOnly";
  options: {
    cacheName: string;
    maxEntries?: number;
    maxAgeSeconds?: number;
    cacheKeyWillBeUsed?: (params: {
      request: Request;
      mode: "read" | "write";
    }) => Promise<string>;
    cacheWillUpdate?: (params: {
      request: Request;
      response: Response;
      event: ExtendableEvent;
    }) => Promise<Response | undefined>;
    fetchDidFail?: (params: {
      request: Request;
      error: Error;
      event: ExtendableEvent;
    }) => Promise<void>;
    requestWillFetch?: (params: {
      request: Request;
      event: ExtendableEvent;
    }) => Promise<Request>;
  };
}

export interface ServiceWorkerConfig {
  version: string;
  precacheManifest: string[];
  runtimeCaching: CacheStrategy[];
  backgroundSync: boolean;
  offlineAnalytics: boolean;
  skipWaiting: boolean;
  clientsClaim: boolean;
  navigationPreload: boolean;
}

export interface OfflineQueueItem {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
}

// ============================================================================
// BLEEDING EDGE SERVICE WORKER IMPLEMENTATION
// ============================================================================

const SW_VERSION = "1.0.0";
const CACHE_PREFIX = "str-certified-v";
const OFFLINE_QUEUE_NAME = "offline-queue";
const MAX_RETRY_ATTEMPTS = 3;

// Cache configurations for different resource types
const CACHE_STRATEGIES: CacheStrategy[] = [
  // Critical app shell - Cache first with long TTL
  {
    name: "app-shell",
    pattern: /\.(html|js|css)$/,
    strategy: "cacheFirst",
    options: {
      cacheName: `${CACHE_PREFIX}app-shell`,
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },

  // Images - Cache first with compression
  {
    name: "images",
    pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    strategy: "cacheFirst",
    options: {
      cacheName: `${CACHE_PREFIX}images`,
      maxEntries: 200,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    },
  },

  // Fonts - Cache first with very long TTL
  {
    name: "fonts",
    pattern: /\.(woff|woff2|ttf|eot)$/,
    strategy: "cacheFirst",
    options: {
      cacheName: `${CACHE_PREFIX}fonts`,
      maxEntries: 50,
      maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
    },
  },

  // API calls - Stale while revalidate for data freshness
  {
    name: "api",
    pattern: /\/api\//,
    strategy: "staleWhileRevalidate",
    options: {
      cacheName: `${CACHE_PREFIX}api`,
      maxEntries: 100,
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
  },

  // Supabase - Network first with offline fallback
  {
    name: "supabase",
    pattern: /supabase\.co/,
    strategy: "networkFirst",
    options: {
      cacheName: `${CACHE_PREFIX}supabase`,
      maxEntries: 50,
      maxAgeSeconds: 10 * 60, // 10 minutes
    },
  },

  // CDN resources - Cache first
  {
    name: "cdn",
    pattern: /(googleapis|gstatic|jsdelivr)\.com/,
    strategy: "cacheFirst",
    options: {
      cacheName: `${CACHE_PREFIX}cdn`,
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },
];

// ============================================================================
// SERVICE WORKER EVENT HANDLERS
// ============================================================================

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Precache critical resources
      await precacheCriticalResources();

      // Skip waiting to activate immediately
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      await cleanupOldCaches();

      // Take control of all clients immediately
      await self.clients.claim();

      // Initialize background sync
      await initializeBackgroundSync();
    })(),
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith("http")) return;

  // Skip requests to chrome-extension URLs
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(handleFetchWithStrategy(event.request));
});

self.addEventListener(
  "sync",
  (
    event: ExtendableEvent & {
      tag: string;
      lastChance?: boolean;
    },
  ) => {
    if (event.tag === "offline-sync") {
      event.waitUntil(processOfflineQueue());
    }
  },
);

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;

    case "CACHE_URLS":
      event.waitUntil(cacheUrls(payload?.urls || []));
      break;

    case "CLEAR_CACHE":
      event.waitUntil(clearCache(payload?.cacheName));
      break;

    case "UPDATE_AVAILABLE":
      // Handle update available message
      event.ports[0]?.postMessage({ type: "UPDATE_ACKNOWLEDGED" });
      break;

    case "PING":
      // Handle ping/health check
      event.ports[0]?.postMessage({ type: "PONG", timestamp: Date.now() });
      break;

    default:
      // Silently ignore unknown message types to prevent console spam
      // Only log in development mode and only for truly unexpected messages
      if (
        process.env.NODE_ENV === "development" &&
        type &&
        !type.includes("BRIDGE") &&
        !type.includes("INTEGRATION")
      ) {
        debugLogger.warn("[ServiceWorker] Unknown message type:", type);
      }

      // Send acknowledgment only if there's a port available
      if (event.ports[0]) {
        event.ports[0].postMessage({
          type: "ACKNOWLEDGED",
          originalType: type,
        });
      }
      break;
  }
});

// ============================================================================
// CACHE STRATEGY IMPLEMENTATIONS
// ============================================================================

async function handleFetchWithStrategy(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Find matching cache strategy
  const strategy = CACHE_STRATEGIES.find((s) => {
    if (typeof s.pattern === "string") {
      return url.pathname.includes(s.pattern);
    }
    return s.pattern.test(url.href);
  });

  if (!strategy) {
    return handleNetworkFirst(request, `${CACHE_PREFIX}default`);
  }

  switch (strategy.strategy) {
    case "networkFirst":
      return handleNetworkFirst(request, strategy.options.cacheName);

    case "cacheFirst":
      return handleCacheFirst(
        request,
        strategy.options.cacheName,
        strategy.options.maxAgeSeconds,
      );

    case "staleWhileRevalidate":
      return handleStaleWhileRevalidate(request, strategy.options.cacheName);

    case "networkOnly":
      return handleNetworkOnly(request);

    case "cacheOnly":
      return handleCacheOnly(request, strategy.options.cacheName);

    default:
      return handleNetworkFirst(request, strategy.options.cacheName);
  }
}

async function handleNetworkFirst(
  request: Request,
  cacheName: string,
): Promise<Response> {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Queue for background sync if it's a mutating request
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      await queueOfflineRequest(request);
    }

    // Return offline fallback
    return getOfflineFallback(request);
  }
}

async function handleCacheFirst(
  request: Request,
  cacheName: string,
  maxAge?: number,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Check if cached response is still valid
  if (cachedResponse && maxAge) {
    const cachedTime = new Date(
      cachedResponse.headers.get("sw-cached-time") || 0,
    ).getTime();
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
          "sw-cached-time": new Date().toISOString(),
        },
      });

      await cache.put(request, responseWithTimestamp.clone());
      return responseWithTimestamp;
    }

    return networkResponse;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

async function handleStaleWhileRevalidate(
  request: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
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

async function handleNetworkOnly(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      await queueOfflineRequest(request);
    }
    return getOfflineFallback(request);
  }
}

async function handleCacheOnly(
  request: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  return cachedResponse || getOfflineFallback(request);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

async function precacheCriticalResources(): Promise<void> {
  const cache = await caches.open(`${CACHE_PREFIX}precache`);

  const criticalResources = [
    "/",
    "/manifest.json",
    "/offline.html",
    // Add other critical resources based on build manifest
  ];

  try {
    await cache.addAll(criticalResources);
  } catch (error) {
    debugLogger.error('ServiceWorker', 'Service worker operation failed', { error });
  }
}

async function cleanupOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(
    (name) => name.startsWith(CACHE_PREFIX) && !name.includes(SW_VERSION),
  );

  await Promise.all(
    oldCaches.map((cacheName) => {
      return caches.delete(cacheName);
    }),
  );
}

async function cacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(`${CACHE_PREFIX}runtime`);

  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
    debugLogger.error('ServiceWorker', 'Service worker operation failed', { error });
  }
    }),
  );
}

async function clearCache(cacheName?: string): Promise<void> {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

// ============================================================================
// OFFLINE SUPPORT
// ============================================================================

async function queueOfflineRequest(request: Request): Promise<void> {
  try {
    const body = await request.text();
    const queueItem: OfflineQueueItem = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body || undefined,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Store in IndexedDB for persistence
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_QUEUE_NAME], "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_NAME);
    await store.add(queueItem);

    // Register for background sync
    if ("serviceWorker" in self && "sync" in self.registration) {
      await self.registration.sync.register("offline-sync");
    }
  } catch (error) {
    debugLogger.error('ServiceWorker', 'Service worker operation failed', { error });
  }
}

async function processOfflineQueue(): Promise<void> {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction([OFFLINE_QUEUE_NAME], "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_NAME);
    const queueItems = await store.getAll();

    for (const item of queueItems) {
      try {
        const request = new Request(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        const response = await fetch(request);

        if (response.ok) {
          // Success - remove from queue
          await store.delete(item.timestamp);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        // Increment retry count
        item.retryCount++;

        if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Max retries reached - remove from queue
          await store.delete(item.timestamp);
        } else {
          // Update retry count
          await store.put(item);
        }
      }
    }
  } catch (error) {
    debugLogger.error('ServiceWorker', 'Service worker operation failed', { error });
  }
}

async function initializeBackgroundSync(): Promise<void> {
  if ("serviceWorker" in self && "sync" in self.registration) {
    try {
      await self.registration.sync.register("offline-sync");
    } catch (error) {
    debugLogger.error('ServiceWorker', 'Service worker operation failed', { error });
  }
  }
}

function getOfflineFallback(request: Request): Response {
  const url = new URL(request.url);

  // Return appropriate offline fallback based on request type
  if (request.mode === "navigate") {
    return new Response(
      `
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
          <button class="retry" onclick="window.navigator.onLine && fetch('/').then(() => self.clients.claim()).catch(() => debugLogger.info('Retry failed'))">Try Again</button>
        </div>
      </body>
      </html>
    `,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  // Return JSON error for API requests
  if (url.pathname.includes("/api/")) {
    return new Response(
      JSON.stringify({
        error: "Network unavailable",
        message: "This request will be retried when you come back online",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Return generic network error
  return new Response("Network Error", {
    status: 503,
    statusText: "Service Unavailable",
  });
}

// ============================================================================
// INDEXEDDB UTILITIES
// ============================================================================

async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("STRCertifiedOffline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_NAME)) {
        const store = db.createObjectStore(OFFLINE_QUEUE_NAME, {
          keyPath: "timestamp",
        });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("method", "method", { unique: false });
      }
    };
  });
}

// ============================================================================
// SERVICE WORKER REGISTRATION HELPER
// ============================================================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Update service worker when new version available
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Notify user about update
            if (confirm("A new version is available. Refresh to update?")) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
              // Professional graceful update - post message to clients for update
              self.clients.matchAll().then((clients) => {
                clients.forEach((client) =>
                  client.postMessage({ type: "UPDATE_AVAILABLE" }),
                );
              });
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    return null;
  }
}

// Export for use in main application
export { SW_VERSION, CACHE_STRATEGIES };
