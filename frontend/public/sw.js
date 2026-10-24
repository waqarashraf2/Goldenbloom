// Golden Bloom CRM Service Worker for Push & System Notifications
const CACHE_NAME = 'gb-crm-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push (from push service or background)
self.addEventListener('push', (event) => {
  let title = 'Golden Bloom CRM';
  let options = {
    body: 'New notification received',
    icon: '/icon-192.png',
    badge: '/icon-32.png',
    vibrate: [200, 100, 200],
    data: {},
    tag: 'gb-notification',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.message || payload.body || options.body;
      options.icon = payload.icon || options.icon;
      options.data = payload;
      if (payload.lead_id) {
        options.tag = `gb-lead-${payload.lead_id}`;
      }
    } catch {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking notification on Mobile or Desktop system tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const leadId = data.lead_id || data.leadId;
  const targetPath = leadId ? `/?lead_id=${leadId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a CRM tab is already open, focus it and navigate to the lead
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.registration.scope)) {
          if (leadId) {
            client.navigate(targetPath);
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
