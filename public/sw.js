import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST || []);

// Forum Cache
registerRoute(
  ({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/rest/v1/forum_'),
  new StaleWhileRevalidate({
    cacheName: 'axim-forums-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Mapbox tiles Cache
registerRoute(
  ({ url }) => /^https:\/\/api\.mapbox\.com\/v4\/.*/i.test(url.href),
  new StaleWhileRevalidate({
    cacheName: 'mapbox-tiles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Network Only for API calls
registerRoute(
  ({ url }) => url.origin.includes('supabase.co') || (url.origin.includes('mapbox.com') && !url.pathname.startsWith('/v4/')),
  new NetworkOnly()
);

// Custom Service Worker for Push Notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'AXiM Core Alert',
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '2'
        }
      };
      event.waitUntil(self.registration.showNotification(data.title || 'AXiM Alert', options));
    } catch (e) {
      console.error('Error parsing push data', e);
      event.waitUntil(self.registration.showNotification('AXiM Core Alert', { body: event.data.text() }));
    }
  } else {
    event.waitUntil(self.registration.showNotification('AXiM Core Alert', { body: 'A new weather event has been detected.' }));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
