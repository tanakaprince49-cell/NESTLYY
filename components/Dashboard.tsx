
import React, { useMemo, useState, useEffect } from 'react';
import { FoodEntry, Trimester, WaterLog, VitaminLog, PregnancyProfile, WeightLog, SleepLog } from '../types.ts';
import { NutrientCard } from './NutrientCard.tsx';
import { HydrationTracker } from './HydrationTracker.tsx';
import { getBabyGrowth } from '../services/babyGrowth.ts';
import { generateDailyReport, generateLaborReport } from '../services/reportService.ts';
import { storage } from '../services/storageService.ts';
import { VisualFoodScanner } from './VisualFoodScanner.tsx';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface DashboardProps {
  entries: FoodEntry[];
  waterLogs: WaterLog[];
  vitamins: VitaminLog[];
  weightLogs: WeightLog[];
  sleepLogs: SleepLog[];
  trimester: Trimester;
  profile: PregnancyProfile;
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemoveEntry: (id: string) => void;
  onAddWater: (amount: number) => void;
  onLogVitamin: (name: string) => void;
  onQuickTool: (cat: string) => void;
  onEditProfile: () => void;
}

const DAILY_TIPS = [
  "Stay hydrated! Your baby needs fluid to support the growing placenta. 💧",
  "Gentle stretching for 10 minutes can significantly reduce lower back pain. 🧘‍♀️",
  "Eat small, frequent meals to help manage morning sickness or heartburn. 🍎",
  "Iron-rich foods like spinach and lean meats support your increasing blood volume. 🥩",
  "Take a moment to talk or sing to your baby—they can hear you soon! 🎶",
  "Sleep on your left side to maximize blood flow to the placenta. 🌙",
  "Don't forget your Kegels today! Strong pelvic floor muscles help during labor. ✨",
  "Pack a 'hospital bag' early—it’s one less thing to worry about later! 👜"
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  entries, waterLogs, vitamins, weightLogs, sleepLogs, trimester, profile, 
  onAddEntry, onRemoveEntry, onAddWater, onLogVitamin, onQuickTool, onEditProfile
}) => {
  const [activeMetric, setActiveMetric] = useState<'fuel' | 'water' | 'weight' | 'sleep'>('fuel');
  const [dailyTip, setDailyTip] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  // Manual food log state
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');

  // Report selection state
  const [selectedReportDate, setSelectedReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const availableDates = useMemo(() => storage.getAvailableReportDates(), [entries]);

  useEffect(() => {
    const day = new Date().getDate();
    setDailyTip(DAILY_TIPS[day % DAILY_TIPS.length]);
  }, []);

  const weeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }, [profile]);

  const baby = useMemo(() => getBabyGrowth(weeks), [weeks]);

  const latestWeight = useMemo(() => {
    if (weightLogs.length > 0) return weightLogs[0].weight;
    return profile.startingWeight || 0;
  }, [weightLogs, profile]);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysEntries = useMemo(() => 
    entries.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === today),
    [entries, today]
  );

  const totals = useMemo(() => 
    todaysEntries.reduce((acc, curr) => ({
      calories: acc.calories + (curr.calories || 0),
      protein: acc.protein + (curr.protein || 0),
      folate: acc.folate + (curr.folate || 0),
      iron: acc.iron + (curr.iron || 0),
      calcium: acc.calcium + (curr.calcium || 0),
    }), { calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0 }),
    [todaysEntries]
  );

  const handleManualFoodLog = () => {
    if (!foodName || !foodCals) return;
    onAddEntry({
      name: foodName,
      calories: parseFloat(foodCals) || 0,
      protein: parseFloat(foodProtein) || 0,
      folate: 0,
      iron: 0,
      calcium: 0
    });
    setFoodName('');
    setFoodCals('');
    setFoodProtein('');
  };

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(dateStr => {
      const dayStart = new Date(dateStr).setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr).setHours(23, 59, 59, 999);
      const dayEntries = entries.filter(e => e.timestamp >= dayStart && e.timestamp <= dayEnd);
      const dayWater = waterLogs.filter(w => w.timestamp >= dayStart && w.timestamp <= dayEnd);
      const dayWeight = weightLogs.find(w => w.timestamp >= dayStart && w.timestamp <= dayEnd);
      const daySleep = sleepLogs.find(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);

      return {
        date: new Date(dateStr).toLocaleDateString([], { weekday: 'short' }),
        fuel: dayEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0),
        water: dayWater.reduce((acc, curr) => acc + curr.amount, 0),
        weight: dayWeight?.weight || (weightLogs[0]?.weight || profile.startingWeight || 0),
        sleep: daySleep?.hours || 0,
      };
    });
  }, [entries, waterLogs, weightLogs, sleepLogs, profile.startingWeight]);

  const metricConfig = {
    fuel: { label: 'Calories', unit: 'kcal', color: '#f43f5e' },
    water: { label: 'Hydration', unit: 'ml', color: '#0ea5e9' },
    weight: { label: 'Weight', unit: 'kg', color: '#8b5cf6' },
    sleep: { label: 'Rest', unit: 'hrs', color: '#10b981' },
  };

  return (
    <div className="space-y-6 px-5 pb-36 pt-2 animate-slide-up no-scrollbar overflow-x-hidden relative z-10">
      
      {showScanner && (
        <VisualFoodScanner 
          onClose={() => setShowScanner(false)} 
          onAddEntry={onAddEntry} 
        />
      )}

      {/* Welcome & Profile Management */}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Your Journey</span>
          <h2 className="text-4xl font-serif text-slate-900 leading-tight">Bonjour, <br/>{profile.userName}</h2>
        </div>
        <button 
          onClick={onEditProfile}
          className="bg-white/50 backdrop-blur-md border border-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#7e1631] transition-all active:scale-95"
        >
          Edit Profile
        </button>
      </div>

      {/* Clinician Reviewed Daily Tip */}
      <div className="p-5 bg-gradient-to-br from-rose-50 to-white rounded-[2.5rem] border border-rose-100/50 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1 shadow-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
           Clinician Verified
         </div>
         <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-rose-200 shrink-0">✨</div>
            <div className="space-y-1">
               <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Mama Wisdom</span>
               <p className="text-xs font-bold text-slate-800 italic leading-snug">"{dailyTip}"</p>
            </div>
         </div>
      </div>

      {/* Visual Food Logger Quick Access */}
      <div className="card-premium p-6 bg-[#7e1631] border-none shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full" />
         <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
               <h3 className="text-white font-serif text-lg">Visual Meal Log</h3>
               <p className