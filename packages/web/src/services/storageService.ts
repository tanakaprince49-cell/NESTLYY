import {
  PregnancyProfile,
  FoodEntry,
  SymptomLog,
  VitaminLog,
  Contraction,
  JournalEntry,
  CalendarEvent,
  WeightLog,
  SleepLog,
  MilestoneLog,
  HealthLog,
  ReactionLog,
  KickLog,
  KegelLog,
  MemoryAlbums,
  MemoryPhoto,
  UserLog,
  FeedingLog,
  TummyTimeLog,
  BloodPressureLog,
  BabyGrowthLog,
  DiaperLog,
  MedicationLog,
  PeriodLog,
  Article,
  ArchivedPregnancy,
  ChecklistItem,
  Video,
  ZeroDataExportV1,
  getLocalIdentitySync,
  LOCAL_UUID_KEY,
  purgeAvaOrphansSync,
  detectStaleWebPushSync,
  searchNutrition,
} from '@nestly/shared';
import { restoreUserScopedKeys, wipeUserScopedKeys } from './webExportAdapter.ts';

export const KEYS = {
  PROFILE: 'profile_v5',
  FOOD: 'food_entries',
  SYMPTOMS: 'symptoms',
  VITAMINS: 'vitamins',
  CONTRACTIONS: 'contractions',
  JOURNAL: 'journal',
  CALENDAR: 'calendar',
  ACTIVITY_LOGS: 'nestly_activity_logs',
  VISITS: 'nestly_visit_count',
  WEIGHT: 'weight_logs',
  SLEEP: 'sleep_logs',
  KICKS: 'kick_logs',
  PERIOD_LOGS: 'period_logs',
  UNLOCKED_IDS: 'unlocked_achievement_ids',
  ARTICLES: 'nestly_global_articles',
  ARCHIVE: 'pregnancy_archive',
  CHECKLISTS: 'checklists',
  REACTIONS: 'baby_reactions',
  FEEDING: 'feeding_logs',
  MILESTONES: 'baby_milestones',
  HEALTH: 'baby_health_logs',
  BABY_GROWTH: 'baby_growth_logs',
  DIAPER: 'baby_diaper_logs',
  REMINDERS: 'nestly_reminders',
  SHOWN_REMINDERS: 'nestly_shown_reminders',
  VIDEOS: 'nestly_global_videos',
  BABY_NAMES: 'baby_names',
  BUMP_PHOTOS: 'bump_photos',
  MEDICATIONS: 'medication_logs',
  TUMMY_TIME: 'tummy_time_logs',
  BLOOD_PRESSURE: 'blood_pressure_logs',
  KEGELS: 'kegel_logs',
  PRIVACY_ACCEPTED: 'privacy_accepted',
  LAST_WEEK_CELEBRATED: 'last_week_celebrated',
  RECENT_FOOD_PICKS: 'recent_food_picks',
  RECENT_REPORTS: 'nestly_recent_reports',
  SLEEP_SESSIONS: 'sleep_sessions',
};

// Keys written unscoped via isGlobal=true — device-wide telemetry or seeded
// content. These must NOT be wiped when deleting the user's personal data.
const GLOBAL_KEYS: readonly string[] = [
  KEYS.ACTIVITY_LOGS,
  KEYS.VISITS,
  KEYS.ARTICLES,
  KEYS.VIDEOS,
];

// Everything else is written under `${uuid}_${key}` and belongs to the user.
export const USER_SCOPED_KEYS: readonly string[] = Object.values(KEYS).filter(
  (k) => !GLOBAL_KEYS.includes(k),
);

export class StorageService {
  private getLocalUuid(): string {
    return getLocalIdentitySync(
      (k) => { try { return localStorage.getItem(k); } catch { return null; } },
      (k, v) => { try { localStorage.setItem(k, v); } catch {} },
    );
  }

