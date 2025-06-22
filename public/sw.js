self.addEventListener('push', function (event) {
  let data = {}

  if (event.data) {
    data = event.data.json()
  }

  const title = data.title || 'Nova notificação'
  const options = {
    body: data.body || 'Você recebeu uma nova mensagem!',
    icon: data.icon || 'https://i.postimg.cc/W4pSFmV5/icon-Papo-Reto.png',
    badge: data.badge || 'https://i.postimg.cc/W4pSFmV5/icon-Papo-Reto.png',
    data: {
      url: data.data?.url || 'https://pap0reto.netlify.app'
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Quando o usuário clicar na notificação
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    })
  )
})

