sself.addEventListener('push', event => {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: 'Você recebeu uma nova mensagem!',
    icon: data.icon || '/icon.png',
    data: {
      url: data.data?.url || '/'
    }
  })
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.notification.data?.url) {
    clients.openWindow(event.notification.data.url)
  }
})
