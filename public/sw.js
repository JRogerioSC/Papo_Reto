self.addEventListener('push', event => {
  const message = event.data?.text() || 'No message received';

  event.waitUntil(
    Promise.resolve(message).then(body => {
      self.registration.showNotification('Notification', {
        body: body,
        icon: '/menssagensNews.png'
      })
    })
  )
})

