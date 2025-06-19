self.addEventListener('push', event => {
  let data = { title: 'Default Title', body: 'Default body' }

  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    // Fallback: treat it as plain text
    data = {
      title: 'Notification',
      body: event.data.text()
    }
  }

  event.waitUntil(
    Promise.resolve(data.body).then(body => {
      self.registration.showNotification(data.title, {
        body: body,
        icon: '/menssagensNews.png'
      })
    })
  )
})

