// src/hooks/usePushNotifications.js
import { useEffect } from "react";
import { onMessage } from "../firebase";
import { getMessaging, getToken, MessagePayload } from "firebase/messaging";
import { getApiBaseUrl } from "@/lib/api"; // Adjust the import based on your project structure

const messaging = getMessaging();

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY; // From Firebase project settings

interface PushSubscriptionPayload {
  userId: string;
  token: string;
}

interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const usePushNotifications = (userId: string | undefined): (() => void) => {
  const subscribeToPush = () => {
    if (!userId) return;

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        getToken(messaging, { vapidKey: VAPID_KEY })
          .then((currentToken) => {
            if (currentToken) {
              fetch(`${getApiBaseUrl()}/api/notification/push/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, token: currentToken }),
              });
            } else {
              console.log("No registration token available.");
            }
          })
          .catch((err) => {
            console.log("Error retrieving token: ", err);
          });
      } else {
        console.log("Notification permission denied");
      }
    });
  };

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      console.log("Message received in foreground: ", payload);
      if (payload.notification?.title && payload.notification?.body) {
        alert(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });

    return () => {
      // Cleanup onMessage if needed
    };
  }, [userId]);

  return subscribeToPush;
};

export default usePushNotifications;
