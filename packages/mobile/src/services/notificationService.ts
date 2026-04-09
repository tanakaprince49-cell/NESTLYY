import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth } from '@nestly/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nestlyy-one.vercel.app';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    // Get Expo push token (not raw FCM)
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses slug from app.json
    });

    // Store token on server
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      await fetch(`${API_URL}/api/push/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
        }),
      }).catch(() => {});
    }

    return token;
  } catch {
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
