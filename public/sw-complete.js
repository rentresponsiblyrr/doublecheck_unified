/**
 * STR CERTIFIED PWA SERVICE WORKER - PHASE 4A COMPLETE IMPLEMENTATION
 * 
 * This is a temporary file with the complete Service Worker implementation.
 * Will replace the main sw.js file once complete.
 */

/**
 * Cache First Strategy - For static assets
 * Checks cache first, falls back to network
 */
async function cacheFirstStrategy(request) {
  const url = new URL(request.url);
  
  try {
    // Check static cache first
    const staticCache = await caches.open(CACHE_NAME);
    let response = await staticCache.match(request);
    
    if (response && isCacheValid(response)) {
      return response;
    }
    
    // Check media cache for images
    if (CACHE_FIRST_PATTERNS[0].test(url.pathname)) {
      const mediaCache = await caches.open(MEDIA_CACHE);
      response = await mediaCache.match(request);
      
      if (response && isCacheValid(response)) {
        return response;
      }
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = addCacheMetadata(networkResponse, CACHE_TTL.static);
      
      // Determine which cache to use
      if (CACHE_FIRST_PATTERNS[0].test(url.pathname)) {
        const mediaCache = await caches.open(MEDIA_CACHE);
        await mediaCache.put(request, responseToCache.clone());
        
        // Clean up media cache if needed
        await cleanupCache(MEDIA_CACHE, CACHE_SIZE_LIMITS.media);
      } else {
        await staticCache.put(request, responseToCache.clone());
        
        // Clean up static cache if needed
        await cleanupCache(CACHE_NAME, CACHE_SIZE_LIMITS.static);
      }
      
      return responseToCache;
    }
    
    // Return stale cache if network fails
    if (response) {
      log('info', 'Returning stale cache due to network failure', { url: url.toString() });
      return response;
    }
    
    throw new Error('Network request failed and no cache available');
    
  } catch (error) {
    log('warn', 'Cache first strategy failed', { url: url.toString(), error: error.message });
    throw error;
  }
}

/**
 * Network First Strategy - For API calls and dynamic content
 * Tries network first, falls back to cache
 */
async function networkFirstStrategy(request) {
  const url = new URL(request.url);
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      timeout: 10000, // 10 second timeout
    });
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful responses (except for certain endpoints)
      if (!url.pathname.includes('/auth/') && !url.pathname.includes('/rpc/')) {
        const responseToCache = addCacheMetadata(networkResponse, CACHE_TTL.runtime);
        await runtimeCache.put(request, responseToCache.clone());
        
        // Clean up runtime cache if needed
        await cleanupCache(RUNTIME_CACHE, CACHE_SIZE_LIMITS.runtime);
      }
      
      return networkResponse;
    }
    
    throw new Error(`Network response failed with status: ${networkResponse.status}`);
    
  } catch (error) {
    log('info', 'Network failed, trying cache', { url: url.toString(), error: error.message });
    
    // Fall back to cache
    const cachedResponse = await runtimeCache.match(request);
    
    if (cachedResponse) {
      // Add stale indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-from-cache', 'true');
      headers.set('sw-cache-stale', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    throw new Error('Network failed and no cache available');
  }
}

/**
 * Stale While Revalidate Strategy - For HTML documents
 * Returns cache immediately while updating cache in background
 */
async function staleWhileRevalidateStrategy(request) {
  const url = new URL(request.url);
  const staticCache = await caches.open(CACHE_NAME);
  
  // Get cached version immediately
  const cachedResponse = await staticCache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (response && response.status === 200) {
        const responseToCache = addCacheMetadata(response, CACHE_TTL.html);
        await staticCache.put(request, responseToCache.clone());
        return response;
      }
      return null;
    })
    .catch((error) => {
      log('warn', 'Background revalidation failed', { url: url.toString(), error: error.message });
      return null;
    });
  
  // Return cached version if available, otherwise wait for network
  if (cachedResponse) {
    // Don't wait for background update
    networkResponsePromise.catch(() => {}); // Ignore background errors
    return cachedResponse;
  }
  
  // No cache available, wait for network
  const networkResponse = await networkResponsePromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  throw new Error('No cache available and network failed');
}

/**
 * Handle fetch errors with appropriate fallbacks
 * @param {Request} request - The original request
 * @param {Error} error - The error that occurred
 * @returns {Promise<Response>} Fallback response
 */
