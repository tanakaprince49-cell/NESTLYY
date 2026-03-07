importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDm6OvIZb714N5JkHzWCCFeEsWyBHayB90",
  authDomain: "plasma-ripple-467908-e7.firebaseapp.com",
  projectId: "plasma-ripple-467908-e7",
  storageBucket: "plasma-ripple-467908-e7.firebasestorage.app",
  messagingSenderId: "250549049447",
  appId: "1:250549049447:web:2c04341af1867201061cc2",
  measurementId: "G-Y6EQPDNY95"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
