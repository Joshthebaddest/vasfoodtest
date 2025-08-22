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

const usePushNotifications = (userId: string | undefined): void => {
  useEffect(() => {
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
              console.log(
                "No registration token available. Request permission to generate one."
              );
            }
          })
          .catch((err) => {
            console.log("An error occurred while retrieving token. ", err);
          });
      } else {
        console.log("Notification permission denied");
      }
    });

    onMessage(messaging, (payload: MessagePayload) => {
      console.log("Message received in foreground: ", payload);
      // Optional: Show toast or custom alert
      if (
        payload.notification &&
        payload.notification.title &&
        payload.notification.body
      ) {
        alert(payload.notification.title + ": " + payload.notification.body);
      }
    });
  }, [userId]);
};

export default usePushNotifications;
