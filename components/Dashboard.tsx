import React, { useMemo, useState, useEffect } from 'react';
import { FoodEntry, Trimester, WaterLog, VitaminLog, PregnancyProfile, WeightLog, SleepLog } from '../types.ts';
import { NutrientCard } from './NutrientCard.tsx';
import { HydrationTracker } from './HydrationTracker.tsx';
import { getBabyGrowth } from '../services/babyGrowth.ts';
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
  
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');

  useEffect(() => {
    const day = new Date().getDate();
    setDailyTip(DAILY_TIPS[day % DAILY_TIPS.length]);
  }, []);

  const weeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }, [profile]);

  const baby = useMemo(() => getBabyGrowth(weeks), [weeks]);

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

  const targets = profile.customTargets || {
    cals: 2200,
    protein: 75,
    folate: 600,
    iron: 27,
    calcium: 1000
  };

  return (
    <div className="space-y-6 px-5 pb-36 pt-2 animate-slide-up no-scrollbar overflow-x-hidden relative z-10">
      
      {/* Header */}
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

      {/* Tip Card */}
      <div className="p-5 bg-gradient-to-br from-rose-50 to-white rounded-[2.5rem] border border-rose-100/50 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1 shadow-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
           Clinician Verified
         </div>
         <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-rose-200 shrink-0 animate-float">✨</div>
            <div className="space-y-1">
               <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Mama Wisdom</span>
               <p className="text-xs font-bold text-slate-800 italic leading-snug">"{dailyTip}"</p>
            </div>
         </div>
      </div>

      {/* Nutrient Grid */}
      <div className="grid grid-cols-2 gap-4">
        <NutrientCard title="Daily Fuel" current={totals.calories} target={targets.cals} unit="kcal" gradient="from-rose-400 to-rose-600" />
        <NutrientCard title="Protein" current={totals.protein} target={targets.protein} unit="g" gradient="from-emerald-400 to-emerald-600" />
      </div>

      {/* Hydration */}
      <HydrationTracker logs={waterLogs} onAddWater={onAddWater} />

      {/* Baby Status */}
      <div className="card-premium p-8 bg-white border-2 border-slate-50 relative overflow-hidden group">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-rose-100 group-hover:scale-110 transition-transform">
            {baby.image}
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Baby's Current Size</span>
            <h3 className="text-2xl font-serif text-slate-900 leading-none">Size of a {baby.size}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{weeks} Weeks Pregnant</p>
          </div>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="card-premium p-6 bg-white border-2 border-slate-50 space-y-4">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Quick Log Food</h4>
        <div className="space-y-3">
          <input 
            value={foodName} 
            onChange={e => setFoodName(e.target.value)} 
            placeholder="Food Name (e.g., Avocado Toast)" 
            className="text-sm bg-slate-50 border-none rounded-2xl h-12"
          />
          <div className="flex gap-3">
            <input 
              type="number" 
              value={foodCals} 
              onChange={e => setFoodCals(e.target.value)} 
              placeholder="Kcal" 
              className="text-sm bg-slate-50 border-none rounded-2xl h-12 flex-1"
            />
            <input 
              type="number" 
              value={foodProtein} 
              onChange={e => setFoodProtein(e.target.value)} 
              placeholder="Prot (g)" 
              className="text-sm bg-slate-50 border-none rounded-2xl h-12 flex-1"
            />
            <button 
              onClick={handleManualFoodLog}
              className="px-6 bg-[#7e1631] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="card-premium p-6 bg-white border-2 border-slate-50 h-80">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Weekly Analytics</h4>
          <div className="flex gap-2">
            {(['fuel', 'water', 'weight', 'sleep'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setActiveMetric(m)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${activeMetric === m ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
              >
                {m === 'fuel' ? '🍎' : m === 'water' ? '💧' : m === 'weight' ? '⚖️' : '😴'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
            <Area type="monotone" dataKey={activeMetric} stroke="#f43f5e" fillOpacity={1} fill="url(#colorMetric)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};