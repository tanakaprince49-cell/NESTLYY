import * as Notifications from 'expo-notifications';
import type { PregnancyProfile, FeedingLog, MedicationLog, VitaminLog, CalendarEvent } from '@nestly/shared';
import { LifecycleStage } from '@nestly/shared';

// -- Daily routine messages -------------------------------------------------

const ROUTINE_MESSAGES = [
  { hour: 8, title: 'Good Morning', body: 'Start your day with a glass of water and some deep breaths.' },
  { hour: 11, title: 'Hydration Check', body: 'Have you been drinking enough water? Aim for 8 glasses today.' },
  { hour: 14, title: 'Movement Break', body: 'Time for a gentle stretch or a short walk.' },
  { hour: 18, title: 'Healthy Dinner', body: 'Nourish yourself with a balanced meal tonight.' },
  { hour: 21, title: 'Rest & Relax', body: 'Wind down for the evening. You deserve some rest.' },
];

// -- Schedule helpers -------------------------------------------------------

async function scheduleDailyAt(
  id: string,
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function scheduleOneShot(
  id: string,
  date: Date,
  title: string,
  body: string,
): Promise<void> {
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

// -- Main scheduler ---------------------------------------------------------

export async function rescheduleAllReminders(
  profile: PregnancyProfile,
  data: {
    vitamins: VitaminLog[];
    feedingLogs: FeedingLog[];
    medicationLogs: MedicationLog[];
    calendarEvents: CalendarEvent[];
  },
): Promise<void> {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!profile.notificationsEnabled) return;

  // 1. Daily routine
  for (const msg of ROUTINE_MESSAGES) {
    await scheduleDailyAt(
      `routine-${msg.hour}`,
      msg.hour,
      0,
      msg.title,
      msg.body,
    );
  }

  // 2. Vitamin reminder at 9 AM (if not taken today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const vitaminTakenToday = data.vitamins.some((v) => v.timestamp >= todayStart.getTime());
  if (!vitaminTakenToday) {
    await scheduleDailyAt(
      'vitamin-daily',
      9,
      0,
      'Prenatal Vitamins',
      'Time to take your prenatal vitamins.',
    );
  }

  // 3. Feeding reminder (newborn/infant only, 3h after last feed)
  const isPostpartum =
    profile.lifecycleStage === LifecycleStage.NEWBORN ||
    profile.lifecycleStage === LifecycleStage.INFANT;
  if (isPostpartum && data.feedingLogs.length > 0) {
    const lastFeed = data.feedingLogs.reduce((latest, log) =>
      log.timestamp > latest.timestamp ? log : latest,
    );
    const nextFeedTime = new Date(lastFeed.timestamp + 3 * 60 * 60 * 1000);
    if (nextFeedTime.getTime() > Date.now()) {
      await scheduleOneShot(
        'feeding-reminder',
        nextFeedTime,
        'Feeding Time',
        "It's been 3 hours since the last feeding.",
      );
    }
  }

  // 4. Medication reminders
  for (const med of data.medicationLogs) {
    if (med.time) {
      const [h, m] = med.time.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        await scheduleDailyAt(
          `med-${med.id}`,
          h,
          m,
          'Medication Reminder',
          `Time to take your ${med.name} (${med.dosage}).`,
        );
      }
    }
  }

  // 5. Appointment reminders (1 day before)
  for (const event of data.calendarEvents) {
    if (event.type === 'appointment' && event.date) {
      const eventDate = new Date(event.date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);
      await scheduleOneShot(
        `appt-${event.id}`,
        reminderDate,
        'Appointment Tomorrow',
        `Reminder: ${event.title}${event.time ? ` at ${event.time}` : ''}.`,
      );
    }
  }

  // 6. Weekly pregnancy guidance (Monday 9 AM)
  if (profile.lifecycleStage === LifecycleStage.PREGNANCY && profile.lmpDate) {
    const lmp = new Date(profile.lmpDate);
    const now = new Date();
    const weeksPregnant = Math.floor((now.getTime() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksPregnant >= 4 && weeksPregnant <= 42) {
      await scheduleDailyAt(
        'weekly-guidance',
        9,
        0,
        `Week ${weeksPregnant}`,
        `You're ${weeksPregnant} weeks along! Check your dashboard for this week's updates.`,
      );
    }
  }
}
