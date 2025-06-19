
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.text() : 'No payload';

    event.waitUntil(
        data.then(text => {
            self.registration.showNotification('Push Received', {
                body: text,
                icon: 'menssagensNews.png'
            });
        })
    );
});
