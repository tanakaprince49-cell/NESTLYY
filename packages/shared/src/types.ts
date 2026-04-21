
export enum LifecycleStage {
  PRE_PREGNANCY = 'pre_pregnancy',
  PREGNANCY = 'pregnancy',
  BIRTH = 'birth',
  NEWBORN = 'newborn',
  INFANT = 'infant',
  TODDLER = 'toddler'
}

export enum Trimester {
  FIRST = 'First Trimester',
  SECOND = 'Second Trimester',
  THIRD = 'Third Trimester'
}

export interface NutritionTargets {
  cals: number;
  protein: number;
  folate: number;
  iron: number;
  calcium: number;
}

export interface MemoryPhoto {
  id: string;
  url: string; // base64
  caption?: string;
  timestamp: number;
}

export interface MemoryAlbums {
  bump: MemoryPhoto[];
  baby: MemoryPhoto[];
  ultrasound: MemoryPhoto[];
  nursery: MemoryPhoto[];
  family: MemoryPhoto[];
  other: MemoryPhoto[];
}

export interface WeightLog {
  id: string;
  weight: number;
  timestamp: number;
  source?: 'manual' | 'health_connect';
  hcRecordId?: string;
}

export type SleepMode = 'pregnancy' | 'newborn';
export type SleepQuality = 'poor' | 'okay' | 'good';

export interface SleepLog {
  id: string;
  userId: string;
  babyId?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  mode: SleepMode;
  quality?: SleepQuality;
  type: 'night' | 'nap';
  notes?: string;
  timestamp: number;
  source?: 'manual' | 'health_connect';
  hcRecordId?: string;
}

export interface BabyAvatar {
  id: string;
  name: string;
  skinTone: string;
  gender: 'boy' | 'girl' | 'surprise' | 'neutral';
  birthDate?: string;
  birthWeight?: number;
  birthLength?: number;
  notes?: string;
}

export interface PregnancyProfile {
  userName: string;
  lmpDate: string;
  dueDate: string;
  isManualDueDate: boolean;
  pregnancyType: 'singleton' | 'twins' | 'triplets';
  babies: BabyAvatar[];
  themeColor: 'pink' | 'blue' | 'orange';
  profileImage?: string;
  startingWeight?: number;
  customTargets?: NutritionTargets;
  albums: MemoryAlbums;
  lifecycleStage: LifecycleStage;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  privacyAccepted?: boolean;
  dietPreference?: 'normal' | 'vegan' | 'vegetarian' | 'pescatarian' | 'gluten-free' | 'dairy-free';
}

export interface ArchivedPregnancy {
  id: string;
  startDate: string;
  endDate?: string;
  type: 'singleton' | 'twins' | 'triplets';
  outcome: 'birth' | 'loss' | 'other';
  notes?: string;
  babies: string[];
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  folate: number;
  iron: number;
  calcium: number;
  timestamp: number;
}

export interface SymptomLog {
  id: string;
  type: string;
  severity: number;
  timestamp: number;
}

export interface VitaminLog {
  id: string;
  name: string;
  timestamp: number;
}

export interface Contraction {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  interval?: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood?: string;
  tags?: string[];
  photo?: string;
  timestamp: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'appointment' | 'reminder' | 'milestone';
}

export interface UserLog {
  email: string;
  timestamp: number;
  action: 'login' | 'signup';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'hospital_bag' | 'birth_plan' | 'nursery' | 'general';
}

export interface KickLog {
  id: string;
  babyId: string;
  timestamp: number;
  count: number;
}

export interface ReactionLog {
  id: string;
  babyId: string;
  stimulus: string; // e.g., 'Music', 'Food', 'Voice'
  reaction: string; // e.g., 'Active', 'Calm', 'Hiccups'
  mood: string;
  timestamp: number;
}

export interface FeedingLog {
  id: string;
  babyId: string;
  type: 'breast' | 'bottle' | 'solid';
  subType?: 'formula' | 'milk';
  side?: 'left' | 'right' | 'both';
  amount: number; // ml or grams
  duration?: number; // minutes
  timestamp: number;
}

export interface MilestoneLog {
  id: string;
  babyId: string;
  title: string;
  date: string;
  notes?: string;
  photo?: string;
  timestamp: number;
}

export interface HealthLog {
  id: string;
  babyId: string;
  type: 'temperature' | 'medication' | 'vaccination' | 'symptom';
  value: string;
  notes: string;
  status: 'normal' | 'abnormal';
  timestamp: number;
}

export interface BloodPressureLog {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  timestamp: number;
  source?: 'manual' | 'health_connect';
  hcRecordId?: string;
}

export interface KegelLog {
  id: string;
  duration: number; // seconds
  timestamp: number;
}

