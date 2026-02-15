
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

export interface PregnancyProfile {
  userName: string;
  lmpDate: string;
  dueDate: string;
  babyName?: string;
  profileImage?: string;
  startingWeight?: number;
  customTargets?: NutritionTargets;
  albums: MemoryAlbums;
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

// Added missing FoodResearchResult interface
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

// Added missing FertilityPrediction interface
export interface FertilityPrediction {
  nextPeriod: string;
  ovulationDay: string;
  fertileWindow: string[];
  advice: string;
}
