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
  WeightLog,
  KegelLog,
  Nest,
  NestMembership,
  NestPost,
  NestComment,
  MediaAttachment
} from '../types.ts';

const KEYS = {
  PROFILE: 'profile_v5',
  FOOD: 'food_entries',
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
  AVA_IMAGE: 'ava_custom_image',
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
  BROADCASTS: 'nestly_global_broadcasts',
  SHOWN_REMINDERS: 'nestly_shown_reminders',
  VIDEOS: 'nestly_global_videos',
  BABY_NAMES: 'baby_names',
  BUMP_PHOTOS: 'bump_photos',
  MEDICATIONS: 'medication_logs',
  TUMMY_TIME: 'tummy_time_logs',
  BLOOD_PRESSURE: 'blood_pressure_logs',
  KEGELS: 'kegel_logs',
  PRIVACY_ACCEPTED: 'privacy_accepted',
  CUSTOM_PLAN: 'custom_plan_v1',
  LAST_WEEK_CELEBRATED: 'last_week_celebrated',
  VILLAGE_MEMBERSHIPS: 'village_memberships',
  VILLAGE_POSTS: 'village_posts',
  VILLAGE_COMMENTS: 'village_comments',
  VILLAGE_CUSTOM_NESTS: 'village_custom_nests',
};

