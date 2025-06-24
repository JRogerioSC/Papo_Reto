self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}

  const title = data.title || 'Nova Menssagem!'
  const options = {
    body: data.body || 'Você recebeu uma nova menssagem',
    icon: data.icon || 'https://i.postimg.cc/6pfxh8tJ/512x512.jpg',
    badge: data.badge || 'https://i.postimg.cc/6pfxh8tJ/512x512.jpg',
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
