importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDUzXS6EUO7CaGAfVXRAzfEzhFwSPQ2dzo",
  authDomain: "push-notification-49c7f.firebaseapp.com",
  projectId: "push-notification-49c7f",
  storageBucket: "push-notification-49c7f.appspot.com",
  messagingSenderId: "661517314518",
  appId: "1:661517314518:web:6bdda73836b9208ef55c77"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const { title, body } = payload.data;

  self.registration.showNotification(title, {
    body: body,
    icon: "/favicon.png",
  });
  
});

