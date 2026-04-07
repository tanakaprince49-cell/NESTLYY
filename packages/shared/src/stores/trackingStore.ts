import { create } from 'zustand';
import type {
  FoodEntry,
  SymptomLog,
  VitaminLog,
  Contraction,
  JournalEntry,
  CalendarEvent,
  WeightLog,
  SleepLog,
  FeedingLog,
  MilestoneLog,
  HealthLog,
  ReactionLog,
  BabyGrowthLog,
  TummyTimeLog,
  BloodPressureLog,
  KickLog,
  KegelLog,
  DiaperLog,
  MedicationLog,
} from '../types.ts';

const genId = (): string =>
  crypto.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2));

interface TrackingState {
  entries: FoodEntry[];
  symptoms: SymptomLog[];
  vitamins: VitaminLog[];
  contractions: Contraction[];
  journalEntries: JournalEntry[];
  calendarEvents: CalendarEvent[];
  weightLogs: WeightLog[];
  sleepLogs: SleepLog[];
  feedingLogs: FeedingLog[];
  milestones: MilestoneLog[];
  healthLogs: HealthLog[];
  reactions: ReactionLog[];
  babyGrowthLogs: BabyGrowthLog[];
  tummyTimeLogs: TummyTimeLog[];
  bloodPressureLogs: BloodPressureLog[];
  kickLogs: KickLog[];
  kegelLogs: KegelLog[];
  diaperLogs: DiaperLog[];
  medicationLogs: MedicationLog[];

