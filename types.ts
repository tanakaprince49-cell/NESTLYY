
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
  ultrasound: MemoryPhoto[];
  family: MemoryPhoto[];
  favorites: MemoryPhoto[];
}

export interface WeightLog {
  id: string;
  weight: number;
  timestamp: number;
}

export interface SleepLog {
  id: string;
  babyId?: string;
  hours: number;
  quality: number; // 1-5 scale
  type: 'nap' | 'night';
  startTime: number;
  endTime?: number;
  notes?: string;
  timestamp: number;
}

export interface BabyAvatar {
  id: string;
  name: string;
  skinTone: string;
  gender: 'boy' | 'girl' | 'surprise';
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
  themeColor: 'pink' | 'blue' | 'neutral' | 'orange' | 'sage' | 'lavender' | 'sand' | 'mint' | 'sky' | 'peach' | 'lilac' | 'stone';
  profileImage?: string;
  startingWeight?: number;
  customTargets?: NutritionTargets;
  albums: MemoryAlbums;
  lifecycleStage: LifecycleStage;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
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

export interface WaterLog {
  amount: number;
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

export interface TummyTimeLog {
  id: string;
  babyId: string;
  duration: number; // in seconds
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface PeriodLog {
  id: string;
  startDate: string;
  timestamp: number;
}

export interface AvaMemoryFact {
  id: string;
  content: string;
  category: 'preference' | 'symptom' | 'milestone' | 'info';
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
