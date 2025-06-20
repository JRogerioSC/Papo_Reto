// service-worker.js

self.addEventListener('push', function(event) {
  let data = { title: 'Nova Menssagem!', body: '', icon: 'https://cdn.pixabay.com/photo/2017/08/06/22/01/banner-2598287_1280.jpg', data: {} };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://cdn.pixabay.com/photo/2017/08/06/22/01/banner-2598287_1280.jpg', // Ícone padrão, se não enviado
    data: {
      url: data.data?.url || 'https://pap0reto.netlify.app/' // URL para abrir ao clicar
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || 'https://cdn-icons-png.flaticon.com/512/484/484662.png';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

