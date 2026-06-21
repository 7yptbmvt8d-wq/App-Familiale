/* Service worker Firebase Cloud Messaging — notifications push reçues
   lorsque l'application est fermée ou en arrière-plan.
   Coexiste avec le service worker PWA (scope dédié). */
/* global importScripts, firebase, self, clients */

importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

// Configuration publique du projet Firebase (mêmes clés que le client).
firebase.initializeApp({
  apiKey: 'AIzaSyDjcXtoF1Fx5vs8hoszV5NO879qpvLYY2U',
  authDomain: 'app-famille-bd0ae.firebaseapp.com',
  projectId: 'app-famille-bd0ae',
  storageBucket: 'app-famille-bd0ae.firebasestorage.app',
  messagingSenderId: '638754135304',
  appId: '1:638754135304:web:16ba36478ec134ffb620bd',
});

const messaging = firebase.messaging();

// Messages « data-only » envoyés par les Cloud Functions → on construit la notif.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'Famille', {
    body: d.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'famille',
    data: { url: d.url || './' },
  });
});

// Au clic : focaliser un onglet existant ou ouvrir l'app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
