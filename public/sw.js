self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}

  // Mostra só o título "Nova Mensagem!" e ícone, sem body, para simplificar
  const title = data.title || 'Nova Mensagem!'
  const options = {
    // Remove o body ou deixa uma mensagem curta
    body: '', // para só aparecer o título, pode deixar vazio
    icon: data.icon || '/icon.png', // seu ícone do app
    badge: data.icon || 'https://i.postimg.cc/W4pSFmV5/icon-Papo-Reto.png', // opcional: ícone pequeno na barra de status
    data: {
      url: data.data?.url || '/'  // URL para abrir no clique
    },
    // Evita som ou vibração se quiser (opcional)
    // silent: true,
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

