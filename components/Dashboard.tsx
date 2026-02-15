import React, { useMemo, useState, useEffect } from 'react';
import { FoodEntry, Trimester, WaterLog, VitaminLog, PregnancyProfile, WeightLog, SleepLog } from '../types.ts';
import { NutrientCard } from './NutrientCard.tsx';
import { HydrationTracker } from './HydrationTracker.tsx';
import { getBabyGrowth } from '../services/babyGrowth.ts';
import { generateDailyReport, generateLaborReport } from '../services/reportService.ts';
import { storage } from '../services/storageService.ts';
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

      {/* Labor Quick Access (3rd Trimester Only) */}
      {trimester === Trimester.THIRD && (
        <div className="card-premium p-6 bg-slate-900 border-none shadow-2xl relative overflow-hidden animate-pulse">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full" />
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                 <h3 className="text-white font-serif text-lg">Labor Preparation</h3>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ready to track contractions?</p>
              </div>
              <button 
                onClick={() => onQuickTool('labor')}
                className="px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                Launch Timer
              </button>
           </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-premium p-5 flex flex-col justify-between border-2 border-white/50">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-serif text-slate-900">{latestWeight}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase">KG</span>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-50">
             <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Start: {profile.startingWeight}kg</span>
           </div>
        </div>
        <div className="card-premium p-5 flex flex-col justify-between border-2 border-white/50">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baby Age</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-serif text-slate-900">{weeks}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase">WEEKS</span>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-50">
             <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">{trimester}</span>
           </div>
        </div>
      </div>

      {/* Baby Status Card */}
      <div className="card-premium p-6 bg-white relative overflow-hidden group shadow-md border-2 border-white/50">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-rose-100 animate-float shrink-0">{baby.image}</div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-serif text-slate-900 leading-tight">Size of a {baby.size}</h2>
            <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">"{baby.description}"</p>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Wellness Trends</h3>
          <div className="flex gap-1.5">
            {(['fuel', 'water', 'weight', 'sleep'] as const).map(m => (
              <button key={m} onClick={() => setActiveMetric(m)} className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base border-2 transition-all ${activeMetric === m ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-100 scale-110' : 'bg-white text-slate-300 border-slate-50'}`}>
                {m === 'fuel' ? '🍎' : m === 'water' ? '💧' : m === 'weight' ? '⚖️' : '😴'}
              </button>
            ))}
          </div>
        </div>
        <div className="card-premium p-5 bg-white shadow-sm h-60 relative overflow-hidden border-2 border-white/50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 800}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1', fontWeight: 700}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} 
                labelStyle={{ display: 'none' }}
              />
              <Area type="monotone" dataKey={activeMetric} stroke={metricConfig[activeMetric].color} fillOpacity={0.06} fill={metricConfig[activeMetric].color} strokeWidth={3} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NutrientCard title="Calories" current={totals.calories} target={profile.customTargets?.cals || 2000} unit="kcal" gradient="from-rose-400 to-rose-600" />
        <NutrientCard title="Protein" current={totals.protein} target={profile.customTargets?.protein || 75} unit="g" gradient="from-emerald-400 to-emerald-600" />
      </div>

      {/* Manual Food Quick Log */}
      <div className="card-premium p-6 bg-white border-2 border-white/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Quick Food Log</h3>
          <span className="text-[9px] text-slate-400 font-bold italic">Fuel your nest</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="What did you eat?" 
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-semibold placeholder:text-slate-300"
          />
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Kcal" 
              value={foodCals}
              onChange={(e) => setFoodCals(e.target.value)}
              className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-semibold placeholder:text-slate-300"
            />
            <input 
              type="number" 
              placeholder="Protein (g)" 
              value={foodProtein}
              onChange={(e) => setFoodProtein(e.target.value)}
              className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-semibold placeholder:text-slate-300"
            />
            <button 
              onClick={handleManualFoodLog}
              disabled={!foodName || !foodCals}
              className="px-6 h-12 bg-[#7e1631] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-30 transition-all shrink-0"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      <HydrationTracker logs={waterLogs} onAddWater={onAddWater} />

      {/* PDF Export Section at the Bottom - Updated with History selection */}
      <div className="pt-12 pb-6 space-y-6">
        <div className="text-center">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">History Records</h3>
          <p className="text-[10px] text-slate-300 font-medium italic">Securely download your pregnancy history for clinic visits</p>
        </div>
        
        <div className="space-y-4">
          <div className="card-premium p-4 bg-white/40 border border-slate-100 flex flex-col gap-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Report Date</label>
            <div className="flex gap-2">
              <select 
                value={selectedReportDate}
                onChange={(e) => setSelectedReportDate(e.target.value)}
                className="flex-1 h-12 bg-white border border-slate-100 rounded-xl px-4 text-sm font-bold appearance-none"
              >
                {!availableDates.includes(new Date().toISOString().split('T')[0]) && (
                   <option value={new Date().toISOString().split('T')[0]}>
                     Today ({new Date().toLocaleDateString()})
                   </option>
                )}
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => generateDailyReport(new Date(selectedReportDate))}
                className="px-6 h-12 bg-[#7e1631] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Download PDF
              </button>
            </div>
          </div>
          
          {trimester === Trimester.THIRD && (
            <button 
              onClick={() => generateLaborReport(new Date())}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              ⏱️ Download Labor Summary
            </button>
          )}
        </div>
      </div>

      <footer className="text-center py-8 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Nestly: Encrypted Private Nest</p>
      </footer>
    </div>
  );
};