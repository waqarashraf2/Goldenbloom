// Golden Bloom CRM Service Worker for Lock Screen & Slide Bar Push Notifications
const CACHE_NAME = 'gb-crm-sw-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push from server or background
self.addEventListener('push', (event) => {
  let title = 'Golden Bloom CRM 🌿';
  let options = {
    body: 'New notification received',
    icon: '/icon-192.png',
    badge: '/icon-32.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true, // Keeps notification active in slide bar & lock screen!
    renotify: true,
    silent: false,
    tag: 'gb-notification',
    data: {},
    actions: [
      { action: 'open_lead', title: '👁️ Open Lead Details' }
    ]
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
        options.data.lead_id = payload.lead_id;
      }
    } catch {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking notification on Mobile Slide Bar or Lock Screen or Desktop Tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const leadId = data.lead_id || data.leadId;
  const targetPath = leadId ? `/?lead_id=${leadId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a CRM window is already open, focus it and open the target lead
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.registration.scope)) {
          if (leadId) {
            client.navigate(targetPath);
          }
          return client.focus();
        }
      }
      // If no tab is open, launch a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
