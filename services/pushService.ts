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

import { storage } from './storageService.ts';
import { PregnancyProfile, CalendarEvent, VitaminLog, FeedingLog, SleepLog, MilestoneLog, LifecycleStage } from '../types.ts';

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
      // Don't request permission automatically in background tasks
      return { success: false, error: 'Permission not granted' };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Generate and schedule reminders based on user data
 */
export function scheduleReminders(
  profile: PregnancyProfile,
  calendarEvents: CalendarEvent[],
  vitamins: VitaminLog[],
  feedingLogs: FeedingLog[],
  sleepLogs: SleepLog[],
  milestones: MilestoneLog[]
) {
  if (!profile.notificationsEnabled) return;

  const reminders: any[] = [];
  const now = Date.now();

  // 1. Weekly Pregnancy Guidance (if pregnant)
  if (profile.lifecycleStage === LifecycleStage.PREGNANCY) {
    const lmpDate = new Date(profile.lmpDate);
    const weeks = Math.floor((now - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    // Schedule for next week
    const nextWeekTime = now + (7 * 24 * 60 * 60 * 1000);
    reminders.push({
      id: `weekly-guidance-${weeks + 1}`,
      title: `Week ${weeks + 1} Guidance 🤰`,
      body: `You're entering week ${weeks + 1}! Check out your new baby size and tips.`,
      timestamp: nextWeekTime,
      type: 'guidance'
    });
  }

  // 2. Doctor Appointments
  calendarEvents.forEach(event => {
    if (event.type === 'appointment') {
      const eventTime = new Date(event.date).getTime();
      // Reminder 2 hours before
      const reminderTime = eventTime - (2 * 60 * 60 * 1000);
      if (reminderTime > now) {
        reminders.push({
          id: `appointment-${event.id}`,
          title: `Upcoming Appointment: ${event.title} 🏥`,
          body: `Don't forget your appointment at ${new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          timestamp: reminderTime,
          type: 'appointment'
        });
      }
    }
  });

  // 3. Vitamin Reminders (Daily at 9 AM if not taken)
  const today = new Date().setHours(0, 0, 0, 0);
  const vitaminTakenToday = vitamins.some(v => new Date(v.timestamp).setHours(0, 0, 0, 0) === today);
  if (!vitaminTakenToday) {
    const tomorrow9AM = new Date();
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    reminders.push({
      id: `vitamin-reminder-${tomorrow9AM.getTime()}`,
      title: `Vitamin Reminder 💊`,
      body: `Time to take your prenatal vitamins for a healthy baby!`,
      timestamp: tomorrow9AM.getTime(),
      type: 'vitamin'
    });
  }

  // 4. Newborn Tracking (Feeding/Sleep)
  if (profile.lifecycleStage === LifecycleStage.NEWBORN || profile.lifecycleStage === LifecycleStage.INFANT) {
    // Feeding: Every 3 hours
    const lastFeeding = feedingLogs[0];
    if (lastFeeding) {
      const nextFeedingTime = lastFeeding.timestamp + (3 * 60 * 60 * 1000);
      if (nextFeedingTime > now) {
        reminders.push({
          id: `feeding-reminder-${nextFeedingTime}`,
          title: `Feeding Time 🍼`,
          body: `It's been 3 hours since the last feeding. Time for a refill!`,
          timestamp: nextFeedingTime,
          type: 'feeding'
        });
      }
    }
  }

  // Add to storage if not already present
  const existingReminders = storage.getReminders();
  reminders.forEach(r => {
    if (!existingReminders.find(er => er.id === r.id)) {
      storage.addReminder(r);
    }
  });
}

/**
 * Process and show due reminders
 */
export async function processReminders() {
  if (Notification.permission !== 'granted') return;

  const allReminders = storage.getReminders();
  const shownIds = storage.getShownReminderIds();
  const now = Date.now();

  const dueReminders = allReminders.filter(r => 
    !shownIds.includes(r.id) && 
    r.timestamp <= now
  );

  for (const reminder of dueReminders) {
    try {
      const result = await showLocalNotification(reminder.title, reminder.body);
      if (result.success) {
        storage.markReminderAsShown(reminder.id);
      }
    } catch (e) {
      // Silent fail
    }
  }
}
