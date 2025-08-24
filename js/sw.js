// Service Worker for Offline Functionality
// Vihaan's 5th Grade Learning Platform

const CACHE_NAME = 'vihaan-learning-v1';
const STATIC_CACHE_NAME = 'vihaan-static-v1';
const DYNAMIC_CACHE_NAME = 'vihaan-dynamic-v1';

// Essential files for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/responsive.css', 
  '/js/app.js',
  '/js/progress.js',
  '/js/interactive.js',
  '/manifest.json',
  '/assets/icons/logo.png',
  '/assets/icons/subject-icons/math.png',
  '/assets/icons/subject-icons/science.png', 
  '/assets/icons/subject-icons/english.png',
  '/assets/icons/subject-icons/social-studies.png',
  '/assets/images/illustrations/welcome-student.png'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/config/',
  '/data/',
  '.json'
];

// Cache-first resources (try cache first, fallback to network)
const CACHE_FIRST = [
  '/assets/images/',
  '/assets/icons/',
  '/subjects/',
  '.png',
  '.jpg', 
  '.jpeg',
  '.webp',
  '.svg'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('vihaan-')) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(location.origin)) {
    return;
  }
  
  // Determine caching strategy based on resource type
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network-first strategy (for dynamic content)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback for HTML pages
    if (request.headers.get('accept').includes('text/html')) {
      const offlinePage = await caches.match('/index.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🚫 Both cache and network failed for:', request.url);
    throw error;
  }
}

// Stale-while-revalidate strategy (for general content)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, but we might have cache
    return null;
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background
    networkResponsePromise;
    return cachedResponse;
  }
  
  // No cache, wait for network
  const networkResponse = await networkResponsePromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  throw new Error('No cache and network failed');
}

// Helper functions to determine caching strategy
function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgressData());
  }
});

// Sync offline progress data when connection returns
async function syncProgressData() {
  try {
    console.log('📊 Syncing offline progress data...');
    
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineProgressData();
    
    if (offlineData && offlineData.length > 0) {
      // Send to Supabase when online
      const response = await fetch('/api/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      });
      
      if (response.ok) {
        console.log('✅ Progress data synced successfully');
        await clearOfflineProgressData();
      } else {
        console.log('❌ Failed to sync progress data');
      }
    }
  } catch (error) {
    console.error('🚫 Error syncing progress data:', error);
  }
}

// Placeholder functions for progress data management
// These would be implemented with IndexedDB in a full implementation
async function getOfflineProgressData() {
  // Would retrieve from IndexedDB
  return [];
}

async function clearOfflineProgressData() {
  // Would clear IndexedDB after successful sync
  console.log('🧹 Cleared offline progress data');
}

// Push notification handler (for future use)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey
    },
    actions: [
      {
        action: 'explore',
        title: 'Continue Learning',
        icon: '/assets/icons/actions/explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/actions/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handler
self.addEventListener('error', event => {
  console.error('🚫 Service Worker error:', event.error);
});

// Unhandled promise rejection handler  
self.addEventListener('unhandledrejection', event => {
  console.error('🚫 Service Worker unhandled rejection:', event.reason);
});

console.log('🎓 Vihaan Learning Platform Service Worker loaded successfully!');