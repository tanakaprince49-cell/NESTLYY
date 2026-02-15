/**
 * Convert VAPID key from Base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

const BRAND_LOGO = "https://i.ibb.co/qLkMSD9n/Screenshot-20260211-190854-com-android-gallery3d.webp";

/**
 * Ensure Service Worker is registered from SAME origin using relative paths
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers not supported');
  }

  // Use relative detection to prevent origin mismatch errors
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register('./sw.js');
  }

  return registration;
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeUserToPush() {
  try {
    if (!('PushManager' in window)) {
      console.warn('PushManager not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const registration = await getServiceWorkerRegistration();

    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      return existingSubscription;
    }

    const VAPID_PUBLIC_KEY = 'BE67BfD_y2rY_T3K5qYnBqS6_E1Y-y8_2Z8_8Z-Y_Y8_Y8-Y8_Y8_Y8-Y8_Y8_Y8';

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Show a LOCAL notification (client only)
 */
export async function showLocalNotification(
  title: string,
  body: string
) {
  try {
    if (Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      if (res !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    const registration = await getServiceWorkerRegistration();

    await registration.showNotification(title, {
      body,
      icon: BRAND_LOGO,
      badge: BRAND_LOGO,
      vibrate: [200, 100, 200, 100, 400],
      tag: `nestly-${Date.now()}`,
      renotify: true,
      data: { url: '/' }
    } as any);

    return { success: true };
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
}