export interface TummyTimeLog {
  id: string;
  babyId: string;
  duration: number; // in seconds
  notes?: string;
  timestamp: number;
}

export interface BabyGrowthLog {
  id: string;
  babyId: string;
  weight: number; // kg
  height: number; // cm
  headCircumference?: number; // cm
  timestamp: number;
}

export interface DiaperLog {
  id: string;
  babyId: string;
  type: 'wet' | 'dirty' | 'mixed';
  notes?: string;
  timestamp: number;
}

export interface MedicationLog {
  id: string;
  name: string;
  dosage: string;
  time?: string;
  timestamp: number;
}

// Legacy export-schema types. The Ava feature was removed in #295, but the
// Zero-Data export schema v1 (#294) still carries Ava data shapes so users who
// captured Ava conversations before the removal can round-trip them through
// export/import. Do not reintroduce runtime consumers of these types.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AvaMemoryFact {
  id: string;
  content: string;
  category: 'preference' | 'symptom' | 'milestone' | 'info';
  timestamp: number;
}

export interface PeriodLog {
  id: string;
  startDate: string;
  timestamp: number;
}

export interface Article {
  id: string;
  title: string;
  imageUrl: string;
  source: string;
  summary: string;
  link: string;
  stage: Trimester | 'General';
  timestamp: number;
}

export interface FoodResearchResult {
  name: string;
  calories: number;
  protein: number;
  folate: number;
  iron: number;
  calcium: number;
  safetyRating: 'Safe' | 'Caution' | 'Avoid';
  advice: string;
  benefits: string[];
}

export interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  stage: Trimester | 'General' | 'Newborn';
  timestamp: number;
}

export interface FertilityPrediction {
  nextPeriod: string;
  ovulationDay: string;
  fertileWindow: string[];
  advice: string;
}

export const CURRENT_SCHEMA_VERSION = 1 as const;

export type IdentityType = 'local-uuid' | 'firebase-uid';

export interface ZeroDataExportMeta {
  schemaVersion: 1;
  appVersion: string;
  exportedAt: string;
  identityType: IdentityType;
  identityValue?: string;
  platform: 'web' | 'mobile';
}

export interface ZeroDataTrackingSlice {
  foodEntries: FoodEntry[];
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
}

export interface ZeroDataAvaSlice {
  messages: ChatMessage[];
  memoryFacts?: AvaMemoryFact[];
  chatHistory?: ChatMessage[];
}

export interface ZeroDataSettingsSlice {
  hasAcceptedPrivacy: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  dietPreference?: PregnancyProfile['dietPreference'];
  themeColor?: PregnancyProfile['themeColor'];
}

export interface ZeroDataExtrasSlice {
  periodLogs?: PeriodLog[];
  archivedPregnancies?: ArchivedPregnancy[];
  checklistItems?: ChecklistItem[];
  babyNames?: { name: string; gender: string; rating: number }[];
  bumpPhotos?: { id: string; url: string; date: string; week: number }[];
  unlockedAchievementIds?: string[];
  lastWeekCelebrated?: number;
}

export interface ZeroDataExportV1 {
  meta: ZeroDataExportMeta;
  profile: PregnancyProfile | null;
  trimester: Trimester;
  tracking: ZeroDataTrackingSlice;
  avaChat: ZeroDataAvaSlice;
  settings: ZeroDataSettingsSlice;
  extras?: ZeroDataExtrasSlice;
}

export type ZeroDataExportAny = ZeroDataExportV1;

// Village Hub
export type NestCategory =
  | 'trimester' | 'lifestyle' | 'diet'
  | 'support' | 'postpartum' | 'general';

export interface Nest {
  id: string;
  name: string;
  description: string;
  category: NestCategory;
  emoji: string;
  memberCount: number;
  isTemplate?: boolean;
  createdAt: number;
  creatorUid: string | null;
  rules?: string;
  shareLink?: string;
}

export interface NestMembership {
  id: string;
  nestId: string;
  userId: string;
  joinedAt: number;
}

export interface NestComment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  likedBy: string[];
  likeCount: number;
  createdAt: number;
  replyTo?: string;
  replies?: NestComment[];
  attachments?: MediaAttachment[];
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
}

export interface NestPost {
  id: string;
  nestId: string;
  authorUid: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  media?: NestMedia[];
  likedBy: string[];
  likeCount: number;
  commentCount: number;
  createdAt: number;
  isTemplate: boolean;
  attachments?: MediaAttachment[];
  comments?: NestComment[];
  shareCount?: number;
}

export interface NestMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  filename: string;
  size: number;
  /** Video length in whole seconds. Optional so legacy posts (no duration recorded) read cleanly. */
  duration?: number;
}