  private migrateFromEmailScope(uuid: string): void {
    // One-time migration: if legacy email-scoped keys exist, copy them under
    // the UUID scope and remove the originals. Handles internal testers who
    // update past this PR.
    try {
      const legacyEmail = localStorage.getItem('nestly_auth_email');
      if (!legacyEmail) return;
      for (const dataKey of Object.values(KEYS)) {
        const legacyKey = `${legacyEmail}_${dataKey}`;
        const value = localStorage.getItem(legacyKey);
        if (value !== null) {
          const newKey = `${uuid}_${dataKey}`;
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, value);
          }
          localStorage.removeItem(legacyKey);
        }
      }
      localStorage.removeItem('nestly_auth_email');
    } catch {}
  }

  private runAvaOrphanPurge(): void {
    // One-shot removal of Ava / Symptom Decoder / Custom Plan blobs that
    // stayed on-device after the code that wrote them was deleted in #295.
    // Guarded by a done flag so repeated boots do no work. See #311.
    try {
      purgeAvaOrphansSync({
        getItem: (k) => {
          try { return localStorage.getItem(k); } catch { return null; }
        },
        setItem: (k, v) => {
          try { localStorage.setItem(k, v); } catch {}
        },
        removeItem: (k) => {
          try { localStorage.removeItem(k); } catch {}
        },
        getAllKeys: () => {
          try { return Object.keys(localStorage); } catch { return []; }
        },
      });
    } catch {}
  }

  private migrateOrphanGlobalKeys(uuid: string): void {
    // Three pre-existing keys that were written unscoped into localStorage:
    //   - recent_food_picks       (FoodPicker)
    //   - nestly_recent_reports   (ExportReport)
    //   - sleep_sessions          (SleepDashboard)
    // Plus an older pre-pivot key (recent_food_research) that stored food
    // names instead of IDs. On a shared device both users saw the same data.
    // One-shot per UUID: copy each global value under `${uuid}_${key}` and
    // delete the global, so after this boot everything routes through the
    // normal user-scoped path. Guarded by a scoped flag so repeated boots
    // do no work. See #337.
    const flagKey = `${uuid}_orphan_keys_migrated_v1`;
    try {
      if (localStorage.getItem(flagKey) === 'done') return;
    } catch {
      return;
    }
    try {
      const orphanKeys = [
        KEYS.RECENT_FOOD_PICKS,
        KEYS.RECENT_REPORTS,
        KEYS.SLEEP_SESSIONS,
      ];
      for (const key of orphanKeys) {
        const globalValue = localStorage.getItem(key);
        if (globalValue !== null) {
          const scopedKey = `${uuid}_${key}`;
          if (localStorage.getItem(scopedKey) === null) {
            localStorage.setItem(scopedKey, globalValue);
          }
          localStorage.removeItem(key);
        }
      }
      // Older pre-pivot key stored food names; translate to IDs via the
      // offline nutrition database so the recent-picks UI continues to work.
      const legacyResearch = localStorage.getItem('recent_food_research');
      if (legacyResearch !== null) {
        try {
          const names = JSON.parse(legacyResearch) as unknown;
          if (Array.isArray(names)) {
            const ids = names
              .map((n) => (typeof n === 'string' ? searchNutrition(n, 1)[0]?.id : undefined))
              .filter((id): id is string => typeof id === 'string')
              .slice(0, 4);
            const scopedKey = `${uuid}_${KEYS.RECENT_FOOD_PICKS}`;
            if (ids.length > 0 && localStorage.getItem(scopedKey) === null) {
              localStorage.setItem(scopedKey, JSON.stringify(ids));
            }
          }
        } catch {}
        localStorage.removeItem('recent_food_research');
      }
      localStorage.setItem(flagKey, 'done');
    } catch {}
  }

  private runWebPushStaleDetection(uuid: string): void {
    // One-shot detection for pre-#298 users who had web Push Notifications
    // enabled. The field stayed in profile as a no-op; strip it and queue
    // a banner if the user had actually opted in. See #320.
    try {
      detectStaleWebPushSync(
        {
          getItem: (k) => {
            try { return localStorage.getItem(k); } catch { return null; }
          },
          setItem: (k, v) => {
            try { localStorage.setItem(k, v); } catch {}
          },
          removeItem: (k) => {
            try { localStorage.removeItem(k); } catch {}
          },
        },
        `${uuid}_${KEYS.PROFILE}`,
      );
    } catch {}
  }

  private _uuid: string | null = null;
  private getScope(): string {
    if (!this._uuid) {
      this._uuid = this.getLocalUuid();
      this.migrateFromEmailScope(this._uuid);
      this.migrateOrphanGlobalKeys(this._uuid);
      this.runAvaOrphanPurge();
      this.runWebPushStaleDetection(this._uuid);
    }
    return this._uuid;
  }

  private getUserKey(key: string): string {
    return `${this.getScope()}_${key}`;
  }

  private getItem<T>(key: string, defaultValue: T, isGlobal: boolean = false): T {
    const finalKey = isGlobal ? key : this.getUserKey(key);
    let saved: string | null = null;
    try { saved = localStorage.getItem(finalKey); } catch { return defaultValue; }
    if (!saved) return defaultValue;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        return defaultValue;
      }
      return parsed;
    } catch (e) {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T, isGlobal: boolean = false): void {
    try {
      const finalKey = isGlobal ? key : this.getUserKey(key);
      localStorage.setItem(finalKey, JSON.stringify(value));
    } catch (e) {
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Storage quota exceeded. Profile picture might be too large.");
      }
    }
  }

  getLocalUuidPublic(): string {
    return this.getScope();
  }

  getProfile(): PregnancyProfile | null { 
    const p = this.getItem<PregnancyProfile | null>(KEYS.PROFILE, null);
    if (p && !p.babies) p.babies = [];
    return p;
  }
  saveProfile(profile: PregnancyProfile): void { this.setItem(KEYS.PROFILE, profile); }

  hasAcceptedPrivacy(): boolean { return this.getItem<boolean>(KEYS.PRIVACY_ACCEPTED, false); }
  acceptPrivacy(): void { this.setItem(KEYS.PRIVACY_ACCEPTED, true); }

  getBabyNames(): {name: string, gender: string, rating: number}[] { 
    const val = this.getItem(KEYS.BABY_NAMES, []);
    return Array.isArray(val) ? val : [];
  }
  saveBabyNames(names: {name: string, gender: string, rating: number}[]): void { this.setItem(KEYS.BABY_NAMES, names); }

  getBumpPhotos(): {id: string, url: string, date: string, week: number}[] { 
    const val = this.getItem(KEYS.BUMP_PHOTOS, []);
    return Array.isArray(val) ? val : [];
  }
  saveBumpPhotos(photos: {id: string, url: string, date: string, week: number}[]): void { this.setItem(KEYS.BUMP_PHOTOS, photos); }

  getFoodEntries(): FoodEntry[] { return this.getItem<FoodEntry[]>(KEYS.FOOD, []); }
  addFoodEntry(entry: FoodEntry): void { this.setItem(KEYS.FOOD, [entry, ...this.getFoodEntries()]); }
  removeFoodEntry(id: string): void { this.setItem(KEYS.FOOD, this.getFoodEntries().filter(e => e.id !== id)); }

  getRecentFoodPicks(): string[] { return this.getItem<string[]>(KEYS.RECENT_FOOD_PICKS, []); }
  setRecentFoodPicks(ids: string[]): void { this.setItem(KEYS.RECENT_FOOD_PICKS, ids); }

  getRecentReports(): { start: string; end: string; id: string }[] {
    return this.getItem<{ start: string; end: string; id: string }[]>(KEYS.RECENT_REPORTS, []);
  }
  setRecentReports(reports: { start: string; end: string; id: string }[]): void {
    this.setItem(KEYS.RECENT_REPORTS, reports);
  }

  getSleepSessions(): SleepLog[] { return this.getItem<SleepLog[]>(KEYS.SLEEP_SESSIONS, []); }
  setSleepSessions(sessions: SleepLog[]): void { this.setItem(KEYS.SLEEP_SESSIONS, sessions); }

  getWeightLogs(): WeightLog[] { return this.getItem<WeightLog[]>(KEYS.WEIGHT, []); }
  addWeightLog(log: WeightLog): void { this.setItem(KEYS.WEIGHT, [log, ...this.getWeightLogs()]); }

  getSleepLogs(): SleepLog[] { return this.getItem<SleepLog[]>(KEYS.SLEEP, []); }
  addSleepLog(log: SleepLog): void { this.setItem(KEYS.SLEEP, [log, ...this.getSleepLogs()]); }
  removeSleepLog(id: string): void { this.setItem(KEYS.SLEEP, this.getSleepLogs().filter(e => e.id !== id)); }

  getKickLogs(): KickLog[] { return this.getItem<KickLog[]>(KEYS.KICKS, []); }
  addKickLog(log: KickLog): void { this.setItem(KEYS.KICKS, [log, ...this.getKickLogs()]); }

  getReactions(): ReactionLog[] { return this.getItem<ReactionLog[]>(KEYS.REACTIONS, []); }
  addReaction(log: ReactionLog): void { this.setItem(KEYS.REACTIONS, [log, ...this.getReactions()]); }

  getFeedingLogs(): FeedingLog[] { return this.getItem<FeedingLog[]>(KEYS.FEEDING, []); }
  addFeedingLog(log: FeedingLog): void { this.setItem(KEYS.FEEDING, [log, ...this.getFeedingLogs()]); }

  getMilestones(): MilestoneLog[] { return this.getItem<MilestoneLog[]>(KEYS.MILESTONES, []); }
  addMilestone(log: MilestoneLog): void { this.setItem(KEYS.MILESTONES, [log, ...this.getMilestones()]); }

  getHealthLogs(): HealthLog[] { return this.getItem<HealthLog[]>(KEYS.HEALTH, []); }
  addHealthLog(log: HealthLog): void { this.setItem(KEYS.HEALTH, [log, ...this.getHealthLogs()]); }

  getTummyTimeLogs(): TummyTimeLog[] { return this.getItem<TummyTimeLog[]>(KEYS.TUMMY_TIME, []); }
  addTummyTimeLog(log: TummyTimeLog): void { this.setItem(KEYS.TUMMY_TIME, [log, ...this.getTummyTimeLogs()]); }

  getBloodPressureLogs(): BloodPressureLog[] { return this.getItem<BloodPressureLog[]>(KEYS.BLOOD_PRESSURE, []); }
  addBloodPressureLog(log: BloodPressureLog): void { this.setItem(KEYS.BLOOD_PRESSURE, [log, ...this.getBloodPressureLogs()]); }
  removeBloodPressureLog(id: string): void { this.setItem(KEYS.BLOOD_PRESSURE, this.getBloodPressureLogs().filter(l => l.id !== id)); }

  getKegelLogs(): KegelLog[] { return this.getItem<KegelLog[]>(KEYS.KEGELS, []); }
  addKegelLog(log: KegelLog): void { this.setItem(KEYS.KEGELS, [log, ...this.getKegelLogs()]); }

  getBabyGrowthLogs(): BabyGrowthLog[] { return this.getItem<BabyGrowthLog[]>(KEYS.BABY_GROWTH, []); }
  addBabyGrowthLog(log: BabyGrowthLog): void { this.setItem(KEYS.BABY_GROWTH, [log, ...this.getBabyGrowthLogs()]); }

  getDiaperLogs(): DiaperLog[] { return this.getItem<DiaperLog[]>(KEYS.DIAPER, []); }
  addDiaperLog(log: DiaperLog): void { this.setItem(KEYS.DIAPER, [log, ...this.getDiaperLogs()]); }

  getJournalEntries(): JournalEntry[] { return this.getItem<JournalEntry[]>(KEYS.JOURNAL, []); }
  addJournalEntry(entry: JournalEntry): void { this.setItem(KEYS.JOURNAL, [entry, ...this.getJournalEntries()]); }
  removeJournalEntry(id: string): void { this.setItem(KEYS.JOURNAL, this.getJournalEntries().filter(e => e.id !== id)); }

  getAlbums(): MemoryAlbums {
    const p = this.getProfile();
    return p?.albums || { bump: [], baby: [], ultrasound: [], nursery: [], family: [], other: [] };
  }

  saveAlbums(albums: MemoryAlbums): void {
    const profile = this.getProfile();
    if (profile) {
      profile.albums = albums;
      this.saveProfile(profile);
    }
  }

  saveAlbumPhoto(type: keyof MemoryAlbums, photo: MemoryPhoto): void {
    const albums = this.getAlbums();
    albums[type] = [photo, ...albums[type]];
    this.saveAlbums(albums);
  }

  getMedications(): MedicationLog[] { return this.getItem<MedicationLog[]>(KEYS.MEDICATIONS, []); }
  addMedication(log: MedicationLog): void { this.setItem(KEYS.MEDICATIONS, [log, ...this.getMedications()]); }
  removeMedication(id: string): void { this.setItem(KEYS.MEDICATIONS, this.getMedications().filter(m => m.id !== id)); }

  getUnlockedAchievementIds(): string[] { return this.getItem<string[]>(KEYS.UNLOCKED_IDS, []); }
  unlockAchievement(id: string): void {
    const ids = this.getUnlockedAchievementIds();
    if (!ids.includes(id)) this.setItem(KEYS.UNLOCKED_IDS, [...ids, id]);
  }

  getAuthActivity(): UserLog[] { return this.getItem<UserLog[]>(KEYS.ACTIVITY_LOGS, [], true); }
  logActivity(_identifier: string, action: 'login' | 'signup'): void {
    const logs = this.getAuthActivity();
    this.setItem(KEYS.ACTIVITY_LOGS, [{ email: _identifier, action, timestamp: Date.now() }, ...logs], true);
  }

  getActivityLogs(): UserLog[] { return this.getAuthActivity(); }
  getVisitCount(): number { return this.getItem<number>(KEYS.VISITS, 0, true); }
  setVisitCount(n: number): void { this.setItem(KEYS.VISITS, n, true); }

  getVitamins(): VitaminLog[] { return this.getItem<VitaminLog[]>(KEYS.VITAMINS, []); }
  addVitamin(log: VitaminLog): void { this.setItem(KEYS.VITAMINS, [...this.getVitamins(), log]); }

  getSymptoms(): SymptomLog[] { return this.getItem<SymptomLog[]>(KEYS.SYMPTOMS, []); }
  addSymptom(log: SymptomLog): void { this.setItem(KEYS.SYMPTOMS, [...this.getSymptoms(), log]); }

  getContractions(): Contraction[] { return this.getItem<Contraction[]>(KEYS.CONTRACTIONS, []); }
  saveContractions(logs: Contraction[]): void { this.setItem(KEYS.CONTRACTIONS, logs); }

  getCalendarEvents(): CalendarEvent[] { return this.getItem<CalendarEvent[]>(KEYS.CALENDAR, []); }
  addCalendarEvent(event: CalendarEvent): void { this.setItem(KEYS.CALENDAR, [event, ...this.getCalendarEvents()]); }
  removeCalendarEvent(id: string): void { this.setItem(KEYS.CALENDAR, this.getCalendarEvents().filter(e => e.id !== id)); }

  getPeriodLogs(): PeriodLog[] { return this.getItem<PeriodLog[]>(KEYS.PERIOD_LOGS, []); }
  addPeriodLog(log: PeriodLog): void { this.setItem(KEYS.PERIOD_LOGS, [log, ...this.getPeriodLogs()]); }

  getAvailableReportDates(): string[] {
    const dates = new Set<string>();
    const addDate = (ts: number) => dates.add(new Date(ts).toISOString().split('T')[0]);
    
    this.getFoodEntries().forEach(e => addDate(e.timestamp));
    this.getFeedingLogs().forEach(e => addDate(e.timestamp));
    this.getDiaperLogs().forEach(e => addDate(e.timestamp));
    this.getSleepLogs().forEach(e => addDate(e.timestamp));
    this.getWeightLogs().forEach(e => addDate(e.timestamp));
    this.getKickLogs().forEach(e => addDate(e.timestamp));
    this.getContractions().forEach(e => addDate(e.startTime));
    this.getJournalEntries().forEach(e => addDate(e.timestamp));
    this.getSymptoms().forEach(e => addDate(e.timestamp));
    
    return Array.from(dates).sort().reverse();
  }

  getArticles(): Article[] {
    return this.getItem<Article[]>(KEYS.ARTICLES, [], true);
  }

  addArticle(article: Article): void {
    const articles = this.getArticles();
    this.setItem(KEYS.ARTICLES, [article, ...articles], true);
  }

  removeArticle(id: string): void {
    const articles = this.getArticles();
    this.setItem(KEYS.ARTICLES, articles.filter(a => a.id !== id), true);
  }

  updateArticle(article: Article): void {
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    if (index >= 0) {
      articles[index] = article;
      this.setItem(KEYS.ARTICLES, articles, true);
    }
  }

  deleteAccount(): void {
    const uuid = this.getScope();
    try {
      USER_SCOPED_KEYS.forEach(key => {
        localStorage.removeItem(`${uuid}_${key}`);
      });
      // Reset the local UUID so next launch generates a fresh one
      localStorage.removeItem(LOCAL_UUID_KEY);
      this._uuid = null;
    } catch (e) {}
  }

  getArchive(): ArchivedPregnancy[] {
    return this.getItem<ArchivedPregnancy[]>(KEYS.ARCHIVE, []);
  }

  addToArchive(entry: ArchivedPregnancy): void {
    const archive = this.getArchive();
    this.setItem(KEYS.ARCHIVE, [entry, ...archive]);
  }

  getChecklist(category: ChecklistItem['category']): ChecklistItem[] {
    const all = this.getItem<ChecklistItem[]>(KEYS.CHECKLISTS, []);
    return all.filter(item => item.category === category);
  }

  getAllChecklists(): ChecklistItem[] {
    return this.getItem<ChecklistItem[]>(KEYS.CHECKLISTS, []);
  }

  saveChecklistItem(item: ChecklistItem): void {
    const all = this.getItem<ChecklistItem[]>(KEYS.CHECKLISTS, []);
    const index = all.findIndex(i => i.id === item.id);
    if (index >= 0) {
      all[index] = item;
      this.setItem(KEYS.CHECKLISTS, all);
    } else {
      this.setItem(KEYS.CHECKLISTS, [...all, item]);
    }
  }

  removeChecklistItem(id: string): void {
    const all = this.getItem<ChecklistItem[]>(KEYS.CHECKLISTS, []);
    this.setItem(KEYS.CHECKLISTS, all.filter(i => i.id !== id));
  }

  getReminders(): any[] { return this.getItem<any[]>(KEYS.REMINDERS, [], false); }
  addReminder(reminder: any): void { this.setItem(KEYS.REMINDERS, [reminder, ...this.getReminders()], false); }
  removeReminder(id: string): void { this.setItem(KEYS.REMINDERS, this.getReminders().filter(r => r.id !== id), false); }
  clearReminders(): void { this.setItem(KEYS.REMINDERS, [], false); }

  getShownReminders(): { id: string, timestamp: number }[] { return this.getItem<{ id: string, timestamp: number }[]>(KEYS.SHOWN_REMINDERS, []); }
  markReminderAsShown(id: string): void {
    const shown = this.getShownReminders();
    if (!shown.find(s => s.id === id)) {
      this.setItem(KEYS.SHOWN_REMINDERS, [...shown, { id, timestamp: Date.now() }]);
    }
  }

  getVideos(): Video[] {
    return this.getItem<Video[]>(KEYS.VIDEOS, [], true);
  }

  addVideo(video: Video): void {
    const videos = this.getVideos();
    this.setItem(KEYS.VIDEOS, [video, ...videos], true);
  }

  removeVideo(id: string): void {
    const videos = this.getVideos();
    this.setItem(KEYS.VIDEOS, videos.filter(v => v.id !== id), true);
  }

  updateVideo(video: Video): void {
    const videos = this.getVideos();
    const index = videos.findIndex(v => v.id === video.id);
    if (index >= 0) {
      videos[index] = video;
      this.setItem(KEYS.VIDEOS, videos, true);
    }
  }

  getLastWeekCelebrated(): number {
    return this.getItem<number>(KEYS.LAST_WEEK_CELEBRATED, 0);
  }

  setLastWeekCelebrated(week: number): void {
    this.setItem(KEYS.LAST_WEEK_CELEBRATED, week);
  }

  restoreFromExport(data: ZeroDataExportV1): void {
    restoreUserScopedKeys(this, data);
  }

  wipeAllUserScopedKeys(): void {
    wipeUserScopedKeys(this);
  }

}

export const storage = new StorageService();