import { syncToFirestore } from './syncService.ts';

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
      
      // Sync to Firestore if it's a user-specific key
      if (!isGlobal) {
        const email = this.getAuthEmail();
        if (email) {
          syncToFirestore(email);
        }
      }
    } catch (e) {
      console.error("Storage error:", e);
      // If it's a quota error, we might want to alert the user or clear some space
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Storage quota exceeded. Profile picture might be too large.");
      }
    }
  }

  getAuthEmail(): string | null { 
    try {
      return localStorage.getItem(KEYS.AUTH); 
    } catch (e) {
      return null;
    }
  }
  setAuthEmail(email: string): void { 
    try {
      localStorage.setItem(KEYS.AUTH, email); 
    } catch (e) {}
  }
  logout(): void { 
    try {
      localStorage.removeItem(KEYS.AUTH); 
    } catch (e) {}
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

  getAvaImage(): string | null {
    return this.getItem<string | null>(KEYS.AVA_IMAGE, null);
  }

  saveAvaImage(dataUrl: string): void {
    this.setItem(KEYS.AVA_IMAGE, dataUrl);
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
    const email = this.getAuthEmail();
    if (!email) return;

    try {
      // Remove all user-specific keys
      Object.values(KEYS).forEach(key => {
        localStorage.removeItem(`${email}_${key}`);
      });
      
      // Also remove the auth email itself
      localStorage.removeItem(KEYS.AUTH);
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

  getBroadcasts(): any[] { return this.getItem<any[]>(KEYS.BROADCASTS, [], true); }
  addBroadcast(broadcast: any): void { this.setItem(KEYS.BROADCASTS, [broadcast, ...this.getBroadcasts()], true); }
  removeBroadcast(id: string): void { this.setItem(KEYS.BROADCASTS, this.getBroadcasts().filter(b => b.id !== id), true); }

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

  getCustomPlan(): any {
    return this.getItem(KEYS.CUSTOM_PLAN, null);
  }

  saveCustomPlan(plan: any): void {
    this.setItem(KEYS.CUSTOM_PLAN, plan);
  }

  getLastWeekCelebrated(): number {
    return this.getItem<number>(KEYS.LAST_WEEK_CELEBRATED, 0);
  }

  setLastWeekCelebrated(week: number): void {
    this.setItem(KEYS.LAST_WEEK_CELEBRATED, week);
  }

  // Village Hub: Memberships
  getNestMemberships(): NestMembership[] { return this.getItem<NestMembership[]>(KEYS.VILLAGE_MEMBERSHIPS, []); }
  joinNest(nestId: string): void {
    const memberships = this.getNestMemberships();
    console.log('[VillageHub] joinNest:', nestId, '| auth:', this.getAuthEmail(), '| existing:', memberships.length);
    if (!memberships.find(m => m.nestId === nestId)) {
      const updated = [...memberships, { nestId, joinedAt: Date.now() }];
      this.setItem(KEYS.VILLAGE_MEMBERSHIPS, updated);
      // Verify write
      const check = this.getNestMemberships();
      console.log('[VillageHub] joinNest saved:', check.length, '| includes:', check.some(m => m.nestId === nestId));
    } else {
      console.log('[VillageHub] joinNest: already joined');
    }
  }
  leaveNest(nestId: string): void {
    this.setItem(KEYS.VILLAGE_MEMBERSHIPS, this.getNestMemberships().filter(m => m.nestId !== nestId));
  }
  isNestJoined(nestId: string): boolean {
    return this.getNestMemberships().some(m => m.nestId === nestId);
  }

  // Village Hub: Posts
  getAllNestPosts(): NestPost[] { return this.getItem<NestPost[]>(KEYS.VILLAGE_POSTS, []); }
  getNestPosts(nestId: string): NestPost[] {
    return this.getAllNestPosts().filter(p => p.nestId === nestId);
  }
  addNestPost(post: NestPost): void {
    console.log('[VillageHub] addNestPost:', post.id, '| nest:', post.nestId, '| auth:', this.getAuthEmail());
    this.setItem(KEYS.VILLAGE_POSTS, [post, ...this.getAllNestPosts()]);
    console.log('[VillageHub] addNestPost saved, total:', this.getAllNestPosts().length);
  }
  removeNestPost(id: string): void {
    this.setItem(KEYS.VILLAGE_POSTS, this.getAllNestPosts().filter(p => p.id !== id));
  }
  toggleNestPostLike(id: string, userId: string): void {
    const posts = this.getAllNestPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index >= 0) {
      const isLiked = posts[index].likedBy.includes(userId);
      posts[index] = {
        ...posts[index],
        likedBy: isLiked ? posts[index].likedBy.filter(uid => uid !== userId) : [...posts[index].likedBy, userId],
        likeCount: isLiked ? Math.max(0, posts[index].likeCount - 1) : posts[index].likeCount + 1,
      };
      this.setItem(KEYS.VILLAGE_POSTS, posts);
    }
  }

  // Village Hub: Comments
  getAllComments(): NestComment[] { return this.getItem<NestComment[]>(KEYS.VILLAGE_COMMENTS, []); }
  getCommentsForPost(postId: string): NestComment[] {
    return this.getAllComments().filter(c => c.postId === postId);
  }
  addComment(comment: NestComment): void {
    this.setItem(KEYS.VILLAGE_COMMENTS, [comment, ...this.getAllComments()]);
  }
  toggleCommentLike(commentId: string): void {
    const comments = this.getAllComments();
    const index = comments.findIndex(c => c.id === commentId);
    if (index >= 0) {
      const isLiked = comments[index].likedBy.includes(this.getAuthEmail() || '');
      comments[index] = {
        ...comments[index],
        likedBy: isLiked ? comments[index].likedBy.filter(uid => uid !== this.getAuthEmail()) : [...comments[index].likedBy, this.getAuthEmail() || ''],
        likeCount: isLiked ? Math.max(0, comments[index].likeCount - 1) : comments[index].likeCount + 1,
      };
      this.setItem(KEYS.VILLAGE_COMMENTS, comments);
    }
  }

  // Village Hub: Custom Nests
  getCustomNests(): Nest[] { return this.getItem<Nest[]>(KEYS.VILLAGE_CUSTOM_NESTS, []); }
  addCustomNest(nest: Nest): void {
    console.log('[VillageHub] addCustomNest:', nest.id, nest.name, '| auth:', this.getAuthEmail());
    const nestWithShareLink = {
      ...nest,
      shareLink: `${window.location.origin}/village?invite=${nest.id}`,
      createdAt: Date.now()
    };
    this.setItem(KEYS.VILLAGE_CUSTOM_NESTS, [nestWithShareLink, ...this.getCustomNests()]);
    const check = this.getCustomNests();
    console.log('[VillageHub] addCustomNest saved:', check.length, '| includes:', check.some(n => n.id === nest.id));
  }
  updateCustomNest(nestId: string, updates: Partial<Nest>): void {
    const nests = this.getCustomNests();
    const index = nests.findIndex(n => n.id === nestId);
    if (index >= 0) {
      nests[index] = { ...nests[index], ...updates };
      this.setItem(KEYS.VILLAGE_CUSTOM_NESTS, nests);
    }
  }
  removeCustomNest(id: string): void {
    this.leaveNest(id);
    this.setItem(KEYS.VILLAGE_POSTS, this.getAllNestPosts().filter(p => p.nestId !== id));
    this.setItem(KEYS.VILLAGE_CUSTOM_NESTS, this.getCustomNests().filter(n => n.id !== id));
  }
}

export const storage = new StorageService();
