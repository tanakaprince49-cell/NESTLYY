import {
  PregnancyProfile,
  Trimester,
  LifecycleStage,
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
  ZeroDataTrackingSlice,
  ZeroDataExtrasSlice,
  ZeroDataSettingsSlice,
  getLocalIdentitySync,
  LOCAL_UUID_KEY,
} from '@nestly/shared';

const KEYS = {
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
};

// Keys written unscoped via isGlobal=true — device-wide telemetry or seeded
// content. These must NOT be wiped when deleting the user's personal data.
const GLOBAL_KEYS: readonly string[] = [
  KEYS.ACTIVITY_LOGS,
  KEYS.VISITS,
  KEYS.ARTICLES,
  KEYS.BROADCASTS,
  KEYS.VIDEOS,
];

// Everything else is written under `${uuid}_${key}` and belongs to the user.
const USER_SCOPED_KEYS: readonly string[] = Object.values(KEYS).filter(
  (k) => !GLOBAL_KEYS.includes(k),
);

class StorageService {
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

  private _uuid: string | null = null;
  private getScope(): string {
    if (!this._uuid) {
      this._uuid = this.getLocalUuid();
      this.migrateFromEmailScope(this._uuid);
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

  getTrackingSlice(): ZeroDataTrackingSlice {
    return {
      foodEntries: this.getFoodEntries(),
      symptoms: this.getSymptoms(),
      vitamins: this.getVitamins(),
      contractions: this.getContractions(),
      journalEntries: this.getJournalEntries(),
      calendarEvents: this.getCalendarEvents(),
      weightLogs: this.getWeightLogs(),
      sleepLogs: this.getSleepLogs(),
      feedingLogs: this.getFeedingLogs(),
      milestones: this.getMilestones(),
      healthLogs: this.getHealthLogs(),
      reactions: this.getReactions(),
      babyGrowthLogs: this.getBabyGrowthLogs(),
      tummyTimeLogs: this.getTummyTimeLogs(),
      bloodPressureLogs: this.getBloodPressureLogs(),
      kickLogs: this.getKickLogs(),
      kegelLogs: this.getKegelLogs(),
      diaperLogs: this.getDiaperLogs(),
      medicationLogs: this.getMedications(),
    };
  }

  getExtrasSlice(): ZeroDataExtrasSlice {
    return {
      periodLogs: this.getPeriodLogs(),
      archivedPregnancies: this.getArchive(),
      checklistItems: this.getAllChecklists(),
      babyNames: this.getBabyNames(),
      bumpPhotos: this.getBumpPhotos(),
      unlockedAchievementIds: this.getUnlockedAchievementIds(),
      lastWeekCelebrated: this.getLastWeekCelebrated(),
    };
  }

  getSettingsSlice(profile: PregnancyProfile | null): ZeroDataSettingsSlice {
    const slice: ZeroDataSettingsSlice = {
      hasAcceptedPrivacy: this.hasAcceptedPrivacy(),
    };
    if (profile?.notificationsEnabled !== undefined) {
      slice.notificationsEnabled = profile.notificationsEnabled;
    }
    if (profile?.emailNotifications !== undefined) {
      slice.emailNotifications = profile.emailNotifications;
    }
    if (profile?.dietPreference !== undefined) {
      slice.dietPreference = profile.dietPreference;
    }
    if (profile?.themeColor !== undefined) {
      slice.themeColor = profile.themeColor;
    }
    return slice;
  }

  restoreFromExport(data: ZeroDataExportV1): void {
    // Wipe all user-scoped keys under the current scope, then write the
    // imported payload. Keeping the current UUID (we do not touch
    // LOCAL_UUID_KEY) means the imported data lives under this device's
    // scope going forward, no identity churn. If any write fails mid-way
    // (e.g. QuotaExceededError), we roll back to the pre-import snapshot
    // so the user is not left with a half-restored, half-empty state.
    const uuid = this.getScope();
    const snapshot = new Map<string, string | null>();
    for (const key of USER_SCOPED_KEYS) {
      const fullKey = `${uuid}_${key}`;
      try {
        snapshot.set(fullKey, localStorage.getItem(fullKey));
      } catch {
        snapshot.set(fullKey, null);
      }
    }

    this.wipeAllUserScopedKeys();

    const writeOrThrow = (key: string, value: unknown): void => {
      localStorage.setItem(`${uuid}_${key}`, JSON.stringify(value));
    };

    try {
      if (data.profile) {
        writeOrThrow(KEYS.PROFILE, data.profile);
      }

      writeOrThrow(KEYS.FOOD, data.tracking.foodEntries);
      writeOrThrow(KEYS.SYMPTOMS, data.tracking.symptoms);
      writeOrThrow(KEYS.VITAMINS, data.tracking.vitamins);
      writeOrThrow(KEYS.CONTRACTIONS, data.tracking.contractions);
      writeOrThrow(KEYS.JOURNAL, data.tracking.journalEntries);
      writeOrThrow(KEYS.CALENDAR, data.tracking.calendarEvents);
      writeOrThrow(KEYS.WEIGHT, data.tracking.weightLogs);
      writeOrThrow(KEYS.SLEEP, data.tracking.sleepLogs);
      writeOrThrow(KEYS.FEEDING, data.tracking.feedingLogs);
      writeOrThrow(KEYS.MILESTONES, data.tracking.milestones);
      writeOrThrow(KEYS.HEALTH, data.tracking.healthLogs);
      writeOrThrow(KEYS.REACTIONS, data.tracking.reactions);
      writeOrThrow(KEYS.BABY_GROWTH, data.tracking.babyGrowthLogs);
      writeOrThrow(KEYS.TUMMY_TIME, data.tracking.tummyTimeLogs);
      writeOrThrow(KEYS.BLOOD_PRESSURE, data.tracking.bloodPressureLogs);
      writeOrThrow(KEYS.KICKS, data.tracking.kickLogs);
      writeOrThrow(KEYS.KEGELS, data.tracking.kegelLogs);
      writeOrThrow(KEYS.DIAPER, data.tracking.diaperLogs);
      writeOrThrow(KEYS.MEDICATIONS, data.tracking.medicationLogs);

      writeOrThrow(KEYS.PRIVACY_ACCEPTED, data.settings.hasAcceptedPrivacy);

      if (data.extras) {
        if (data.extras.periodLogs) writeOrThrow(KEYS.PERIOD_LOGS, data.extras.periodLogs);
        if (data.extras.archivedPregnancies) writeOrThrow(KEYS.ARCHIVE, data.extras.archivedPregnancies);
        if (data.extras.checklistItems) writeOrThrow(KEYS.CHECKLISTS, data.extras.checklistItems);
        if (data.extras.babyNames) writeOrThrow(KEYS.BABY_NAMES, data.extras.babyNames);
        if (data.extras.bumpPhotos) writeOrThrow(KEYS.BUMP_PHOTOS, data.extras.bumpPhotos);
        if (data.extras.unlockedAchievementIds) writeOrThrow(KEYS.UNLOCKED_IDS, data.extras.unlockedAchievementIds);
        if (typeof data.extras.lastWeekCelebrated === 'number') {
          writeOrThrow(KEYS.LAST_WEEK_CELEBRATED, data.extras.lastWeekCelebrated);
        }
      }
    } catch (e) {
      // Roll back: wipe partial writes, restore snapshot, re-throw for the UI.
      try {
        for (const fullKey of snapshot.keys()) {
          localStorage.removeItem(fullKey);
        }
        for (const [fullKey, value] of snapshot) {
          if (value !== null) {
            localStorage.setItem(fullKey, value);
          }
        }
      } catch {
        // Nothing more we can do — surface the original error to the caller.
      }
      throw e;
    }
  }

  wipeAllUserScopedKeys(): void {
    // Mirror deleteAccount() minus LOCAL_UUID_KEY removal. The device scope
    // is preserved so a post-wipe reload routes to Setup under the same UUID,
    // without generating a fresh identity. Global keys (ACTIVITY_LOGS,
    // VISITS, ARTICLES, BROADCASTS, VIDEOS) intentionally survive — they are
    // device-scoped telemetry or seeded content, not user data.
    const uuid = this.getScope();
    try {
      USER_SCOPED_KEYS.forEach(key => {
        localStorage.removeItem(`${uuid}_${key}`);
      });
    } catch (e) {}
  }

}

export const storage = new StorageService();
