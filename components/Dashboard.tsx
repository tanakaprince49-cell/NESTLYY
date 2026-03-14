import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Baby,
  Camera,
  Settings as SettingsIcon,
  Milk,
  Moon,
  Ruler,
  Trophy,
  FileText,
  Heart,
  Utensils,
  Apple,
  Droplets,
  Scale,
  Sparkles,
  Bell,
  Send,
  Smile,
  Frown,
  Meh,
  PenLine,
  Check,
  Download,
  Stethoscope,
  Activity,
  Droplet
} from 'lucide-react';
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
  JournalEntry,
  BabyGrowthLog,
  DiaperLog,
  TummyTimeLog,
  MedicationLog,
  BloodPressureLog
} from '../types.ts';

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
  babyGrowthLogs: BabyGrowthLog[];
  diaperLogs: DiaperLog[];
  tummyTimeLogs: TummyTimeLog[];
  medicationLogs: MedicationLog[];
  bloodPressureLogs: BloodPressureLog[];
  trimester: Trimester;
  profile: PregnancyProfile;
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemoveEntry: (id: string) => void;
  onAddWater: (amount: number) => void;
  onLogVitamin: (name: string) => void;
  onQuickTool: (cat: string) => void;
  onEditProfile: () => void;
  onUpdateProfile?: (profile: PregnancyProfile) => void;
  onAddBabyGrowth?: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
  onAddMedication?: (log: Omit<MedicationLog, 'id' | 'timestamp'>) => void;
  onRemoveMedication?: (id: string) => void;
  onNavigate?: (tab: any) => void;
}

const DAILY_TIPS = [
  "WHO recommends at least 400g of fruit and vegetables daily for optimal maternal health.",
  "WHO guidelines suggest 150 minutes of moderate-intensity physical activity per week during pregnancy.",
  "Exclusive breastfeeding for the first 6 months is recommended by the World Health Organization.",
  "WHO supports early initiation of breastfeeding within one hour of birth.",
  "WHO recommends iron and folic acid supplementation daily to prevent maternal anemia.",
  "WHO guidelines emphasize the importance of at least 8 antenatal contacts for a positive pregnancy experience.",
  "WHO suggests skin-to-skin contact between mothers and newborns immediately after birth.",
  "WHO recommends delayed umbilical cord clamping for improved infant health outcomes.",
  "WHO recommends that pregnant women should not use tobacco or alcohol.",
  "WHO suggests that caffeine intake should be limited to less than 200mg per day.",
  "WHO recommends that all pregnant women should have a birth preparedness and complication readiness plan.",
  "WHO supports the use of kangaroo mother care for low-birth-weight infants."
];

import { subscribeUserToPush } from '../services/pushService.ts';

