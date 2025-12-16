self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}

  const title = data.title || 'Nova Menssagem!'
  const options = {
    body: data.body || 'Você recebeu uma nova menssagem',
    icon: data.icon || 'https://i.postimg.cc/k499mWs5/Chat-GPT-Image-23-de-jun-de-2025-21-00-52.png',
    badge: data.badge || 'https://i.postimg.cc/k499mWs5/Chat-GPT-Image-23-de-jun-de-2025-21-00-52.png',
    data: {
      url: data.data?.url || '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
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
