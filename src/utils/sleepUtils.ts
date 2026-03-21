import { format, differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import type { SleepLog, SleepMode, SleepQuality } from '../../types';
export type { SleepLog, SleepMode, SleepQuality };

export const calculateDurationMinutes = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isAfter(startDate, endDate)) {
    // Handle overnight sleep (crossing midnight)
    const adjustedEndDate = addDays(endDate, 1);
    return Math.max(0, differenceInMinutes(adjustedEndDate, startDate));
  }
  
  return Math.max(0, differenceInMinutes(endDate, startDate));
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const getSleepType = (startTime: string): 'night' | 'nap' => {
  const hour = new Date(startTime).getHours();
  return (hour >= 19 || hour <= 4) ? 'night' : 'nap';
};

export const generateInsights = (sessions: SleepLog[], mode: SleepMode): string[] => {
  const insights: string[] = [];
  const today = startOfDay(new Date());
  const todaySessions = sessions.filter(s => new Date(s.startTime) >= today);
  
  const totalMinutesToday = todaySessions.reduce((acc, s) => acc + calculateDurationMinutes(s.startTime, s.endTime), 0);

  if (mode === 'pregnancy') {
    if (totalMinutesToday > 0) {
      const durationStr = formatDuration(totalMinutesToday);
      if (totalMinutesToday < 420) { // < 7h
        insights.push(`You slept ${durationStr}, which looks below the recommended 7–9h.`);
      } else {
        insights.push(`You slept ${durationStr}, which is within the healthy range.`);
      }
    }
    
    const recentSessions = sessions.slice(-5);
    const goodQualityCount = recentSessions.filter(s => s.quality === 'good').length;
    if (goodQualityCount >= 3) {
      insights.push("It looks like your sleep quality is improving this week.");
    }
  } else {
    // Newborn mode
    const napCount = todaySessions.filter(s => s.type === 'nap').length;
    if (napCount > 5) {
      insights.push("Baby had more naps than usual today.");
    }
    
    const nightSessions = todaySessions.filter(s => s.type === 'night');
    if (nightSessions.length > 3) {
      insights.push("Baby woke up more frequently than usual last night.");
    }
  }

  return insights.length > 0 ? insights : ["Keep tracking to see smart insights!"];
};