export const Dashboard: React.FC<DashboardProps> = ({ 
  entries = [], waterLogs = [], vitamins = [], weightLogs = [], sleepLogs = [], 
  feedingLogs = [], milestones = [], healthLogs = [], reactions = [], journalEntries = [], babyGrowthLogs = [], diaperLogs = [],
  tummyTimeLogs = [], medicationLogs = [], bloodPressureLogs = [],
  trimester, profile, 
  onAddEntry, onRemoveEntry, onAddWater, onLogVitamin, onQuickTool, onEditProfile, onUpdateProfile, onAddBabyGrowth, onAddMedication, onRemoveMedication, onNavigate
}) => {
  const isPostpartum = profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;
  const [activeMetric, setActiveMetric] = useState<'fuel' | 'water' | 'weight' | 'sleep' | 'feeding' | 'tummy'>('fuel');
  const [newbornTab, setNewbornTab] = useState<'growth' | 'feeding' | 'sleep' | 'milestones' | 'health' | 'journal'>('feeding');
  const [selectedBabyId, setSelectedBabyId] = useState<string>(profile.babies?.[0]?.id || 'combined');
  const [dailyTip, setDailyTip] = useState('');
  const [showPushPrompt, setShowPushPrompt] = useState(Notification.permission === 'default');
  
  const [foodName, setFoodName] = useState('');
  const [foodCals, setFoodCals] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleEnablePush = async () => {
    const sub = await subscribeUserToPush();
    if (sub) {
      setShowPushPrompt(false);
      onUpdateProfile?.({ ...profile, notificationsEnabled: true });
    }
  };

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

  const babyAge = useMemo(() => {
    if (!isPostpartum || !profile.babies?.[0]?.birthDate) return null;
    const birth = new Date(profile.babies[0]!.birthDate!);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.44);
    
    if (diffMonths > 0) return `${diffMonths}m ${Math.floor((diffDays % 30.44) / 7)}w`;
    if (diffWeeks > 0) return `${diffWeeks}w ${diffDays % 7}d`;
    return `${diffDays} days`;
  }, [isPostpartum, profile.babies]);

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
    setToast('Food logged successfully!');
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
      const dayEntries = (entries || []).filter(e => e.timestamp >= dayStart && e.timestamp <= dayEnd);
      const dayWater = (waterLogs || []).filter(w => w.timestamp >= dayStart && w.timestamp <= dayEnd);
      const dayWeight = (weightLogs || []).find(w => w.timestamp >= dayStart && w.timestamp <= dayEnd);
      const daySleep = (sleepLogs || []).filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);
      const dayFeeding = (feedingLogs || []).filter(f => f.timestamp >= dayStart && f.timestamp <= dayEnd);
      const dayTummy = (tummyTimeLogs || []).filter(t => t.timestamp >= dayStart && t.timestamp <= dayEnd);

      return {
        date: new Date(dateStr).toLocaleDateString([], { weekday: 'short' }),
        fuel: dayEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0),
        water: dayWater.reduce((acc, curr) => acc + curr.amount, 0),
        weight: dayWeight?.weight || (weightLogs?.[0]?.weight || profile.startingWeight || 0),
        sleep: daySleep.reduce((acc, curr) => acc + curr.hours, 0),
        feeding: dayFeeding.length,
        tummy: dayTummy.reduce((acc, curr) => acc + curr.duration, 0) / 60, // minutes
      };
    });
  }, [entries, waterLogs, weightLogs, sleepLogs, feedingLogs, tummyTimeLogs, profile.startingWeight]);

  const targets = profile.customTargets || {
    cals: 2200,
    protein: 75,
    folate: 600,
    iron: 27,
    calcium: 1000
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-5 pb-36 pt-2 no-scrollbar overflow-x-hidden relative z-10"
    >
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
            {isPostpartum ? 'Newborn Journey' : 'Pregnancy Journey'}
          </span>
          <h2 className="text-4xl font-serif text-slate-900 leading-tight">Bonjour, <br/>{profile.userName}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          {profile.profileImage && (
            <img src={profile.profileImage} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
          )}
        </div>
      </div>

      {isPostpartum && (
        <div className="space-y-6">
          {/* Baby Age & Quick Summary */}
          <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-rose-100 rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-inner border border-white">
                <Baby size={32} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-slate-900">{profile.babies?.[0]?.name || 'Baby'}</h3>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{babyAge} old</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onQuickTool('memories')} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-400 hover:text-rose-500 transition-colors">
                <Camera size={20} />
              </button>
              <button onClick={() => onNavigate?.('settings')} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-50 text-slate-400 hover:text-rose-500 transition-colors">
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>

          {/* Today's Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-premium p-5 bg-white border-2 border-white flex flex-col justify-between min-h-[120px]">
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Feedings</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {(feedingLogs || []).filter(f => new Date(f.timestamp).setHours(0,0,0,0) === today).length}
                </span>
                <span className="text-[10px] text-slate-400 ml-1 font-medium">today</span>
              </div>
              <div className="text-[8px] text-slate-300 font-bold uppercase mt-1">
                Last: {feedingLogs?.[0] ? new Date(feedingLogs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
              </div>
            </div>
            <div className="card-premium p-5 bg-white border-2 border-white flex flex-col justify-between min-h-[120px]">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sleep</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {(sleepLogs || []).filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today).reduce((acc, curr) => acc + curr.hours, 0).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 ml-1 font-medium">hrs</span>
              </div>
              <div className="text-[8px] text-slate-300 font-bold uppercase mt-1">
                {(sleepLogs || []).filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today).length} sessions
              </div>
            </div>
            <div className="card-premium p-5 bg-white border-2 border-white flex flex-col justify-between min-h-[120px]">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Diapers</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {(diaperLogs || []).filter(d => new Date(d.timestamp).setHours(0,0,0,0) === today).length}
                </span>
                <span className="text-[10px] text-slate-400 ml-1 font-medium">today</span>
              </div>
              <div className="flex gap-1 mt-1">
                {['wet', 'dirty', 'mixed'].map(t => (
                  <div key={t} className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-slate-50 rounded-md text-slate-400">
                    {t[0]}:{(diaperLogs || []).filter(d => new Date(d.timestamp).setHours(0,0,0,0) === today && d.type === t).length}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-premium p-5 bg-white border-2 border-white flex flex-col justify-between min-h-[120px]">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Mood</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">
                  {(journalEntries || []).filter(j => new Date(j.timestamp).setHours(0,0,0,0) === today && j.mood).length > 0 
                    ? (journalEntries || []).filter(j => new Date(j.timestamp).setHours(0,0,0,0) === today && j.mood)[0].mood 
                    : <Smile className="text-amber-400" size={24} />}
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-bold uppercase mt-1">Daily Vibe</div>
            </div>
          </div>

          {/* Newborn Tools Grid */}
          <div className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Newborn Tools</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'feeding', icon: Milk, label: 'Feed', color: 'text-rose-400' },
                { id: 'sleep', icon: Moon, label: 'Sleep', color: 'text-indigo-400' },
                { id: 'diaper', icon: Droplets, label: 'Diaper', color: 'text-emerald-400' },
                { id: 'vitals', icon: Ruler, label: 'Growth', color: 'text-blue-400' },
                { id: 'milestones', icon: Trophy, label: 'Milestone', color: 'text-amber-400' },
                { id: 'health', icon: Stethoscope, label: 'Health', color: 'text-red-400' },
                { id: 'tummy_time', icon: Activity, label: 'Tummy Time', color: 'text-orange-400' },
                { id: 'bath', icon: Droplet, label: 'Bath', color: 'text-cyan-400' },
                { id: 'pumping', icon: Droplets, label: 'Pumping', color: 'text-pink-400' },
                { id: 'teething', icon: Smile, label: 'Teething', color: 'text-yellow-400' },
                { id: 'journal', icon: FileText, label: 'Notes', color: 'text-slate-400' },
                { id: 'export', icon: Download, label: 'Export PDF', color: 'text-purple-400' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => onQuickTool(btn.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white shadow-sm active:scale-95 transition-all group hover:bg-white"
                >
                  <span className={`transition-transform group-hover:scale-110 ${btn.color}`}>
                    <btn.icon size={24} />
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Newborn Analytics */}
          <div className="space-y-4">
            <div className="card-premium p-6 bg-white border-2 border-slate-50 h-80">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Baby Activity Trends</h4>
                <div className="flex gap-2">
                  {(['feeding', 'sleep', 'tummy'] as const).map(m => (
                    <button 
                      key={m} 
                      onClick={() => setActiveMetric(m as any)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMetric === m ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {m === 'feeding' ? <Milk size={16} /> : m === 'sleep' ? <Moon size={16} /> : <Activity size={16} />}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNewborn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeMetric === 'feeding' ? '#f43f5e' : activeMetric === 'sleep' ? '#6366f1' : '#f97316'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={activeMetric === 'feeding' ? '#f43f5e' : activeMetric === 'sleep' ? '#6366f1' : '#f97316'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                  <Area type="monotone" dataKey={activeMetric} stroke={activeMetric === 'feeding' ? '#f43f5e' : activeMetric === 'sleep' ? '#6366f1' : '#f97316'} fillOpacity={1} fill="url(#colorNewborn)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Analysis Card - Visible for both Pregnancy & Postpartum */}
      <div className="card-premium p-6 bg-white border-2 border-slate-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-900">
          <Moon size={120} />
        </div>
        <div className="relative z-10">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900/40">Sleep Analysis</span>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-3xl font-bold text-blue-900">
                {(sleepLogs.reduce((acc, curr) => acc + curr.hours, 0) / Math.max(1, sleepLogs.length)).toFixed(1)}h
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg / Session</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-900">
                {(sleepLogs.filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today).length)}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sessions Today</p>
            </div>
          </div>
          <div className="mt-6 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="sleep" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] mt-4 text-slate-500 font-medium leading-relaxed">
            {isPostpartum 
              ? `WHO recommends 14-17 hours of sleep for newborns. Your baby is currently averaging ${ (chartData.reduce((acc, curr) => acc + curr.sleep, 0) / 7).toFixed(1) } hours per day.`
              : `Quality sleep is vital for your health and baby's development. You're currently averaging ${ (chartData.reduce((acc, curr) => acc + curr.sleep, 0) / 7).toFixed(1) } hours per day.`
            }
          </p>
        </div>
      </div>

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

              <div className="card-premium p-5 bg-white border-2 border-slate-50 flex flex-col justify-between min-h-[140px]">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                   Baby Growth
                 </span>
                 <div className="mt-2 text-center">
                   <span className="text-[12px] font-serif block leading-tight text-indigo-900">Size of {profile.pregnancyType === 'singleton' ? 'a' : profile.pregnancyType === 'twins' ? 'two' : 'three'} {baby?.size}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mt-2 block">Week {weeks}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Journey Progress Timeline */}
          <div className="card-premium p-8 bg-white border-2 border-slate-50 space-y-8 text-center">
            <div className="space-y-2">
               <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em]">Journey Progress</h3>
               <div className="text-3xl font-serif text-slate-900">Month {Math.floor(weeks / 4.3) + 1} / Week {weeks}</div>
            </div>

            <div className="space-y-6">
               <div className="relative pt-4">
                  <div className="flex justify-between text-[8px] font-black uppercase text-slate-300 tracking-widest mb-4">
                     <span>Tri 1</span>
                     <span>Tri 2</span>
                     <span>Tri 3</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full flex overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${weeks < 13 ? 'bg-rose-500' : 'bg-rose-200'}`} style={{ width: '33.3%' }} />
                     <div className={`h-full transition-all duration-1000 ${weeks >= 13 && weeks < 27 ? 'bg-rose-500' : weeks >= 27 ? 'bg-rose-200' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                     <div className={`h-full transition-all duration-1000 ${weeks >= 27 ? 'bg-rose-500' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                     <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Time Lapsed</span>
                     <div className="text-xl font-bold text-rose-900">{Math.round((weeks / 40) * 100)}%</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Weeks Left</span>
                     <div className="text-xl font-bold text-emerald-900">{Math.max(0, 40 - weeks)}</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="p-6 bg-gradient-to-br from-rose-50 to-white rounded-[2.5rem] border border-rose-100/50 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1 shadow-sm">
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
               WHO Recommended
             </div>
             <div className="flex items-center gap-4 mt-2">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 shrink-0 animate-float">
                  <Sparkles size={24} />
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Clinical Insight</span>
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
              <div className="flex gap-2">
                <input 
                  value={foodName} 
                  onChange={e => setFoodName(e.target.value)} 
                  placeholder="Food Name (e.g., Avocado Toast)" 
                  className="text-sm bg-slate-50 border-none rounded-2xl h-12 flex-1"
                />
              </div>
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeMetric === m ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {m === 'fuel' ? <Apple size={16} /> : m === 'water' ? <Droplets size={16} /> : m === 'weight' ? <Scale size={16} /> : <Moon size={16} />}
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

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[600] px-12 py-8 bg-white text-slate-900 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] flex flex-col items-center gap-6 border-4 border-rose-50 min-w-[340px] text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-rose-200 animate-pulse">
              <Sparkles className="text-white w-10 h-10" />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Notification</div>
              <div className="text-xl font-serif font-bold text-slate-800 leading-tight">{toast}</div>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="mt-2 px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};