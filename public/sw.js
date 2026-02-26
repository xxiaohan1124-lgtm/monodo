/// <reference lib="webworker" />

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete') {
    // Send message to client to mark as complete
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'COMPLETE_TODO',
          todoId: event.notification.data.todoId
        });
      });
    });
  } else {
    // Focus the app window
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});
