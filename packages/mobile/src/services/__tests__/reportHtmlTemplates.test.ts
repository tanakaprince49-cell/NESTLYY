import {
  LifecycleStage,
  type BabyAvatar,
  type BloodPressureLog,
  type DiaperLog,
  type FeedingLog,
  type FoodEntry,
  type KegelLog,
  type KickLog,
  type MedicationLog,
  type MemoryAlbums,
  type PregnancyProfile,
  type SleepLog,
  type SymptomLog,
  type WeightLog,
} from '@nestly/shared';
import { buildDoctorSummaryHtml } from '../reportHtmlTemplates';

// Fixed reference time so snapshots don't drift between runs. Picked a UTC
// midday instant that falls cleanly inside a single day in every timezone the
// repo's CI + Zimbabwe (UTC+2) target use.
const NOW = new Date('2026-04-22T10:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

const EMPTY_ALBUMS: MemoryAlbums = {
  bump: [],
  baby: [],
  ultrasound: [],
  nursery: [],
  family: [],
  other: [],
};

function baby(name: string, idx = 0): BabyAvatar {
  return {
    id: `baby-${idx}`,
    name,
    skinTone: 'tone1',
    gender: 'neutral',
    birthDate: '2026-04-15',
    birthWeight: 3.2,
  };
}

function pregnancyProfile(): PregnancyProfile {
  return {
    userName: 'Rumbi',
    lmpDate: '2025-07-15',
    dueDate: '2026-04-22',
    isManualDueDate: false,
    pregnancyType: 'singleton',
    babies: [baby('Zanele')],
    themeColor: 'pink',
    albums: EMPTY_ALBUMS,
    lifecycleStage: LifecycleStage.PREGNANCY,
  };
}

function newbornProfile(): PregnancyProfile {
  return {
    userName: 'Tinashe',
    lmpDate: '2025-07-15',
    dueDate: '2026-04-15',
    isManualDueDate: false,
    pregnancyType: 'singleton',
    babies: [baby('Farai')],
    themeColor: 'blue',
    albums: EMPTY_ALBUMS,
    lifecycleStage: LifecycleStage.NEWBORN,
  };
}

function prePregnancyProfile(): PregnancyProfile {
  return {
    userName: 'Chipo',
    lmpDate: '2026-04-01',
    dueDate: '2027-01-05',
    isManualDueDate: true,
    pregnancyType: 'singleton',
    babies: [],
    themeColor: 'orange',
    albums: EMPTY_ALBUMS,
    lifecycleStage: LifecycleStage.PRE_PREGNANCY,
  };
}

const BABY_ID = 'baby-0';

describe('buildDoctorSummaryHtml snapshots', () => {
  it('pregnancy stage, 14 days of vitals + nutrition + symptoms + meds', () => {
    const weightLogs: WeightLog[] = [
      { id: 'w1', weight: 68.2, timestamp: NOW.getTime() - 1 * DAY },
      { id: 'w2', weight: 67.9, timestamp: NOW.getTime() - 7 * DAY },
      { id: 'w3', weight: 67.5, timestamp: NOW.getTime() - 13 * DAY },
    ];
    const bloodPressureLogs: BloodPressureLog[] = [
      { id: 'bp1', systolic: 118, diastolic: 76, pulse: 82, timestamp: NOW.getTime() - 2 * DAY },
      { id: 'bp2', systolic: 122, diastolic: 80, timestamp: NOW.getTime() - 9 * DAY },
    ];
    const sleepLogs: SleepLog[] = [
      {
        id: 's1',
        userId: 'u',
        startTime: new Date(NOW.getTime() - 1 * DAY - 8 * 3600 * 1000).toISOString(),
        endTime: new Date(NOW.getTime() - 1 * DAY).toISOString(),
        mode: 'pregnancy',
        type: 'night',
        timestamp: NOW.getTime() - 1 * DAY - 8 * 3600 * 1000,
      },
      {
        id: 's2',
        userId: 'u',
        startTime: new Date(NOW.getTime() - 3 * DAY - 7 * 3600 * 1000).toISOString(),
        endTime: new Date(NOW.getTime() - 3 * DAY).toISOString(),
        mode: 'pregnancy',
        type: 'night',
        timestamp: NOW.getTime() - 3 * DAY - 7 * 3600 * 1000,
      },
    ];
    const symptoms: SymptomLog[] = [
      { id: 'sy1', type: 'Nausea', severity: 4, timestamp: NOW.getTime() - 1 * DAY },
      { id: 'sy2', type: 'Back pain', severity: 6, timestamp: NOW.getTime() - 5 * DAY },
    ];
    const kickLogs: KickLog[] = [
      { id: 'k1', babyId: BABY_ID, timestamp: NOW.getTime() - 1 * DAY, count: 10 },
      { id: 'k2', babyId: BABY_ID, timestamp: NOW.getTime() - 2 * DAY, count: 8 },
    ];
    const kegelLogs: KegelLog[] = [
      { id: 'kg1', duration: 120, timestamp: NOW.getTime() - 1 * DAY },
      { id: 'kg2', duration: 90, timestamp: NOW.getTime() - 4 * DAY },
    ];
    const foodEntries: FoodEntry[] = [
      { id: 'f1', name: 'Oats', calories: 300, protein: 10, folate: 50, iron: 2, calcium: 100, timestamp: NOW.getTime() - 1 * DAY },
      { id: 'f2', name: 'Lentils', calories: 450, protein: 25, folate: 180, iron: 5, calcium: 40, timestamp: NOW.getTime() - 2 * DAY },
    ];
    const medicationLogs: MedicationLog[] = [
      { id: 'm1', name: 'Folic acid', dosage: '400mcg', timestamp: NOW.getTime() - 1 * DAY },
      { id: 'm2', name: 'Iron', dosage: '30mg', timestamp: NOW.getTime() - 3 * DAY },
    ];

    const html = buildDoctorSummaryHtml({
      profile: pregnancyProfile(),
      now: NOW,
      weightLogs,
      bloodPressureLogs,
      sleepLogs,
      symptoms,
      kickLogs,
      kegelLogs,
      foodEntries,
      feedingLogs: [],
      diaperLogs: [],
      medicationLogs,
    });

    expect(html).toMatchSnapshot();
  });

  it('newborn stage, 14 days of feedings + diapers', () => {
    const feedingLogs: FeedingLog[] = [
      { id: 'fd1', babyId: BABY_ID, type: 'breast', side: 'left', amount: 120, duration: 15, timestamp: NOW.getTime() - 1 * DAY },
      { id: 'fd2', babyId: BABY_ID, type: 'bottle', subType: 'formula', amount: 90, timestamp: NOW.getTime() - 1 * DAY - 3600 * 1000 },
      { id: 'fd3', babyId: BABY_ID, type: 'breast', side: 'right', amount: 110, duration: 12, timestamp: NOW.getTime() - 2 * DAY },
    ];
    const diaperLogs: DiaperLog[] = [
      { id: 'd1', babyId: BABY_ID, type: 'wet', timestamp: NOW.getTime() - 1 * DAY },
      { id: 'd2', babyId: BABY_ID, type: 'dirty', timestamp: NOW.getTime() - 1 * DAY - 2 * 3600 * 1000 },
      { id: 'd3', babyId: BABY_ID, type: 'mixed', timestamp: NOW.getTime() - 2 * DAY },
    ];
    const sleepLogs: SleepLog[] = [
      {
        id: 's1',
        userId: 'u',
        babyId: BABY_ID,
        startTime: new Date(NOW.getTime() - 1 * DAY - 3 * 3600 * 1000).toISOString(),
        endTime: new Date(NOW.getTime() - 1 * DAY).toISOString(),
        mode: 'newborn',
        type: 'nap',
        timestamp: NOW.getTime() - 1 * DAY - 3 * 3600 * 1000,
      },
    ];
    const medicationLogs: MedicationLog[] = [
      { id: 'm1', name: 'Vitamin D drops', dosage: '400IU', timestamp: NOW.getTime() - 2 * DAY },
    ];

    const html = buildDoctorSummaryHtml({
      profile: newbornProfile(),
      now: NOW,
      weightLogs: [],
      bloodPressureLogs: [],
      sleepLogs,
      symptoms: [],
      kickLogs: [],
      kegelLogs: [],
      foodEntries: [],
      feedingLogs,
      diaperLogs,
      medicationLogs,
    });

    expect(html).toMatchSnapshot();
  });

  it('pre-pregnancy stage, sparse vitals only, no symptoms, no meds', () => {
    const weightLogs: WeightLog[] = [
      { id: 'w1', weight: 62.0, timestamp: NOW.getTime() - 3 * DAY },
    ];
    const bloodPressureLogs: BloodPressureLog[] = [
      { id: 'bp1', systolic: 115, diastolic: 72, timestamp: NOW.getTime() - 5 * DAY },
    ];

    const html = buildDoctorSummaryHtml({
      profile: prePregnancyProfile(),
      now: NOW,
      weightLogs,
      bloodPressureLogs,
      sleepLogs: [],
      symptoms: [],
      kickLogs: [],
      kegelLogs: [],
      foodEntries: [],
      feedingLogs: [],
      diaperLogs: [],
      medicationLogs: [],
    });

    expect(html).toMatchSnapshot();
  });
});
