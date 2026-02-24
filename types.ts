
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
  hours: number;
  quality: 'poor' | 'average' | 'good';
  timestamp: number;
}

export interface BabyAvatar {
  id: string;
  name: string;
  skinTone: string;
  gender: 'boy' | 'girl' | 'surprise';
}

export interface PregnancyProfile {
  userName: string;
  lmpDate: string;
  dueDate: string;
  isManualDueDate: boolean;
  pregnancyType: 'singleton' | 'twins' | 'triplets';
  babies: BabyAvatar[];
  themeColor: 'pink' | 'blue' | 'neutral';
  profileImage?: string;
  startingWeight?: number;
  customTargets?: NutritionTargets;
  albums: MemoryAlbums;
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
  timestamp: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
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

export interface FertilityPrediction {
  nextPeriod: string;
  ovulationDay: string;
  fertileWindow: string[];
  advice: string;
}
