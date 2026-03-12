// UFSL Push Notification Service Worker
// Handles background push events and notification clicks

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'UFSL', body: event.data.text() }
  }

  const {
    title = 'UFSL',
    body = '',
    icon = '/icons/icon-192.png',
    badge = '/icons/badge-72.png',
    url = '/',
    tag,
    type,
  } = data

  const options = {
    body,
    icon,
    badge,
    tag: tag || type || 'ufsl-notification',
    data: { url, type },
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [],
  }

  // Add relevant action buttons based on notification type
  if (type === 'game_starting') {
    options.actions = [{ action: 'view', title: 'View Bracket' }]
  } else if (type === 'bracket_reminder') {
    options.actions = [{ action: 'fill', title: 'Fill Bracket Now' }]
  } else if (type === 'pool_update') {
    options.actions = [{ action: 'leaderboard', title: 'View Standings' }]
  } else if (type === 'smack_mention') {
    options.actions = [{ action: 'smack', title: 'Reply' }]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let targetUrl = data.url || '/'

  // Handle action button clicks
  if (event.action === 'view' || event.action === 'fill') {
    targetUrl = data.url || '/dashboard'
  } else if (event.action === 'leaderboard') {
    targetUrl = '/leaderboard'
  } else if (event.action === 'smack') {
    targetUrl = data.url || '/pools'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
