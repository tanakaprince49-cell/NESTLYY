import { storage } from './storageService.ts';
import { PregnancyProfile, CalendarEvent, VitaminLog, FeedingLog, SleepLog, MilestoneLog, LifecycleStage, MedicationLog, messaging, auth } from '@nestly/shared';
import { getToken, onMessage } from 'firebase/messaging';

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

const BRAND_LOGO = "/logo.webp";

/**
 * Ensure Service Worker is registered
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    }

    return registration;
  } catch (e) {
    console.warn('Service worker registration failed:', e);
    return null;
  }
}

/**
 * Subscribe user to Firebase Push Notifications
 */
export async function subscribeUserToPush() {
  try {
    if (typeof window === 'undefined' || !messaging || !('Notification' in window)) return null;

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
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/push/token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
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

let isForegroundMessagingSetup = false;

/**
 * Listen for foreground messages
 */
export function setupForegroundMessaging() {
  if (!messaging || isForegroundMessagingSetup) return;
  
  isForegroundMessagingSetup = true;
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    // Only show manual notification if the browser doesn't handle it automatically
    // and if it's not a duplicate.
    if (payload.notification) {
      const title = payload.notification.title || 'Nestly';
      const body = payload.notification.body || '';
      
      // We use a stable tag to avoid duplicates if multiple messages arrive
      const tag = `nestly-foreground-${title.replace(/\s+/g, '-').toLowerCase()}`;
      
      showLocalNotification(title, body, tag);
    }
  });
}

// Keep a global reference to prevent garbage collection during playback
const activeAudio: HTMLAudioElement[] = [];

/**
 * Show a LOCAL notification (client only)
 */
export async function showLocalNotification(
  title: string,
  body: string,
  tag?: string
) {
  try {
    if (Notification.permission !== 'granted') {
      return { success: false, error: 'Permission not granted' };
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return { success: false, error: 'Service Worker not registered' };
    }

    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      activeAudio.push(audio);
      audio.onended = () => {
        const index = activeAudio.indexOf(audio);
        if (index > -1) activeAudio.splice(index, 1);
      };
      await audio.play();
    } catch (e) {
      console.warn("Audio playback failed", e);
    }

    await registration.showNotification(title, {
      body,
      icon: BRAND_LOGO,
      badge: BRAND_LOGO,
      vibrate: [200, 100, 200, 100, 400],
      tag: tag || `nestly-${Date.now()}`,
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
  milestones: MilestoneLog[],
  medicationLogs: MedicationLog[]
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

  // 2. Doctor Appointments & Reminders
  calendarEvents.forEach(event => {
    const eventDate = new Date(event.date);
    if (event.time) {
      const [hours, minutes] = event.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    const eventTime = eventDate.getTime();

    if (event.type === 'appointment') {
      // Reminder 1 day before
      const reminderTime = eventTime - (24 * 60 * 60 * 1000);
      if (reminderTime > now) {
        reminders.push({
          id: `appointment-${event.id}`,
          title: `Appointment Tomorrow 🩺`,
          body: `Reminder: You have a prenatal appointment tomorrow at ${event.time || new Date(eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          timestamp: reminderTime,
          type: 'appointment'
        });
      }
    } else if (event.type === 'reminder') {
      // Direct reminder at the specified time
      if (eventTime > now) {
        reminders.push({
          id: `calendar-reminder-${event.id}`,
          title: `Reminder: ${event.title} 🔔`,
          body: `It's time for: ${event.title}`,
          timestamp: eventTime,
          type: 'reminder'
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

  // 5. Medication Reminders
  medicationLogs.forEach(med => {
    // Use dedicated time field if available, otherwise try to parse from dosage
    let hours: number | null = null;
    let minutes: number | null = null;

    if (med.time) {
      const [h, m] = med.time.split(':');
      hours = parseInt(h);
      minutes = parseInt(m);
    } else {
      const timeMatch = med.dosage.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }

    if (hours !== null && minutes !== null) {
      const medTime = new Date();
      medTime.setHours(hours, minutes, 0, 0);
      
      if (medTime.getTime() <= now) {
        medTime.setDate(medTime.getDate() + 1);
      }

      reminders.push({
        id: `med-reminder-${med.id}-${medTime.getTime()}`,
        title: `Medication Reminder 💊`,
        body: `Time to take your ${med.name} (${med.dosage}).`,
        timestamp: medTime.getTime(),
        type: 'medication'
      });
    }
  });

  // Add to storage if not already present
  const existingReminders = storage.getReminders();
  reminders.forEach(r => {
    if (!existingReminders.find(er => er.id === r.id)) {
      storage.addReminder(r);
    }
  });

  // 5. Daily Routine Notifications (5 per day)
  scheduleDailyRoutine(profile);
}

/**
 * Schedule 5 daily routine notifications
 */
function scheduleDailyRoutine(profile: PregnancyProfile) {
  if (!profile.notificationsEnabled) return;

  const now = new Date();
  const routineMessages = [
    { time: 8, title: "Good Morning Mama 🌅", body: "Start your day with a glass of water and a deep breath. You're doing great!" },
    { time: 11, title: "Hydration Check 💧", body: "Remember to keep drinking water. It's important for you and baby!" },
    { time: 14, title: "Movement Break 🧘‍♀️", body: "Time for a quick stretch or a short walk if you're feeling up to it." },
    { time: 18, title: "Healthy Dinner 🥗", body: "Focus on nutrients tonight. How about some leafy greens or lean protein?" },
    { time: 21, title: "Rest & Relax 🌙", body: "Wind down for the night. You've earned a good night's sleep!" }
  ];

  const existingReminders = storage.getReminders();

  routineMessages.forEach(msg => {
    const scheduledTime = new Date();
    scheduledTime.setHours(msg.time, 0, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime.getTime() <= now.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const id = `daily-routine-${msg.time}-${scheduledTime.toDateString()}`;
    
    if (!existingReminders.find(er => er.id === id)) {
      storage.addReminder({
        id,
        title: msg.title,
        body: msg.body,
        timestamp: scheduledTime.getTime(),
        type: 'routine'
      });
    }
  });
}

/**
 * Process and show due reminders
 */
export async function processReminders() {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

  const allReminders = [...storage.getReminders(), ...storage.getBroadcasts()];
  const shownReminders = storage.getShownReminders();
  const shownIds = shownReminders.map(s => s.id);
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);

  // Check daily limit (5 per day)
  const shownToday = shownReminders.filter(s => s.timestamp >= todayStart);
  if (shownToday.length >= 5) {
    // If we've already shown 5 today, we skip processing more
    // but we might want to mark them as "skipped" so they don't pile up for tomorrow
    // Actually, let's just return.
    return;
  }

  // Filter due reminders
  const dueReminders = allReminders.filter(r => 
    !shownIds.includes(r.id) && 
    r.timestamp <= now
  );

  for (const reminder of dueReminders) {
    try {
      // If the reminder is older than 2 hours, don't show it (stale)
      // This addresses the "missed morning notification should not show up" request
      if (reminder.timestamp < twoHoursAgo) {
        storage.markReminderAsShown(reminder.id);
        continue;
      }

      // To prevent "spamming many at once", we only show the most recent due reminder
      // and skip others if they are all firing at the same time.
      const result = await showLocalNotification(reminder.title, reminder.body);
      if (result.success) {
        storage.markReminderAsShown(reminder.id);
        // After showing one, we break to avoid spamming. 
        break; 
      }
    } catch (e) {
      // Silent fail
    }
  }
}