  addEntry: (log: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  setEntries: (logs: FoodEntry[]) => void;

  addSymptom: (log: Omit<SymptomLog, 'id' | 'timestamp'>) => void;
  removeSymptom: (id: string) => void;
  setSymptoms: (logs: SymptomLog[]) => void;

  addVitamin: (log: Omit<VitaminLog, 'id' | 'timestamp'>) => void;
  removeVitamin: (id: string) => void;
  setVitamins: (logs: VitaminLog[]) => void;

  addContraction: (log: Omit<Contraction, 'id'>) => void;
  removeContraction: (id: string) => void;
  setContractions: (logs: Contraction[]) => void;

  addJournalEntry: (log: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  removeJournalEntry: (id: string) => void;
  setJournalEntries: (logs: JournalEntry[]) => void;

  addCalendarEvent: (log: Omit<CalendarEvent, 'id'>) => void;
  removeCalendarEvent: (id: string) => void;
  setCalendarEvents: (logs: CalendarEvent[]) => void;

  addWeightLog: (log: Omit<WeightLog, 'id' | 'timestamp'>) => void;
  removeWeightLog: (id: string) => void;
  setWeightLogs: (logs: WeightLog[]) => void;

  addSleepLog: (log: Omit<SleepLog, 'id' | 'timestamp'>) => void;
  removeSleepLog: (id: string) => void;
  setSleepLogs: (logs: SleepLog[]) => void;

  addFeedingLog: (log: Omit<FeedingLog, 'id' | 'timestamp'>) => void;
  removeFeedingLog: (id: string) => void;
  setFeedingLogs: (logs: FeedingLog[]) => void;

  addMilestone: (log: Omit<MilestoneLog, 'id' | 'timestamp'>) => void;
  removeMilestone: (id: string) => void;
  setMilestones: (logs: MilestoneLog[]) => void;

  addHealthLog: (log: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  removeHealthLog: (id: string) => void;
  setHealthLogs: (logs: HealthLog[]) => void;

  addReaction: (log: Omit<ReactionLog, 'id' | 'timestamp'>) => void;
  removeReaction: (id: string) => void;
  setReactions: (logs: ReactionLog[]) => void;

  addBabyGrowthLog: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
  removeBabyGrowthLog: (id: string) => void;
  setBabyGrowthLogs: (logs: BabyGrowthLog[]) => void;

  addTummyTimeLog: (log: Omit<TummyTimeLog, 'id' | 'timestamp'>) => void;
  removeTummyTimeLog: (id: string) => void;
  setTummyTimeLogs: (logs: TummyTimeLog[]) => void;

  addBloodPressureLog: (log: Omit<BloodPressureLog, 'id' | 'timestamp'>) => void;
  removeBloodPressureLog: (id: string) => void;
  setBloodPressureLogs: (logs: BloodPressureLog[]) => void;

  addKickLog: (log: Omit<KickLog, 'id' | 'timestamp'>) => void;
  removeKickLog: (id: string) => void;
  setKickLogs: (logs: KickLog[]) => void;

  addKegelLog: (log: Omit<KegelLog, 'id' | 'timestamp'>) => void;
  removeKegelLog: (id: string) => void;
  setKegelLogs: (logs: KegelLog[]) => void;

  addDiaperLog: (log: Omit<DiaperLog, 'id' | 'timestamp'>) => void;
  removeDiaperLog: (id: string) => void;
  setDiaperLogs: (logs: DiaperLog[]) => void;

  addMedicationLog: (log: Omit<MedicationLog, 'id' | 'timestamp'>) => void;
  removeMedicationLog: (id: string) => void;
  setMedicationLogs: (logs: MedicationLog[]) => void;

  resetAllLogs: () => void;
}

export const useTrackingStore = create<TrackingState>()((set) => ({
  entries: [],
  symptoms: [],
  vitamins: [],
  contractions: [],
  journalEntries: [],
  calendarEvents: [],
  weightLogs: [],
  sleepLogs: [],
  feedingLogs: [],
  milestones: [],
  healthLogs: [],
  reactions: [],
  babyGrowthLogs: [],
  tummyTimeLogs: [],
  bloodPressureLogs: [],
  kickLogs: [],
  kegelLogs: [],
  diaperLogs: [],
  medicationLogs: [],

  addEntry: (log) =>
    set((s) => ({ entries: [...s.entries, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((l) => l.id !== id) })),
  setEntries: (logs) => set({ entries: logs }),

  addSymptom: (log) =>
    set((s) => ({ symptoms: [...s.symptoms, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeSymptom: (id) => set((s) => ({ symptoms: s.symptoms.filter((l) => l.id !== id) })),
  setSymptoms: (logs) => set({ symptoms: logs }),

  addVitamin: (log) =>
    set((s) => ({ vitamins: [...s.vitamins, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeVitamin: (id) => set((s) => ({ vitamins: s.vitamins.filter((l) => l.id !== id) })),
  setVitamins: (logs) => set({ vitamins: logs }),

  addContraction: (log) =>
    set((s) => ({ contractions: [...s.contractions, { ...log, id: genId() }] })),
  removeContraction: (id) =>
    set((s) => ({ contractions: s.contractions.filter((l) => l.id !== id) })),
  setContractions: (logs) => set({ contractions: logs }),

  addJournalEntry: (log) =>
    set((s) => ({
      journalEntries: [...s.journalEntries, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeJournalEntry: (id) =>
    set((s) => ({ journalEntries: s.journalEntries.filter((l) => l.id !== id) })),
  setJournalEntries: (logs) => set({ journalEntries: logs }),

  addCalendarEvent: (log) =>
    set((s) => ({ calendarEvents: [...s.calendarEvents, { ...log, id: genId() }] })),
  removeCalendarEvent: (id) =>
    set((s) => ({ calendarEvents: s.calendarEvents.filter((l) => l.id !== id) })),
  setCalendarEvents: (logs) => set({ calendarEvents: logs }),

  addWeightLog: (log) =>
    set((s) => ({ weightLogs: [...s.weightLogs, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeWeightLog: (id) => set((s) => ({ weightLogs: s.weightLogs.filter((l) => l.id !== id) })),
  setWeightLogs: (logs) => set({ weightLogs: logs }),

  addSleepLog: (log) =>
    set((s) => ({ sleepLogs: [...s.sleepLogs, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeSleepLog: (id) => set((s) => ({ sleepLogs: s.sleepLogs.filter((l) => l.id !== id) })),
  setSleepLogs: (logs) => set({ sleepLogs: logs }),

  addFeedingLog: (log) =>
    set((s) => ({
      feedingLogs: [...s.feedingLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeFeedingLog: (id) =>
    set((s) => ({ feedingLogs: s.feedingLogs.filter((l) => l.id !== id) })),
  setFeedingLogs: (logs) => set({ feedingLogs: logs }),

  addMilestone: (log) =>
    set((s) => ({
      milestones: [...s.milestones, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeMilestone: (id) => set((s) => ({ milestones: s.milestones.filter((l) => l.id !== id) })),
  setMilestones: (logs) => set({ milestones: logs }),

  addHealthLog: (log) =>
    set((s) => ({
      healthLogs: [...s.healthLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeHealthLog: (id) => set((s) => ({ healthLogs: s.healthLogs.filter((l) => l.id !== id) })),
  setHealthLogs: (logs) => set({ healthLogs: logs }),

  addReaction: (log) =>
    set((s) => ({
      reactions: [...s.reactions, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeReaction: (id) => set((s) => ({ reactions: s.reactions.filter((l) => l.id !== id) })),
  setReactions: (logs) => set({ reactions: logs }),

  addBabyGrowthLog: (log) =>
    set((s) => ({
      babyGrowthLogs: [...s.babyGrowthLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeBabyGrowthLog: (id) =>
    set((s) => ({ babyGrowthLogs: s.babyGrowthLogs.filter((l) => l.id !== id) })),
  setBabyGrowthLogs: (logs) => set({ babyGrowthLogs: logs }),

  addTummyTimeLog: (log) =>
    set((s) => ({
      tummyTimeLogs: [...s.tummyTimeLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeTummyTimeLog: (id) =>
    set((s) => ({ tummyTimeLogs: s.tummyTimeLogs.filter((l) => l.id !== id) })),
  setTummyTimeLogs: (logs) => set({ tummyTimeLogs: logs }),

  addBloodPressureLog: (log) =>
    set((s) => ({
      bloodPressureLogs: [...s.bloodPressureLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeBloodPressureLog: (id) =>
    set((s) => ({ bloodPressureLogs: s.bloodPressureLogs.filter((l) => l.id !== id) })),
  setBloodPressureLogs: (logs) => set({ bloodPressureLogs: logs }),

  addKickLog: (log) =>
    set((s) => ({ kickLogs: [...s.kickLogs, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeKickLog: (id) => set((s) => ({ kickLogs: s.kickLogs.filter((l) => l.id !== id) })),
  setKickLogs: (logs) => set({ kickLogs: logs }),

  addKegelLog: (log) =>
    set((s) => ({ kegelLogs: [...s.kegelLogs, { ...log, id: genId(), timestamp: Date.now() }] })),
  removeKegelLog: (id) => set((s) => ({ kegelLogs: s.kegelLogs.filter((l) => l.id !== id) })),
  setKegelLogs: (logs) => set({ kegelLogs: logs }),

  addDiaperLog: (log) =>
    set((s) => ({
      diaperLogs: [...s.diaperLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeDiaperLog: (id) => set((s) => ({ diaperLogs: s.diaperLogs.filter((l) => l.id !== id) })),
  setDiaperLogs: (logs) => set({ diaperLogs: logs }),

  addMedicationLog: (log) =>
    set((s) => ({
      medicationLogs: [...s.medicationLogs, { ...log, id: genId(), timestamp: Date.now() }],
    })),
  removeMedicationLog: (id) =>
    set((s) => ({ medicationLogs: s.medicationLogs.filter((l) => l.id !== id) })),
  setMedicationLogs: (logs) => set({ medicationLogs: logs }),

  resetAllLogs: () =>
    set({
      entries: [],
      symptoms: [],
      vitamins: [],
      contractions: [],
      journalEntries: [],
      calendarEvents: [],
      weightLogs: [],
      sleepLogs: [],
      feedingLogs: [],
      milestones: [],
      healthLogs: [],
      reactions: [],
      babyGrowthLogs: [],
      tummyTimeLogs: [],
      bloodPressureLogs: [],
      kickLogs: [],
      kegelLogs: [],
      diaperLogs: [],
      medicationLogs: [],
    }),
}));
