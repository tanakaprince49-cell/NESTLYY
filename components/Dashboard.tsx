import React, { useMemo, useState, useEffect } from 'react';
import { 
  FoodEntry, 
  Trimester, 
  WaterLog, 
  VitaminLog, 
  PregnancyProfile, 
  WeightLog, 
  SleepLog,
  LifecycleStage,
  FeedingLog,
  MilestoneLog,
  HealthLog,
  ReactionLog,
  JournalEntry
} from '../types.ts';
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
  feedingLogs: FeedingLog[];
  milestones: MilestoneLog[];
  healthLogs: HealthLog[];
  reactions: ReactionLog[];
  journalEntries: JournalEntry[];
  trimester: Trimester;
  profile: PregnancyProfile;
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemoveEntry: (id: string) => void;
  onAddWater: (amount: number) => void;
  onLogVitamin: (name: string) => void;
  onQuickTool: (cat: string) => void;
  onEditProfile: () => void;
  onUpdateProfile?: (profile: PregnancyProfile) => void;
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
  entries, waterLogs, vitamins, weightLogs, sleepLogs, 
  feedingLogs, milestones, healthLogs, reactions, journalEntries,
  trimester, profile, 
  onAddEntry, onRemoveEntry, onAddWater, onLogVitamin, onQuickTool, onEditProfile, onUpdateProfile
}) => {
  const isPostpartum = profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;
  const [activeMetric, setActiveMetric] = useState<'fuel' | 'water' | 'weight' | 'sleep'>('fuel');
  const [newbornTab, setNewbornTab] = useState<'growth' | 'feeding' | 'sleep' | 'milestones' | 'health' | 'journal'>('feeding');
  const [selectedBabyId, setSelectedBabyId] = useState<string>(profile.babies?.[0]?.id || 'combined');
  const [dailyTip, setDailyTip] = useState('');
  
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');

  useEffect(() => {
    const day = new Date().getDate();
    setDailyTip(DAILY_TIPS[day % DAILY_TIPS.length]);
  }, []);

  const weeks = useMemo(() => {
    if (isPostpartum) return 0;
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }, [profile, isPostpartum]);

  const baby = useMemo(() => isPostpartum ? null : getBabyGrowth(weeks), [weeks, isPostpartum]);

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

  const todayWater = useMemo(() => 
    waterLogs.filter(w => new Date(w.timestamp).setHours(0, 0, 0, 0) === today)
    .reduce((acc, curr) => acc + curr.amount, 0),
    [waterLogs, today]
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
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
            {isPostpartum ? 'Newborn Journey' : 'Pregnancy Journey'}
          </span>
          <h2 className="text-4xl font-serif text-slate-900 leading-tight">Bonjour, <br/>{profile.userName}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const nextStage = isPostpartum ? LifecycleStage.PREGNANCY : LifecycleStage.NEWBORN;
                onUpdateProfile?.({ ...profile, lifecycleStage: nextStage });
              }}
              className="bg-rose-100 text-rose-900 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all active:scale-95"
            >
              Switch to {isPostpartum ? 'Pregnancy' : 'Newborn'}
            </button>
            <button 
              onClick={onEditProfile}
              className="bg-white/50 backdrop-blur-md border border-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-900 transition-all active:scale-95"
            >
              Edit Profile
            </button>
          </div>
          <div className="flex gap-1 bg-white/30 p-1 rounded-xl border border-white/50 relative z-50">
            {(['pink', 'blue', 'neutral'] as const).map(c => (
              <button
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedProfile = { ...profile, themeColor: c };
                  onUpdateProfile?.(updatedProfile);
                }}
                className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${profile.themeColor === c ? 'border-rose-500 scale-110 shadow-sm' : 'border-transparent opacity-40 hover:opacity-100'}`}
                style={{ backgroundColor: c === 'pink' ? '#f43f5e' : c === 'blue' ? '#3b82f6' : '#64748b' }}
              />
            ))}
          </div>
        </div>
      </div>

      {isPostpartum && (
        <div className="space-y-6">
          {/* Newborn Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 sticky top-0 z-40 bg-[#fffaf9]/80 backdrop-blur-sm">
            {(['growth', 'feeding', 'sleep', 'milestones', 'health', 'journal'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setNewbornTab(tab)}
                className={`flex-none px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${newbornTab === tab ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-white text-slate-400 border-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Baby Selector (Individual vs Combined) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {profile.babies?.length > 1 && (
              <button
                onClick={() => setSelectedBabyId('combined')}
                className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedBabyId === 'combined' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                Combined View
              </button>
            )}
            {profile.babies?.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setSelectedBabyId(b.id)}
                className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedBabyId === b.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {b.name || `Baby ${idx + 1}`}
              </button>
            ))}
          </div>

          {/* Newborn Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {newbornTab === 'feeding' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-4">
                  <h3 className="text-lg font-serif text-rose-800">Feeding Overview</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['breast', 'bottle', 'solid'].map(type => {
                      const count = feedingLogs.filter(f => 
                        (selectedBabyId === 'combined' || f.babyId === selectedBabyId) && 
                        f.type === type && 
                        new Date(f.timestamp).setHours(0,0,0,0) === today
                      ).length;
                      return (
                        <div key={type} className="p-4 bg-slate-50 rounded-2xl text-center">
                          <div className="text-xl mb-1">{type === 'breast' ? '🤱' : type === 'bottle' ? '🍼' : '🥣'}</div>
                          <div className="text-[8px] font-black uppercase text-slate-400">{type}</div>
                          <div className="text-lg font-bold text-slate-900">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => onQuickTool('feeding')} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">Log New Feeding</button>
              </div>
            )}

            {newbornTab === 'sleep' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-4">
                  <h3 className="text-lg font-serif text-rose-800">Sleep Summary</h3>
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                    <div className="text-4xl">😴</div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Rest</div>
                      <div className="text-2xl font-bold text-indigo-900">{sleepLogs[0]?.hours || '--'} hrs</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => onQuickTool('sleep')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">Log Sleep</button>
              </div>
            )}

            {newbornTab === 'milestones' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-4">
                  <h3 className="text-lg font-serif text-rose-800">Latest Milestones</h3>
                  <div className="space-y-3">
                    {milestones
                      .filter(m => selectedBabyId === 'combined' || m.babyId === selectedBabyId)
                      .slice(0, 3)
                      .map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                          <span className="text-xl">🏆</span>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{m.title}</div>
                            <div className="text-[8px] font-black text-amber-400 uppercase">{new Date(m.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    {milestones.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No milestones recorded yet.</p>}
                  </div>
                </div>
                <button onClick={() => onQuickTool('milestones')} className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">Add Milestone</button>
              </div>
            )}

            {newbornTab === 'health' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-4">
                  <h3 className="text-lg font-serif text-rose-800">Health Logs</h3>
                  <div className="space-y-3">
                    {healthLogs
                      .filter(h => selectedBabyId === 'combined' || h.babyId === selectedBabyId)
                      .slice(0, 3)
                      .map(h => (
                        <div key={h.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                          <div>
                            <div className="text-[8px] font-black text-blue-400 uppercase">{h.type}</div>
                            <div className="text-sm font-bold text-slate-900">{h.value}</div>
                          </div>
                          <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(h.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
                <button onClick={() => onQuickTool('health')} className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">Log Health Event</button>
              </div>
            )}

            {newbornTab === 'growth' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-serif text-rose-800">Growth & Profile</h3>
                    {selectedBabyId !== 'combined' && (
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        {profile.babies.find(b => b.id === selectedBabyId)?.gender}
                      </span>
                    )}
                  </div>
                  
                  {selectedBabyId === 'combined' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {profile.babies.map(b => (
                        <div key={b.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{b.gender === 'boy' ? '👦' : b.gender === 'girl' ? '👧' : '👶'}{b.skinTone}</span>
                            <span className="font-bold text-slate-900">{b.name || 'Baby'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-black text-slate-400 uppercase">Latest Weight</div>
                            <div className="text-sm font-bold text-rose-600">
                              {weightLogs.find(w => w.id.includes(b.id))?.weight || '--'} kg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-5xl shadow-inner border-4 border-white">
                          {profile.babies.find(b => b.id === selectedBabyId)?.gender === 'boy' ? '👦' : profile.babies.find(b => b.id === selectedBabyId)?.gender === 'girl' ? '👧' : '👶'}
                          {profile.babies.find(b => b.id === selectedBabyId)?.skinTone}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                          <div className="text-[8px] font-black text-emerald-400 uppercase">Weight</div>
                          <div className="text-xl font-bold text-emerald-900">{weightLogs.find(w => w.id.includes(selectedBabyId))?.weight || '--'} kg</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl text-center">
                          <div className="text-[8px] font-black text-blue-400 uppercase">Birth Weight</div>
                          <div className="text-xl font-bold text-blue-900">{profile.babies.find(b => b.id === selectedBabyId)?.birthWeight || '--'} kg</div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Birth Date</div>
                        <div className="text-sm font-bold text-slate-900">
                          {profile.babies.find(b => b.id === selectedBabyId)?.birthDate ? new Date(profile.babies.find(b => b.id === selectedBabyId)!.birthDate!).toLocaleDateString() : 'Not set'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => onQuickTool('vitals')} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">Update Growth Data</button>
              </div>
            )}

            {newbornTab === 'journal' && (
              <div className="space-y-4">
                <div className="card-premium p-6 bg-white border-2 border-white space-y-4">
                  <h3 className="text-lg font-serif text-rose-800">Recent Reflections</h3>
                  <div className="space-y-3">
                    {journalEntries.slice(0, 3).map(entry => (
                      <div key={entry.id} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-lg">{entry.mood || '📝'}</span>
                          <span className="text-[8px] font-black text-rose-300 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed">"{entry.content}"</p>
                      </div>
                    ))}
                    {journalEntries.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No reflections yet.</p>}
                  </div>
                </div>
                <button onClick={() => onQuickTool('journal')} className="w-full py-8 bg-white border-2 border-dashed border-rose-200 rounded-[2.5rem] text-rose-400 flex flex-col items-center gap-2">
                  <span className="text-3xl">✍️</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Write a Reflection</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isPostpartum && (
        <>
          {/* Summary Widgets Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Daily Glance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => onQuickTool('vitals')} className="card-premium p-5 bg-white border-2 border-slate-50 flex flex-col justify-between cursor-pointer active:scale-95 transition-transform min-h-[140px]">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                  Vital Stats
                </span>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Weight</span>
                    <span className="text-sm font-bold text-slate-800">{weightLogs[0]?.weight || profile.startingWeight || '--'} <span className="text-[8px] font-normal">kg</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Sleep</span>
                    <span className="text-sm font-bold text-slate-800">{sleepLogs[0]?.hours || '--'} <span className="text-[8px] font-normal">hrs</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Water</span>
                    <span className="text-sm font-bold text-slate-800">{todayWater} <span className="text-[8px] font-normal">ml</span></span>
                  </div>
                </div>
              </div>

              <div onClick={() => onQuickTool('progress')} className="card-premium p-5 bg-rose-900 text-white flex flex-col justify-between cursor-pointer active:scale-95 transition-transform min-h-[140px]">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                   Baby Growth
                 </span>
                 <div className="mt-2 text-center">
                   <div className="flex justify-center gap-1 mb-1">
                     {profile.babies?.map((b, i) => (
                       <span key={i} className="text-2xl">
                         {b.gender === 'boy' ? '👦' : b.gender === 'girl' ? '👧' : '👶'}{b.skinTone}
                       </span>
                     ))}
                   </div>
                   <span className="text-[10px] font-serif block leading-tight">Size of {profile.pregnancyType === 'singleton' ? 'a' : profile.pregnancyType === 'twins' ? 'two' : 'three'} {baby?.size}</span>
                   <span className="text-[8px] uppercase tracking-widest opacity-60 mt-2 block">Week {weeks}</span>
                 </div>
              </div>
            </div>
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
                   <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Parent Wisdom</span>
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
                  className="px-6 bg-rose-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95"
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
        </>
      )}
    </div>
  );
};