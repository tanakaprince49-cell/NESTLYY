
import { 
  PregnancyProfile, 
  FoodEntry, 
  WaterLog, 
  SymptomLog, 
  VitaminLog, 
  Contraction, 
  JournalEntry, 
  CalendarEvent,
  UserLog,
  WeightLog,
  MemoryAlbums,
  SleepLog,
  KickLog,
  ChatMessage,
  PeriodLog,
  AvaMemoryFact
} from '../types.ts';

const KEYS = {
  PROFILE: 'profile_v5',
  FOOD: 'food_entries',
  WATER: 'water_logs',
  SYMPTOMS: 'symptoms',
  VITAMINS: 'vitamins',
  CONTRACTIONS: 'contractions',
  JOURNAL: 'journal',
  CALENDAR: 'calendar',
  AUTH: 'nestly_auth_email',
  ACTIVITY_LOGS: 'nestly_activity_logs',
  VISITS: 'nestly_visit_count',
  WEIGHT: 'weight_logs',
  SLEEP: 'sleep_logs',
  KICKS: 'kick_logs',
  CHAT_HISTORY: 'chat_history',
  AVA_HISTORY: 'ava_history_v2',
  AVA_MEMORY: 'ava_memory_bank',
  PERIOD_LOGS: 'period_logs',
  UNLOCKED_IDS: 'unlocked_achievement_ids',
  AVA_IMAGE: 'ava_custom_image'
};

class StorageService {
  private getUserKey(key: string): string {
    const email = this.getAuthEmail();
    if (!email) return `guest_${key}`;
    return `${email}_${key}`;
  }

  private getItem<T>(key: string, defaultValue: T, isGlobal: boolean = false): T {
    const finalKey = isGlobal ? key : this.getUserKey(key);
    const saved = localStorage.getItem(finalKey);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T, isGlobal: boolean = false): void {
    const finalKey = isGlobal ? key : this.getUserKey(key);
    localStorage.setItem(finalKey, JSON.stringify(value));
  }

  getAuthEmail(): string | null { return localStorage.getItem(KEYS.AUTH); }
  setAuthEmail(email: string): void { localStorage.setItem(KEYS.AUTH, email); }
  logout(): void { localStorage.removeItem(KEYS.AUTH); }

  getProfile(): PregnancyProfile | null { return this.getItem<PregnancyProfile | null>(KEYS.PROFILE, null); }
  saveProfile(profile: PregnancyProfile): void { this.setItem(KEYS.PROFILE, profile); }

  getFoodEntries(): FoodEntry[] { return this.getItem<FoodEntry[]>(KEYS.FOOD, []); }
  addFoodEntry(entry: FoodEntry): void { this.setItem(KEYS.FOOD, [entry, ...this.getFoodEntries()]); }
  removeFoodEntry(id: string): void { this.setItem(KEYS.FOOD, this.getFoodEntries().filter(e => e.id !== id)); }

  getWaterLogs(): WaterLog[] { return this.getItem<WaterLog[]>(KEYS.WATER, []); }
  addWaterLog(log: WaterLog): void { this.setItem(KEYS.WATER, [...this.getWaterLogs(), log]); }

  getWeightLogs(): WeightLog[] { return this.getItem<WeightLog[]>(KEYS.WEIGHT, []); }
  addWeightLog(log: WeightLog): void { this.setItem(KEYS.WEIGHT, [log, ...this.getWeightLogs()]); }

  getSleepLogs(): SleepLog[] { return this.getItem<SleepLog[]>(KEYS.SLEEP, []); }
  addSleepLog(log: SleepLog): void { this.setItem(KEYS.SLEEP, [log, ...this.getSleepLogs()]); }
  removeSleepLog(id: string): void { this.setItem(KEYS.SLEEP, this.getSleepLogs().filter(e => e.id !== id)); }

  getKickLogs(): KickLog[] { return this.getItem<KickLog[]>(KEYS.KICKS, []); }
  addKickLog(log: KickLog): void { this.setItem(KEYS.KICKS, [log, ...this.getKickLogs()]); }

  getJournalEntries(): JournalEntry[] { return this.getItem<JournalEntry[]>(KEYS.JOURNAL, []); }
  addJournalEntry(entry: JournalEntry): void { this.setItem(KEYS.JOURNAL, [entry, ...this.getJournalEntries()]); }
  removeJournalEntry(id: string): void { this.setItem(KEYS.JOURNAL, this.getJournalEntries().filter(e => e.id !== id)); }

  saveAlbums(albums: MemoryAlbums): void {
    const profile = this.getProfile();
    if (profile) {
      profile.albums = albums;
      this.saveProfile(profile);
    }
  }

  getUnlockedAchievementIds(): string[] { return this.getItem<string[]>(KEYS.UNLOCKED_IDS, []); }
  unlockAchievement(id: string): void {
    const ids = this.getUnlockedAchievementIds();
    if (!ids.includes(id)) this.setItem(KEYS.UNLOCKED_IDS, [...ids, id]);
  }

  getAuthActivity(): UserLog[] { return this.getItem<UserLog[]>(KEYS.ACTIVITY_LOGS, [], true); }
  logActivity(email: string, action: 'login' | 'signup'): void {
    const logs = this.getAuthActivity();
    this.setItem(KEYS.ACTIVITY_LOGS, [{ email, action, timestamp: Date.now() }, ...logs], true);
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

  getAvaHistory(): ChatMessage[] { return this.getItem<ChatMessage[]>(KEYS.AVA_HISTORY, []); }
  saveAvaHistory(history: ChatMessage[]): void { this.setItem(KEYS.AVA_HISTORY, history); }

  getAvaMemory(): AvaMemoryFact[] { return this.getItem<AvaMemoryFact[]>(KEYS.AVA_MEMORY, []); }
  saveAvaMemory(facts: AvaMemoryFact[]): void { this.setItem(KEYS.AVA_MEMORY, facts); }

  getChatHistory(): ChatMessage[] { return this.getItem<ChatMessage[]>(KEYS.CHAT_HISTORY, []); }
  saveChatHistory(history: ChatMessage[]): void { this.setItem(KEYS.CHAT_HISTORY, history); }

  getAvailableReportDates(): string[] {
    const dates = new Set<string>();
    this.getFoodEntries().forEach(e => dates.add(new Date(e.timestamp).toISOString().split('T')[0]));
    return Array.from(dates).sort().reverse();
  }

  getAvaImage(): string | null {
    return this.getItem<string | null>(KEYS.AVA_IMAGE, null);
  }

  saveAvaImage(dataUrl: string): void {
    this.setItem(KEYS.AVA_IMAGE, dataUrl);
  }
}

export const storage = new StorageService();
