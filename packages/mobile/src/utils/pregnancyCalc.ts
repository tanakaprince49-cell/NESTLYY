import { Trimester } from '@nestly/shared';
import { parseLocalIsoDate } from './dates';

// Parse a YYYY-MM-DD string as local midnight. Falls back to the built-in
// Date constructor for any non-YYYY-MM-DD input (e.g. full ISO timestamps),
// so this stays a drop-in replacement. Using parseLocalIsoDate for calendar
// strings matters because `new Date("2025-03-15")` is parsed as UTC, which
// shifts the week/day computation by the device offset in positive zones
// like Zimbabwe (UTC+2). See #232.
function toLocalDate(dateString: string): Date {
  return parseLocalIsoDate(dateString) ?? new Date(dateString);
}

export function getWeeksAndDays(lmpDate: string): { weeks: number; days: number } {
  const diff = Date.now() - toLocalDate(lmpDate).getTime();
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export function getTrimester(weeks: number): Trimester {
  if (weeks < 13) return Trimester.FIRST;
  if (weeks < 27) return Trimester.SECOND;
  return Trimester.THIRD;
}

export function getDueDate(lmpDate: string): Date {
  const lmp = toLocalDate(lmpDate);
  return new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
}

export function getWeeksRemaining(lmpDate: string): number {
  const due = getDueDate(lmpDate);
  const diff = due.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)));
}

export function getBabyAge(birthDate: string): { months: number; weeks: number; days: number } {
  const diff = Date.now() - toLocalDate(birthDate).getTime();
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30.44);
  const remainingDays = totalDays - Math.floor(months * 30.44);
  const weeks = Math.floor(remainingDays / 7);
  const days = remainingDays % 7;
  return { months, weeks, days };
}

export function formatBabyAge(birthDate: string): string {
  const { months, weeks, days } = getBabyAge(birthDate);
  if (months > 0) return `${months}m ${weeks}w`;
  if (weeks > 0) return `${weeks}w ${days}d`;
  return `${days} day${days !== 1 ? 's' : ''}`;
}

export function validateLmpDate(date: Date): string | null {
  // Reject anything on or after tomorrow (local time). Using start-of-tomorrow
  // as the boundary avoids rejecting "today" in positive UTC offsets.
  const now = new Date();
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  if (date >= startOfTomorrow) return 'Date cannot be in the future';
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 300) return 'More than 42 weeks ago, please check';
  return null;
}