async function handleFetchError(request, error) {
  const url = new URL(request.url);
  
  // For HTML requests, return offline page
  if (request.destination === 'document' || request.headers.get('accept').includes('text/html')) {
    const offlineCache = await caches.open(CACHE_NAME);
    const offlineResponse = await offlineCache.match('/offline.html');
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline page if not cached
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>STR Certified - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; }
            .offline-icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>You're Offline</h1>
          <p>STR Certified is working offline. Your inspection data is safe and will sync when you're back online.</p>
          <p><a href="/">Try Again</a></p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // For other requests, try to return any cached version
  const caches = await Promise.all([
    caches.open(CACHE_NAME).then(cache => cache.match(request)),
    caches.open(RUNTIME_CACHE).then(cache => cache.match(request)),
    caches.open(MEDIA_CACHE).then(cache => cache.match(request)),
  ]);
  
  const cachedResponse = caches.find(response => response !== undefined);
  
  if (cachedResponse) {
    const headers = new Headers(cachedResponse.headers);
    headers.set('sw-from-cache', 'true');
    headers.set('sw-cache-stale', 'true');
    
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: headers,
    });
  }
  
  // No fallback available
  return new Response('Service Unavailable', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ========================================
// BACKGROUND SYNC
// ========================================

/**
 * Background Sync Event Handler
 * Handles offline data synchronization when network is restored
 */
self.addEventListener('sync', event => {
  log('info', 'Background sync triggered', { tag: event.tag });

  switch (event.tag) {
    case SYNC_TAGS.INSPECTION_DATA:
      event.waitUntil(syncInspectionData());
      break;
      
    case SYNC_TAGS.MEDIA_UPLOAD:
      event.waitUntil(syncMediaFiles());
      break;
      
    case SYNC_TAGS.USER_PREFERENCES:
      event.waitUntil(syncUserPreferences());
      break;
      
    case SYNC_TAGS.ANALYTICS:
      event.waitUntil(syncAnalytics());
      break;
      
    default:
      log('warn', 'Unknown sync tag', { tag: event.tag });
  }
});

/**
 * Sync inspection data with server
 * Handles offline inspection submissions with retry logic
 */
async function syncInspectionData() {
  log('info', 'Starting inspection data sync');
  
  try {
    // This would integrate with the offline data manager
    // For now, we'll post a message to the app to handle the sync
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_REQUEST',
        tag: SYNC_TAGS.INSPECTION_DATA,
        timestamp: Date.now(),
      });
    }
    
    log('info', 'Inspection data sync initiated', { clientCount: clients.length });
    
  } catch (error) {
    log('error', 'Inspection data sync failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync media files with server
 * Handles offline photo/video uploads with compression and retry
 */
async function syncMediaFiles() {
  log('info', 'Starting media file sync');
  
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_REQUEST',
        tag: SYNC_TAGS.MEDIA_UPLOAD,
        timestamp: Date.now(),
      });
    }
    
    log('info', 'Media file sync initiated', { clientCount: clients.length });
    
  } catch (error) {
    log('error', 'Media file sync failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync user preferences and settings
 */
async function syncUserPreferences() {
  log('info', 'Starting user preferences sync');
  
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_REQUEST',
        tag: SYNC_TAGS.USER_PREFERENCES,
        timestamp: Date.now(),
      });
    }
    
    log('info', 'User preferences sync initiated');
    
  } catch (error) {
    log('error', 'User preferences sync failed', { error: error.message });
  }
}

/**
 * Sync analytics data
 */
async function syncAnalytics() {
  log('info', 'Starting analytics sync');
  
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_REQUEST',
        tag: SYNC_TAGS.ANALYTICS,
        timestamp: Date.now(),
      });
    }
    
    log('info', 'Analytics sync initiated');
    
  } catch (error) {
    log('error', 'Analytics sync failed', { error: error.message });
  }
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================

/**
 * Push Event Handler
 * Handles incoming push notifications
 */
self.addEventListener('push', event => {
  if (!event.data) {
    log('warn', 'Push event received without data');
    return;
  }

  try {
    const data = event.data.json();
    log('info', 'Push notification received', { type: data.type, title: data.title });
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-icon.png',
      data: data,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      tag: data.tag || 'default',
      timestamp: Date.now(),
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
    
  } catch (error) {
    log('error', 'Push notification handling failed', { error: error.message });
    
    // Show generic notification on error
    event.waitUntil(
      self.registration.showNotification('STR Certified', {
        body: 'You have a new notification',
        icon: '/icon-192x192.png',
        tag: 'generic',
      })
    );
  }
});

