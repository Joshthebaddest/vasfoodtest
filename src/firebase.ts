// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:  import.meta.env.VITE_API_KEY, // From Firebase project settings
  authDomain:  import.meta.env.VITE_AUTH_DOMAIN, // From Firebase project settings
  projectId:  import.meta.env.VITE_PROJECT_ID, // From Firebase project settings
  storageBucket:  import.meta.env.VITE_STORAGE_BUCKET, // From Firebase project settings
  messagingSenderId:  import.meta.env.VITE_MESSAGING_SENDER_ID, // From Firebase project settings
  appId:  import.meta.env.VITE_APP_ID, // From Firebase project settings
  measurementId:  import.meta.env.VITE_MEASUREMENT_ID // From Firebase project settings
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
