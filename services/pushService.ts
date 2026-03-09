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

import { storage } from './storageService.ts';
import { PregnancyProfile, CalendarEvent, VitaminLog, FeedingLog, SleepLog, MilestoneLog, LifecycleStage } from '../types.ts';
import { messaging, auth } from '../firebase.ts';
import { getToken, onMessage } from 'firebase/messaging';

const BRAND_LOGO = "https://i.ibb.co/qLkMSD9n/Screenshot-20260211-190854-com-android-gallery3d.webp";

/**
 * Ensure Service Worker is registered
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers not supported');
  }

  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
  }

  return registration;
}

/**
 * Subscribe user to Firebase Push Notifications
 */
export async function subscribeUserToPush() {
  try {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get FCM Token
    const vapidKey = process.env.VITE_FIREBASE_VAPID_KEY || 'BHTkgWO-8sV1VPqnnq400neqyKIqN1nDAkmI_1HAr59O9wrDDbwPLR1HBI8j_JbLcMj0QYVXufaU6gl6OTjWMIM';
    const currentToken = await getToken(messaging, {
      vapidKey
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      
      // Send token to server
      if (auth.currentUser) {
        await fetch('/api/push/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            userId: auth.currentUser.uid,
            email: auth.currentUser.email
          })
        });
      }
      
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('Firebase Push subscription failed:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function setupForegroundMessaging() {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    if (payload.notification) {
      showLocalNotification(payload.notification.title || 'Nestly', payload.notification.body || '');
    }
  });
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

    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      await audio.play();
    } catch (e) {
      console.warn("Audio playback failed", e);
    }

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
    const babySizes = ["sweet potato", "mango", "banana", "corn", "eggplant", "cauliflower"];
    const size = babySizes[weeks % babySizes.length];
    
    reminders.push({
      id: `weekly-guidance-${weeks + 1}`,
      title: `Week ${weeks + 1} Update 👶`,
      body: `You’re now ${weeks + 1} weeks pregnant! Your baby is about the size of a ${size}.`,
      timestamp: nextWeekTime,
      type: 'guidance'
    });
  }

  // 2. Doctor Appointments
  calendarEvents.forEach(event => {
    if (event.type === 'appointment') {
      const eventTime = new Date(event.date).getTime();
      // Reminder 1 day before
      const reminderTime = eventTime - (24 * 60 * 60 * 1000);
      if (reminderTime > now) {
        reminders.push({
          id: `appointment-${event.id}`,
          title: `Appointment Tomorrow 🩺`,
          body: `Reminder: You have a prenatal appointment tomorrow at ${new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
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
      title: `Morning Reminder 🌅`,
      body: `Good morning mama ☀️ Time to take your prenatal vitamins.`,
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