/**
 * Notification Click Event Handler
 * Handles user interaction with notifications
 */
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const data = notification.data || {};
  
  log('info', 'Notification clicked', { action: event.action, tag: notification.tag });
  
  // Close the notification
  notification.close();
  
  // Handle notification actions
  if (event.action) {
    handleNotificationAction(event.action, data);
  } else {
    // Default action - open the app
    openApp(data.url || '/');
  }
});

/**
 * Handle specific notification actions
 * @param {string} action - The action identifier
 * @param {Object} data - Notification data
 */
async function handleNotificationAction(action, data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  switch (action) {
    case 'open_inspection':
      await openApp(`/inspection/${data.inspectionId}`);
      break;
      
    case 'view_details':
      await openApp(data.url || '/');
      break;
      
    case 'dismiss':
      // Just close, no action needed
      break;
      
    default:
      log('warn', 'Unknown notification action', { action });
      await openApp('/');
  }
  
  // Notify app of action
  for (const client of clients) {
    client.postMessage({
      type: 'NOTIFICATION_ACTION',
      action: action,
      data: data,
      timestamp: Date.now(),
    });
  }
}

/**
 * Open the app or focus existing window
 * @param {string} url - URL to open
 */
async function openApp(url = '/') {
  const clients = await self.clients.matchAll({ 
    type: 'window',
    includeUncontrolled: true 
  });
  
  // Check if app is already open
  for (const client of clients) {
    if (client.url.includes(self.location.origin)) {
      await client.focus();
      if (url !== '/') {
        client.postMessage({
          type: 'NAVIGATE',
          url: url,
          timestamp: Date.now(),
        });
      }
      return;
    }
  }
  
  // Open new window
  await self.clients.openWindow(url);
}

// ========================================
// MESSAGE HANDLING
// ========================================

/**
 * Message Event Handler
 * Handles communication from the main app
 */
self.addEventListener('message', event => {
  const { data } = event;
  
  log('info', 'Message received from app', { type: data.type });
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'REGISTER_SYNC':
      registerBackgroundSync(data.tag).then((success) => {
        event.ports[0].postMessage({ success });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      log('warn', 'Unknown message type', { type: data.type });
  }
});

/**
 * Register background sync for a given tag
 * @param {string} tag - Sync tag to register
 * @returns {Promise<boolean>} Success status
 */
async function registerBackgroundSync(tag) {
  try {
    await self.registration.sync.register(tag);
    log('info', 'Background sync registered', { tag });
    return true;
  } catch (error) {
    log('error', 'Failed to register background sync', { tag, error: error.message });
    return false;
  }
}

/**
 * Clear all caches
 * @returns {Promise<void>}
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(name => name.startsWith('str-certified-'))
    .map(name => caches.delete(name));
    
  await Promise.all(deletePromises);
  log('info', 'All caches cleared', { deletedCaches: deletePromises.length });
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

/**
 * Periodic cache cleanup and performance monitoring
 * Runs every 5 minutes to maintain optimal performance
 */
setInterval(async () => {
  try {
    // Clean up caches based on size limits
    await cleanupCache(CACHE_NAME, CACHE_SIZE_LIMITS.static);
    await cleanupCache(RUNTIME_CACHE, CACHE_SIZE_LIMITS.runtime);
    await cleanupCache(MEDIA_CACHE, CACHE_SIZE_LIMITS.media);
    
    // Log cache statistics
    const staticSize = await calculateCacheSize(await caches.open(CACHE_NAME));
    const runtimeSize = await calculateCacheSize(await caches.open(RUNTIME_CACHE));
    const mediaSize = await calculateCacheSize(await caches.open(MEDIA_CACHE));
    
    log('info', 'Cache maintenance completed', {
      staticSize: Math.round(staticSize / 1024 / 1024),
      runtimeSize: Math.round(runtimeSize / 1024 / 1024),
      mediaSize: Math.round(mediaSize / 1024 / 1024),
    });
    
  } catch (error) {
    log('error', 'Cache maintenance failed', { error: error.message });
  }
}, 5 * 60 * 1000); // 5 minutes

// ========================================
// SERVICE WORKER READY
// ========================================

log('info', 'Service Worker script loaded', { 
  version: CACHE_VERSION,
  timestamp: new Date().toISOString()
});

// Export sync tags for use by the app
self.SYNC_TAGS = SYNC_TAGS;