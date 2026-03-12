import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  SymptomLog, 
  Contraction, 
  JournalEntry, 
  CalendarEvent, 
  WeightLog, 
  SleepLog,
  Trimester,
  PregnancyProfile,
  MemoryPhoto,
  MemoryAlbums,
  FeedingLog,
  MilestoneLog,
  HealthLog,
  ReactionLog,
  KickLog,
  KegelLog,
  LifecycleStage,
  BabyGrowthLog,
  DiaperLog,
  TummyTimeLog,
  MedicationLog,
  BloodPressureLog,
  WaterLog,
  VitaminLog,
  FoodEntry
} from '../types.ts';
import { storage } from '../services/storageService.ts';
import { ReportCenter } from './ReportCenter.tsx';
import { ExportReport } from './ExportReport.tsx';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  Sparkles, 
  Footprints, 
  Smile, 
  Heart, 
  Milk, 
  Soup, 
  Droplet, 
  Droplets, 
  Trash2, 
  Trophy, 
  Hospital, 
  Bell,
  Check,
  Plus,
  Trash,
  Clock,
  Activity,
  Calendar as CalendarIcon,
  Moon,
  Thermometer,
  Pill,
  Syringe,
  Stethoscope,
  Frown,
  Meh,
  Flower,
  PartyPopper,
  Baby,
  FileText,
  Square,
  Play,
  Droplets as WaterIcon,
  Camera as CameraIcon
} from 'lucide-react';

interface ToolsHubProps {
  symptoms: SymptomLog[];
  onLogSymptom: (type: string, severity: number) => void;
  contractions: Contraction[];
  onUpdateContractions: (logs: Contraction[]) => void;
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood?: string) => void;
  onRemoveJournal: (id: string) => void;
  calendarEvents: CalendarEvent[];
  onAddEvent: (title: string, date: string, type: CalendarEvent['type'], time?: string) => void;
  onRemoveEvent: (id: string) => void;
  weightLogs: WeightLog[];
  onAddWeight: (weight: number) => void;
  sleepLogs: SleepLog[];
  onAddSleep: (sleep: Omit<SleepLog, 'id' | 'timestamp'>) => void;
  onRemoveSleep: (id: string) => void;
  feedingLogs: FeedingLog[];
  onAddFeeding: (feeding: Omit<FeedingLog, 'id' | 'timestamp'>) => void;
  diaperLogs: DiaperLog[];
  onAddDiaper: (diaper: Omit<DiaperLog, 'id' | 'timestamp'>) => void;
  milestones: MilestoneLog[];
  onAddMilestone: (milestone: Omit<MilestoneLog, 'id' | 'timestamp'>) => void;
  healthLogs: HealthLog[];
  onAddHealth: (health: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  reactions: ReactionLog[];
  onAddReaction: (reaction: Omit<ReactionLog, 'id' | 'timestamp'>) => void;
  kickLogs: KickLog[];
  onAddKick: (kick: Omit<KickLog, 'id' | 'timestamp'>) => void;
  kegelLogs: KegelLog[];
  onAddKegel: (kegel: Omit<KegelLog, 'id' | 'timestamp'>) => void;
  babyGrowthLogs: BabyGrowthLog[];
  onAddBabyGrowth: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
  tummyTimeLogs: TummyTimeLog[];
  onAddTummyTime: (log: Omit<TummyTimeLog, 'id' | 'timestamp'>) => void;
  bloodPressureLogs: BloodPressureLog[];
  onAddBloodPressure: (log: Omit<BloodPressureLog, 'id' | 'timestamp'>) => void;
  medicationLogs: MedicationLog[];
  onAddMedication: (log: Omit<MedicationLog, 'id' | 'timestamp'>) => void;
  onRemoveMedication: (id: string) => void;
  foodEntries: FoodEntry[];
  waterLogs: WaterLog[];
  vitamins: VitaminLog[];
  trimester: Trimester;
  profile: PregnancyProfile;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onUpdateProfile?: (profile: PregnancyProfile) => void;
}

export const ToolsHub: React.FC<ToolsHubProps> = ({ 
  symptoms, onLogSymptom, contractions, onUpdateContractions, 
  journalEntries, onAddJournal, onRemoveJournal, calendarEvents, onAddEvent, onRemoveEvent,
  weightLogs, onAddWeight, sleepLogs, onAddSleep, onRemoveSleep, 
  feedingLogs, onAddFeeding, diaperLogs, onAddDiaper, milestones, onAddMilestone, healthLogs, onAddHealth, 
  reactions, onAddReaction, kickLogs, onAddKick, kegelLogs, onAddKegel, babyGrowthLogs, onAddBabyGrowth,
  tummyTimeLogs, onAddTummyTime,
  bloodPressureLogs, onAddBloodPressure,
  medicationLogs, onAddMedication, onRemoveMedication,
  foodEntries,
  waterLogs, vitamins,
  trimester, profile,
  activeCategory, setActiveCategory, onUpdateProfile
}) => {
  const [tummyTimer, setTummyTimer] = useState<{ startTime: number | null, duration: number }>({ startTime: null, duration: 0 });

  useEffect(() => {
    let interval: any;
    if (tummyTimer.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setTummyTimer(prev => ({
          ...prev,
          duration: Math.floor((now - (prev.startTime || now)) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tummyTimer.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showSuccess = (msg: string) => setToast({ message: msg, type: 'success' });

  const [weightInput, setWeightInput] = useState('');
  const [babyWeightInput, setBabyWeightInput] = useState('');
  const [babyHeightInput, setBabyHeightInput] = useState('');
  const [sleepHours, setSleepHours] = useState('8');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpPulse, setBpPulse] = useState('');
  const [bpNotes, setBpNotes] = useState('');
  const [sleepQuality, setSleepQuality] = useState<SleepLog['quality']>(3);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('night');
  const [showSleepTooltip, setShowSleepTooltip] = useState(false);
  
  const [feedingType, setFeedingType] = useState<'breast' | 'bottle' | 'solid'>('breast');
  const [feedingSubType, setFeedingSubType] = useState<'milk' | 'formula'>('milk');
  const [feedingSide, setFeedingSide] = useState<'left' | 'right' | 'both'>('both');
  const [feedingAmount, setFeedingAmount] = useState('120');
  const [feedingDuration, setFeedingDuration] = useState('15');

  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'mixed'>('wet');

  const [isBirthOnboarding, setIsBirthOnboarding] = useState(false);
  const [birthData, setBirthData] = useState<{
    babies: Array<{
      name: string;
      dob: string;
      gender: 'boy' | 'girl' | 'neutral';
      weight: string;
      height: string;
    }>;
  }>({
    babies: [{
      name: '',
      dob: new Date().toISOString().split('T')[0],
      gender: 'neutral',
      weight: '',
      height: ''
    }]
  });

  useEffect(() => {
    if (isBirthOnboarding) {
      const count = profile.pregnancyType === 'twins' ? 2 : profile.pregnancyType === 'triplets' ? 3 : 1;
      setBirthData({
        babies: Array(count).fill(null).map(() => ({
          name: '',
          dob: new Date().toISOString().split('T')[0],
          gender: 'neutral',
          weight: '',
          height: ''
        }))
      });
    }
  }, [isBirthOnboarding, profile.pregnancyType]);

  const [activeToolCat, setActiveToolCat] = useState('hospital_bag');
  const [selectedBabyId, setSelectedBabyId] = useState<string>(profile.babies?.[0]?.id || '');

  useEffect(() => {
    if (!selectedBabyId && profile.babies?.length) {
      setSelectedBabyId(profile.babies[0].id);
    }
  }, [profile.babies, selectedBabyId]);

  // Checklists
  const [checklists, setChecklists] = useState<{ [key: string]: any[] }>({
    hospital_bag: storage.getChecklist('hospital_bag'),
    birth_plan: storage.getChecklist('birth_plan'),
    nursery: storage.getChecklist('nursery'),
    general: storage.getChecklist('general')
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Archive
  const [archive, setArchive] = useState(storage.getArchive());

  // Calendar
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState<CalendarEvent['type']>('appointment');
  
  // Kegels
  const [isKegelActive, setIsKegelActive] = useState(false);
  const [kegelTimer, setKegelTimer] = useState(0);
  const kegelInterval = useRef<number | null>(null);

  // Journal
  const [journalInput, setJournalInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('sparkles');

  // Labor / Contractions
  const [isContractionActive, setIsContractionActive] = useState(false);
  const [currentContractionStart, setCurrentContractionStart] = useState<number | null>(null);

  // Albums
  const [albums, setAlbums] = useState<MemoryAlbums>(profile.albums || { ultrasound: [], family: [], favorites: [] });

  // Baby Names
  const [babyNames, setBabyNames] = useState<{name: string, gender: string, rating: number}[]>(storage.getBabyNames() || []);
  const [newNameInput, setNewNameInput] = useState('');
  const [newNameGender, setNewNameGender] = useState('neutral');

  // Water Intake
  const [waterIntake, setWaterIntake] = useState<number>(storage.getWaterIntake() || 0); // in glasses (e.g. 8 glasses a day)

  // Bump Photos
  const [bumpPhotos, setBumpPhotos] = useState<{id: string, url: string, date: string, week: number}[]>(storage.getBumpPhotos() || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Medications
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('');

  const handleWeightLog = () => {
    if (weightInput) {
      onAddWeight(parseFloat(weightInput));
      setWeightInput('');
    }
  };

  const handleSleepLog = () => {
    const hrs = parseFloat(sleepHours);
    if (!isNaN(hrs)) {
      onAddSleep({ 
        hours: hrs, 
        quality: sleepQuality, 
        type: sleepType,
        babyId: selectedBabyId || profile.babies?.[0]?.id || '',
        startTime: Date.now() - (hrs * 60 * 60 * 1000),
        endTime: Date.now()
      });
    }
  };

  const startKegel = () => {
    setIsKegelActive(true);
    setKegelTimer(0);
    kegelInterval.current = window.setInterval(() => setKegelTimer(v => v + 1), 1000);
  };
  const stopKegel = () => {
    setIsKegelActive(false);
    if (kegelInterval.current) {
      clearInterval(kegelInterval.current);
      if (kegelTimer > 0) {
        onAddKegel({ duration: kegelTimer });
      }
    }
  };

  const handleAddPhoto = (type: keyof MemoryAlbums) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto: MemoryPhoto = { id: Date.now().toString(), url: reader.result as string, timestamp: Date.now() };
          const updated = { ...albums, [type]: [newPhoto, ...albums[type]] };
          setAlbums(updated);
          storage.saveAlbums(updated);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const weightChartData = useMemo(() => {
    return weightLogs.slice().reverse().map(l => ({
      val: l.weight,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [weightLogs]);

  const babyGrowthChartData = useMemo(() => {
    const filtered = babyGrowthLogs
      .filter(l => l.babyId === selectedBabyId)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return filtered.map(l => ({
      weight: l.weight,
      height: l.height,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [babyGrowthLogs, selectedBabyId]);

  // Labor Logic
  const handleContractionToggle = () => {
    const now = Date.now();
    if (!isContractionActive) {
      setIsContractionActive(true);
      setCurrentContractionStart(now);
    } else {
      if (currentContractionStart) {
        const duration = now - currentContractionStart;
        const last = contractions[0];
        const interval = last ? currentContractionStart - last.startTime : undefined;
        
        const newLog: Contraction = {
          id: now.toString(),
          startTime: currentContractionStart,
          endTime: now,
          duration,
          interval
        };
        onUpdateContractions([newLog, ...contractions]);
      }
      setIsContractionActive(false);
      setCurrentContractionStart(null);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // Trimester Progress Data
  const progressWeeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }, [profile]);
  const progressMonths = Math.floor(progressWeeks / 4.3);

  const isPostpartum = profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;

  const [selectedHealthType, setSelectedHealthType] = useState<string | null>(null);
  const [healthNotes, setHealthNotes] = useState('');

  const categories = useMemo(() => {
    if (isPostpartum) {
      return ['feeding', 'sleep', 'diaper', 'milestones', 'health', 'medications', 'vitals', 'tummy_time', 'bath', 'pumping', 'teething', 'journal', 'export', 'calendar', 'checklists', 'memories'];
    }
    return ['vitals', 'medications', 'names', 'bump', 'sleep', 'calendar', 'checklists', 'memories', 'kegels', 'journal', 'labor', 'kicks', 'reactions', 'calm', 'birth', 'reports'];
  }, [isPostpartum]);

  useEffect(() => {
    if (isPostpartum && !['feeding', 'sleep', 'diaper', 'milestones', 'health', 'medications', 'vitals', 'tummy_time', 'bath', 'pumping', 'teething', 'journal', 'export', 'calendar', 'checklists', 'memories'].includes(activeCategory)) {
      setActiveCategory('feeding');
    } else if (!isPostpartum && !['vitals', 'medications', 'names', 'bump', 'sleep', 'calendar', 'checklists', 'memories', 'kegels', 'journal', 'labor', 'kicks', 'reactions', 'calm', 'birth', 'reports'].includes(activeCategory)) {
      setActiveCategory('vitals');
    }
  }, [isPostpartum, activeCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24"
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 sticky top-0 z-50 bg-[#fffaf9]/90 backdrop-blur-md">
        {categories.map(cat => (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={cat} 
            onClick={() => setActiveCategory(cat)} 
            className={`flex-none px-6 py-3 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest ${activeCategory === cat ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-200' : 'bg-white text-gray-400 hover:bg-rose-50'}`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {activeCategory === 'medications' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <Pill size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-rose-800">Medication Log</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Track your pregnancy safe meds</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Medication Name</label>
                <input 
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  placeholder="e.g. Prenatal Vitamin, Tylenol"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Dosage</label>
                <input 
                  value={medDosage}
                  onChange={e => setMedDosage(e.target.value)}
                  placeholder="e.g. 500mg"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Reminder Time</label>
                <input 
                  type="time"
                  value={medTime}
                  onChange={e => setMedTime(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  if (medName.trim() && medDosage.trim()) {
                    onAddMedication({ name: medName.trim(), dosage: medDosage.trim(), time: medTime });
                    setMedName('');
                    setMedDosage('');
                    setMedTime('');
                    showSuccess('Medication logged successfully');
                  }
                }}
                className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 hover:bg-rose-800 active:scale-[0.98] transition-all"
              >
                Log Medication
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Logs</h4>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full">{medicationLogs.length} Total</span>
            </div>

            <AnimatePresence mode="popLayout">
              {medicationLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center space-y-3"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Pill className="w-6 h-6 text-slate-200" />
                  </div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No medications logged yet</p>
                </motion.div>
              ) : (
                medicationLogs.map((log) => (
                  <motion.div 
                    key={log.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="card-premium p-5 bg-white border-2 border-white flex justify-between items-center group hover:border-rose-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                        <Activity size={18} />
                      </div>
                      <div>
                        <div className="font-serif text-lg text-slate-800 leading-none mb-1">{log.name}</div>
                        <div className="text-[10px] font-bold text-slate-400">{log.dosage} {log.time && `• ${log.time}`}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <button 
                        onClick={() => onRemoveMedication(log.id)}
                        className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeCategory === 'water' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Hydration Tracker</h3>
            <p className="text-xs text-slate-400 font-medium">Aim for at least 8-10 glasses of water a day during pregnancy.</p>
            
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-48 h-48 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border-8 border-blue-100 shadow-inner">
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-400 opacity-80"
                  animate={{ height: `${Math.min((waterIntake / 10) * 100, 100)}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.span 
                    key={waterIntake}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-blue-900"
                  >
                    {waterIntake}
                  </motion.span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Glasses</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const newIntake = Math.max(0, waterIntake - 1);
                    setWaterIntake(newIntake);
                    storage.saveWaterIntake(newIntake);
                  }}
                  className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl hover:bg-slate-200 transition-all"
                >
                  -
                </button>
                <button 
                  onClick={() => {
                    const newIntake = waterIntake + 1;
                    setWaterIntake(newIntake);
                    storage.saveWaterIntake(newIntake);
                  }}
                  className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'names' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="relative z-10">
              <h3 className="text-2xl font-serif text-rose-800 tracking-tight">Baby Names</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Curate your favorite names for your little one.</p>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newNameInput} 
                  onChange={e => setNewNameInput(e.target.value)} 
                  placeholder="Enter a name..." 
                  className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-rose-200" 
                />
                <select 
                  value={newNameGender} 
                  onChange={e => setNewNameGender(e.target.value)}
                  className="w-32 px-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border-none focus:ring-2 focus:ring-rose-200"
                >
                  <option value="neutral">Neutral</option>
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  if (newNameInput.trim()) {
                    const newNames = [...babyNames, { name: newNameInput.trim(), gender: newNameGender, rating: 0 }];
                    setBabyNames(newNames);
                    storage.saveBabyNames(newNames);
                    setNewNameInput('');
                    showSuccess('Name added to your collection');
                  }
                }}
                className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 hover:bg-rose-800 active:scale-[0.98] transition-all"
              >
                Add to Collection
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Favorites</h4>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full">{babyNames.length} Names</span>
            </div>
            
            <AnimatePresence mode="popLayout">
              {babyNames.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center space-y-3"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-slate-200" />
                  </div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No names added yet</p>
                </motion.div>
              ) : (
                babyNames.map((item, idx) => (
                  <motion.div 
                    key={`${item.name}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card-premium p-5 bg-white border-2 border-white flex justify-between items-center shadow-sm group hover:border-rose-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        item.gender === 'boy' ? 'bg-blue-50 text-blue-500' : 
                        item.gender === 'girl' ? 'bg-pink-50 text-pink-500' : 
                        'bg-emerald-50 text-emerald-500'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-serif text-lg text-slate-800 leading-none mb-1">{item.name}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          item.gender === 'boy' ? 'text-blue-400' : 
                          item.gender === 'girl' ? 'text-pink-400' : 
                          'text-emerald-400'
                        }`}>{item.gender}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star}
                            onClick={() => {
                              const newNames = [...babyNames];
                              newNames[idx].rating = star;
                              setBabyNames(newNames);
                              storage.saveBabyNames(newNames);
                            }}
                            className={`p-1 transition-transform hover:scale-125 ${star <= (item.rating || 0) ? 'text-amber-400' : 'text-slate-100'}`}
                          >
                            <Heart className={`w-4 h-4 ${star <= (item.rating || 0) ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          const newNames = babyNames.filter((_, i) => i !== idx);
                          setBabyNames(newNames);
                          storage.saveBabyNames(newNames);
                          showSuccess('Name removed');
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeCategory === 'bump' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Bump Photo Diary</h3>
            <p className="text-xs text-slate-400 font-medium">Document your growing bump week by week.</p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 border-4 border-dashed border-rose-100 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-rose-400 hover:bg-rose-50 hover:border-rose-300 transition-all"
              >
                <CameraIcon size={48} />
                <span className="text-[10px] font-black uppercase tracking-widest">Add New Photo</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      const newPhotos = [
                        { id: Date.now().toString(), url: base64String, date: new Date().toISOString(), week: progressWeeks },
                        ...bumpPhotos
                      ];
                      setBumpPhotos(newPhotos);
                      storage.saveBumpPhotos(newPhotos);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {bumpPhotos.map((photo) => (
                <motion.div 
                  key={photo.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="card-premium bg-white border-2 border-white overflow-hidden group relative"
                >
                  <img src={photo.url} alt={`Week ${photo.week}`} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    <span className="text-white font-black text-lg">Week {photo.week}</span>
                    <span className="text-white/80 text-[10px] uppercase tracking-widest">{new Date(photo.date).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const newPhotos = bumpPhotos.filter(p => p.id !== photo.id);
                      setBumpPhotos(newPhotos);
                      storage.saveBumpPhotos(newPhotos);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {bumpPhotos.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 text-center py-8 text-slate-400 text-sm font-medium"
              >
                No photos added yet. Start your diary!
              </motion.div>
            )}
          </div>
        </div>
      )}

      {activeCategory === 'kicks' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Kick Counter</h3>
            <div className="flex justify-center gap-4">
              {profile.babies?.map((baby, idx) => (
                <button
                  key={baby.id}
                  onClick={() => setSelectedBabyId(baby.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedBabyId === baby.id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'}`}
                >
                  {baby.name || `Baby ${idx + 1}`}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => onAddKick({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', count: 1 })}
                className="w-40 h-40 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-inner border-4 border-white active:scale-90 transition-all"
              >
                <Footprints size={64} />
              </button>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Tap for each kick</span>
            </div>
          </div>
          <div className="space-y-4">
            {kickLogs.filter(k => k.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).slice(0, 5).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-sm font-black text-rose-500">{log.count} Kick</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'reactions' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Baby Reactions</h3>
            <div className="space-y-4">
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none"
                onChange={(e) => setSelectedBabyId(e.target.value)}
                value={selectedBabyId}
              >
                {profile.babies?.map((baby, idx) => (
                  <option key={baby.id} value={baby.id}>{baby.name || `Baby ${idx + 1}`}</option>
                ))}
              </select>
              
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Stimulus (e.g., Music, Food, Voice)</label>
                <input 
                  type="text"
                  id="reaction-stimulus"
                  placeholder="What caused the reaction?"
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Reaction</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      const stim = (document.getElementById('reaction-stimulus') as HTMLInputElement).value || 'Unknown';
                      onAddReaction({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', stimulus: stim, reaction: 'Positive', mood: 'Happy' });
                      (document.getElementById('reaction-stimulus') as HTMLInputElement).value = '';
                    }}
                    className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex flex-col items-center gap-2"
                  >
                    <Smile size={20} /> Positive
                  </button>
                  <button 
                    onClick={() => {
                      const stim = (document.getElementById('reaction-stimulus') as HTMLInputElement).value || 'Unknown';
                      onAddReaction({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', stimulus: stim, reaction: 'Neutral', mood: 'Neutral' });
                      (document.getElementById('reaction-stimulus') as HTMLInputElement).value = '';
                    }}
                    className="p-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex flex-col items-center gap-2"
                  >
                    <Meh size={20} /> Neutral
                  </button>
                  <button 
                    onClick={() => {
                      const stim = (document.getElementById('reaction-stimulus') as HTMLInputElement).value || 'Unknown';
                      onAddReaction({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', stimulus: stim, reaction: 'Negative', mood: 'Sad' });
                      (document.getElementById('reaction-stimulus') as HTMLInputElement).value = '';
                    }}
                    className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex flex-col items-center gap-2"
                  >
                    <Frown size={20} /> Negative
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {reactions.filter(r => r.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.stimulus}</div>
                  <div className="text-sm font-bold text-slate-700">{log.reaction}</div>
                </div>
                <div className={log.reaction === 'Positive' ? 'text-emerald-400' : log.reaction === 'Negative' ? 'text-rose-400' : 'text-slate-400'}>
                  {log.reaction === 'Positive' ? <Smile size={24} /> : log.reaction === 'Negative' ? <Frown size={24} /> : <Meh size={24} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'feeding' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Feeding Log</h3>
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {profile.babies?.map((baby, idx) => (
                  <button
                    key={baby.id}
                    onClick={() => setSelectedBabyId(baby.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedBabyId === baby.id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'}`}
                  >
                    {baby.name || `Baby ${idx + 1}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['breast', 'bottle', 'solid'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setFeedingType(type)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${feedingType === type ? 'bg-rose-50 border-rose-500 text-rose-500 shadow-md' : 'bg-white border-slate-50 opacity-60'}`}
                  >
                    <span className="text-rose-400">
                      {type === 'breast' ? <Heart size={24} /> : type === 'bottle' ? <Milk size={24} /> : <Soup size={24} />}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {feedingType === 'breast' && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['left', 'right', 'both'] as const).map(side => (
                      <button 
                        key={side}
                        onClick={() => setFeedingSide(side)}
                        className={`p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all ${feedingSide === side ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'}`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                )}
                {feedingType === 'bottle' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['milk', 'formula'] as const).map(sub => (
                      <button 
                        key={sub}
                        onClick={() => setFeedingSubType(sub)}
                        className={`p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all ${feedingSubType === sub ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-50'}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Amount (ml)</label>
                    <input type="number" value={feedingAmount} onChange={e => setFeedingAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Duration (min)</label>
                    <input type="number" value={feedingDuration} onChange={e => setFeedingDuration(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onAddFeeding({ 
                  babyId: selectedBabyId || profile.babies?.[0]?.id || '', 
                  type: feedingType, 
                  subType: feedingType === 'bottle' ? feedingSubType : undefined,
                  side: feedingType === 'breast' ? feedingSide : undefined,
                  amount: parseFloat(feedingAmount),
                  duration: parseFloat(feedingDuration)
                })}
                className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Log Feeding Session
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {feedingLogs.filter(f => f.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-rose-400">
                    {log.type === 'breast' ? <Heart size={20} /> : log.type === 'bottle' ? <Milk size={20} /> : <Soup size={20} />}
                  </span>
                  <div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.type} {log.side ? `(${log.side})` : ''}</div>
                    <div className="text-sm font-bold text-slate-700">{log.amount} ml • {log.duration} min</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'diaper' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Diaper Tracker</h3>
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {profile.babies?.map((baby, idx) => (
                  <button
                    key={baby.id}
                    onClick={() => setSelectedBabyId(baby.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedBabyId === baby.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-50'}`}
                  >
                    {baby.name || `Baby ${idx + 1}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['wet', 'dirty', 'mixed'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setDiaperType(type)}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${diaperType === type ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md' : 'bg-white border-slate-50 opacity-60'}`}
                  >
                    <span className="text-emerald-500">
                      {type === 'wet' ? <Droplet size={32} /> : type === 'dirty' ? <Trash2 size={32} /> : <Droplets size={32} />}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest">{type}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => onAddDiaper({ 
                  babyId: selectedBabyId || profile.babies?.[0]?.id || '', 
                  type: diaperType,
                  notes: ''
                })}
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Log Diaper Change
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {diaperLogs.filter(d => d.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500">
                    {log.type === 'wet' ? <Droplet size={20} /> : log.type === 'dirty' ? <Trash2 size={20} /> : <Droplets size={20} />}
                  </span>
                  <div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Diaper Change</div>
                    <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'milestones' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Milestones</h3>
            <div className="flex gap-3">
              <input 
                placeholder="New Milestone..." 
                className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddMilestone({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', title: (e.target as HTMLInputElement).value, date: new Date().toISOString() });
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-4">
            {milestones.filter(m => m.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                  <Trophy size={24} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</div>
                  <div className="text-sm font-bold text-slate-900">{log.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'health' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Health Logs</h3>
            
            {!selectedHealthType ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'temperature', icon: Thermometer },
                  { type: 'medication', icon: Pill },
                  { type: 'vaccination', icon: Syringe },
                  { type: 'symptom', icon: Stethoscope }
                ].map(item => (
                  <button 
                    key={item.type}
                    onClick={() => setSelectedHealthType(item.type)}
                    className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-500 transition-all flex flex-col items-center gap-2"
                  >
                    <item.icon size={20} />
                    {item.type}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setSelectedHealthType(null)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                    <Plus className="rotate-45" size={16} />
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Logging {selectedHealthType}</span>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Please select status explicitly</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        onAddHealth({ 
                          babyId: selectedBabyId || profile.babies?.[0]?.id || '', 
                          type: selectedHealthType, 
                          value: 'Normal', 
                          notes: healthNotes,
                          status: 'normal'
                        });
                        setSelectedHealthType(null);
                        setHealthNotes('');
                        showSuccess('Health log saved!');
                      }}
                      className="group flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-emerald-500 shadow-lg shadow-emerald-200">
                        <Check size={24} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-widest">Normal</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddHealth({ 
                          babyId: selectedBabyId || profile.babies?.[0]?.id || '', 
                          type: selectedHealthType, 
                          value: 'Abnormal', 
                          notes: healthNotes,
                          status: 'abnormal'
                        });
                        setSelectedHealthType(null);
                        setHealthNotes('');
                        showSuccess('Health log saved!');
                      }}
                      className="group flex flex-col items-center gap-3 p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-rose-500 shadow-lg shadow-rose-200">
                        <Activity size={24} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-widest">Abnormal</span>
                    </button>
                  </div>
                </div>

                <textarea 
                  placeholder="Add notes (optional)..."
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 text-sm min-h-[100px]"
                />
              </div>
            )}
          </div>
          <div className="space-y-4">
            {healthLogs.filter(h => h.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.type}</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'normal' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <div className="text-sm font-bold text-slate-700 capitalize">{log.status || log.value}</div>
                  </div>
                  {log.notes && <p className="text-[10px] text-slate-400 mt-1">{log.notes}</p>}
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'reports' && (
        <ExportReport 
          profile={profile}
          feedingLogs={feedingLogs}
          sleepLogs={sleepLogs}
          diaperLogs={diaperLogs}
          babyGrowthLogs={babyGrowthLogs}
          milestones={milestones}
          healthLogs={healthLogs}
          tummyTimeLogs={tummyTimeLogs}
          journalEntries={journalEntries}
          kickLogs={kickLogs}
          reactions={reactions}
          calendarEvents={calendarEvents}
          bloodPressureLogs={bloodPressureLogs}
          medicationLogs={medicationLogs}
          weightLogs={weightLogs}
          waterLogs={waterLogs}
          vitamins={vitamins}
          symptoms={symptoms}
          contractions={contractions}
          kegelLogs={kegelLogs}
          foodEntries={foodEntries}
        />
      )}

      {activeCategory === 'calendar' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Appointment Calendar</h3>
            <div className="space-y-4">
              <input 
                value={eventTitle} 
                onChange={e => setEventTitle(e.target.value)} 
                placeholder="Event Title (e.g. Ultrasound)" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" 
              />
              <div className="flex gap-3">
                <input 
                  type="date" 
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)} 
                  className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" 
                />
                <input 
                  type="time" 
                  value={eventTime} 
                  onChange={e => setEventTime(e.target.value)} 
                  className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" 
                />
                <select 
                  value={eventType} 
                  onChange={e => setEventType(e.target.value as any)}
                  className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none"
                >
                  <option value="appointment">Appointment</option>
                  <option value="reminder">Reminder</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  if (eventTitle && eventDate) {
                    onAddEvent(eventTitle, eventDate, eventType, eventTime);
                    setEventTitle('');
                    setEventDate('');
                    setEventTime('');
                  }
                }}
                className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
              >
                Add to Calendar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
              <div key={event.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${event.type === 'appointment' ? 'bg-blue-50 text-blue-500' : event.type === 'milestone' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                    {event.type === 'appointment' ? <Hospital size={20} /> : event.type === 'milestone' ? <Trophy size={20} /> : <Bell size={20} />}
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                      {new Date(event.date).toLocaleDateString()} {event.time && `• ${event.time}`}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{event.title}</div>
                  </div>
                </div>
                <button onClick={() => onRemoveEvent(event.id)} className="text-[10px] text-rose-300 hover:text-rose-500 font-bold">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'checklists' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {(['hospital_bag', 'birth_plan', 'nursery', 'general'] as const).map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveToolCat(cat)}
                className={`flex-none px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeToolCat === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800 capitalize">{activeToolCat.replace('_', ' ')}</h3>
            <div className="flex gap-3">
              <input 
                value={newChecklistItem} 
                onChange={e => setNewChecklistItem(e.target.value)} 
                placeholder="Add item..." 
                className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" 
              />
              <button 
                onClick={() => {
                  if (newChecklistItem) {
                    const item: any = { id: Date.now().toString(), text: newChecklistItem, completed: false, category: activeToolCat };
                    storage.saveChecklistItem(item);
                    setChecklists({ ...checklists, [activeToolCat]: storage.getChecklist(activeToolCat as any) });
                    setNewChecklistItem('');
                  }
                }}
                className="px-6 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Add
              </button>
            </div>

            <div className="space-y-3">
              {checklists[activeToolCat]?.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const updated = { ...item, completed: !item.completed };
                        storage.saveChecklistItem(updated);
                        setChecklists({ ...checklists, [activeToolCat]: storage.getChecklist(activeToolCat as any) });
                      }}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}
                    >
                      {item.completed && '✓'}
                    </button>
                    <span className={`text-sm font-medium ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{item.text}</span>
                  </div>
                  <button onClick={() => { storage.removeChecklistItem(item.id); setChecklists({ ...checklists, [activeToolCat]: storage.getChecklist(activeToolCat as any) }); }} className="text-rose-300 hover:text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'vitals' && (
        <div className="space-y-6 animate-in fade-in">
          {profile.lifecycleStage === LifecycleStage.NEWBORN && (
            <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
              <h3 className="text-xl font-serif text-rose-800">Baby Growth Tracker</h3>
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {profile.babies?.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBabyId(b.id)}
                      className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedBabyId === b.id ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {b.name || 'Baby'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.1" value={babyWeightInput} onChange={e => setBabyWeightInput(e.target.value)} placeholder="Weight (kg)" className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                  <input type="number" step="0.1" value={babyHeightInput} onChange={e => setBabyHeightInput(e.target.value)} placeholder="Height (cm)" className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                </div>
                <button 
                  onClick={() => {
                    if (babyWeightInput && babyHeightInput && selectedBabyId) {
                      onAddBabyGrowth({ babyId: selectedBabyId, weight: parseFloat(babyWeightInput), height: parseFloat(babyHeightInput) });
                      setBabyWeightInput('');
                      setBabyHeightInput('');
                    }
                  }} 
                  className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg"
                >
                  Log Baby Growth
                </button>

                {babyGrowthChartData.length > 0 && (
                  <div className="pt-6 border-t border-slate-50 space-y-8">
                    <div className="h-48">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Weight Trend (kg)</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={babyGrowthChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                          <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                          <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-48">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Height Trend (cm)</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={babyGrowthChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                          <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                          <Line type="monotone" dataKey="height" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
            <h3 className="text-xl font-serif text-rose-800">{profile.lifecycleStage === LifecycleStage.NEWBORN ? 'Parent Weight Tracker' : 'Weight Tracker'}</h3>
            <div className="flex gap-3">
              <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="Current weight (kg)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              <button onClick={handleWeightLog} className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Log</button>
            </div>
            
            <div className="pt-6 border-t border-slate-50 h-64">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Weight Trend Analysis</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={4} dot={{r: 4, fill: '#8b5cf6'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
            <h3 className="text-xl font-serif text-rose-800">Blood Pressure Tracker</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input type="number" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} placeholder="Systolic (e.g. 120)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                <span className="text-2xl text-slate-300 font-light flex items-center">/</span>
                <input type="number" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} placeholder="Diastolic (e.g. 80)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="flex gap-3">
                <input type="number" value={bpPulse} onChange={e => setBpPulse(e.target.value)} placeholder="Pulse (bpm) - Optional" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
                <button 
                  onClick={() => {
                    if (bpSystolic && bpDiastolic) {
                      onAddBloodPressure({
                        systolic: parseInt(bpSystolic),
                        diastolic: parseInt(bpDiastolic),
                        pulse: bpPulse ? parseInt(bpPulse) : undefined,
                        notes: bpNotes
                      });
                      setBpSystolic('');
                      setBpDiastolic('');
                      setBpPulse('');
                      setBpNotes('');
                      showSuccess('Blood pressure logged');
                    }
                  }} 
                  className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
                >
                  Log
                </button>
              </div>
            </div>
            
            {bloodPressureLogs.length > 0 && (
              <div className="pt-6 border-t border-slate-50 space-y-4">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Recent Readings</span>
                <div className="space-y-3">
                  {bloodPressureLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <div className="text-lg font-bold text-slate-800">{log.systolic}/{log.diastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span></div>
                        {log.pulse && <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Pulse: {log.pulse} bpm</div>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeCategory === 'sleep' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card-premium p-8 bg-white space-y-8 shadow-sm border-2 border-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif text-rose-800">Restful Nights</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowSleepTooltip(!showSleepTooltip)}
                    className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[10px] flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-colors"
                  >
                    i
                  </button>
                  {showSleepTooltip && (
                    <div className="absolute left-0 top-full mt-2 w-48 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="space-y-2">
                        <div className="text-[8px] font-black uppercase text-rose-500">Quality Guide</div>
                        <p className="text-[10px] text-slate-600"><span className="font-bold">Poor:</span> Frequent wakeups, restless.</p>
                        <p className="text-[10px] text-slate-600"><span className="font-bold">Average:</span> Some wakeups, mostly rested.</p>
                        <p className="text-[10px] text-slate-600"><span className="font-bold">Good:</span> Deep sleep, fully refreshed.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Track your sleep quality and duration</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-600">Hours Rested</span>
                <input 
                  type="number" 
                  value={sleepHours} 
                  onChange={e => setSleepHours(e.target.value)}
                  className="w-20 bg-white border-none text-right font-serif text-xl p-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['nap', 'night'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setSleepType(t)}
                    className={`p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all ${sleepType === t ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as const).map(q => (
                  <button 
                    key={q}
                    onClick={() => setSleepQuality(q)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${sleepQuality === q ? 'bg-indigo-50 border-indigo-500 text-indigo-500 shadow-md' : 'bg-white border-slate-50 opacity-60'}`}
                  >
                    <span className="text-indigo-400">
                      {q === 1 ? <Frown size={20} /> : q === 3 ? <Meh size={20} /> : q === 5 ? <Moon size={20} /> : <Sparkles size={20} />}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest">{q}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSleepLog}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all"
              >
                Log Sleep Session
              </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recent Logs</h4>
              {sleepLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400">
                      {log.quality <= 2 ? <Frown size={18} /> : log.quality === 3 ? <Meh size={18} /> : <Moon size={18} />}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{log.hours} Hours • {log.type}</span>
                  </div>
                  <button 
                    onClick={() => onRemoveSleep(log.id)}
                    className="text-[8px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'kegels' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="card-premium p-12 bg-white space-y-8 text-center border-2 border-white">
              <div className="space-y-2">
                 <h3 className="text-xl font-serif text-rose-800">Kegel Trainer</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Press and hold to contract.<br/>Release to rest.</p>
              </div>

              <button 
                onMouseDown={startKegel} 
                onMouseUp={stopKegel} 
                onTouchStart={startKegel} 
                onTouchEnd={stopKegel} 
                className={`w-52 h-52 mx-auto rounded-full transition-all duration-300 flex flex-col items-center justify-center gap-2 border-[12px] shadow-2xl active:scale-95 ${isKegelActive ? 'bg-rose-500 border-rose-200 scale-105 shadow-rose-200' : 'bg-white border-slate-50 text-rose-500 shadow-slate-100'}`}
              >
                 {isKegelActive ? (
                   <>
                    <span className="text-4xl tabular-nums font-mono font-black">{kegelTimer}s</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Contracting...</span>
                   </>
                 ) : (
                   <>
                    <Flower size={48} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Press & Hold</span>
                   </>
                 )}
              </button>
           </div>
        </div>
      )}

      {activeCategory === 'memories' && (
        <div className="space-y-10 animate-in fade-in">
           {(['ultrasound', 'family', 'favorites'] as const).map(type => (
             <div key={type} className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-sm font-serif text-slate-900 capitalize">{type} Album</h3>
                   <button onClick={() => handleAddPhoto(type)} className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">+</button>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
                   {albums[type].length > 0 ? albums[type].map(p => (
                     <div key={p.id} className="flex-none w-48 h-60 bg-white p-2.5 rounded-3xl border-2 border-white shadow-xl rotate-[2deg] group">
                        <img src={p.url} className="w-full h-full object-cover rounded-2xl" />
                     </div>
                   )) : (
                     <div className="flex-none w-full py-12 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                        <p className="text-xs text-slate-300 italic">No memories here yet...</p>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      )}

      {activeCategory === 'calm' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-10 bg-white border-2 border-white text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-100" />
            
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-emerald-800">Peaceful Nest</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Breathe in peace, breathe out stress.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { title: "The Safe Breath", chant: "I am safe. My baby is safe. We are held in love.", icon: Heart, color: "text-rose-400" },
                { title: "Strength Chant", chant: "My body is strong. My mind is calm. I trust the journey.", icon: Sparkles, color: "text-amber-400" },
                { title: "Connection", chant: "I am connected to my baby. We are growing together in peace.", icon: Baby, color: "text-blue-400" },
                { title: "Release", chant: "I release all tension. I embrace this moment with grace.", icon: Flower, color: "text-emerald-400" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 bg-slate-50 rounded-[2rem] border border-white shadow-sm space-y-3 cursor-pointer group"
                  onClick={() => {
                    onAddJournal(`[Calm] Chanted: ${item.chant}`, 'peace');
                    showSuccess('Peaceful moment recorded');
                  }}
                >
                  <div className={`flex justify-center ${item.color}`}>
                    <item.icon size={32} className="group-hover:animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">{item.title}</h4>
                  <p className="text-lg font-serif italic text-slate-600 leading-relaxed">"{item.chant}"</p>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest pt-2">Tap to record this moment of peace</div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-5">
              <div className="text-emerald-500">
                <Activity size={32} />
              </div>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed text-left">
                When you feel stressed, try the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'birth' && (
        <div className="space-y-8 animate-in fade-in">
          {isBirthOnboarding ? (
            <div className="card-premium p-8 bg-white border-2 border-rose-100 space-y-6 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="text-center space-y-2">
                <div className="flex justify-center text-rose-500">
                  <PartyPopper size={40} />
                </div>
                <h3 className="text-xl font-serif text-rose-800">Welcome, Little One{birthData.babies.length > 1 ? 's' : ''}!</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Let's set up your baby profile{birthData.babies.length > 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-8">
                {birthData.babies.map((baby, idx) => (
                  <div key={idx} className="space-y-4 p-6 bg-rose-50/30 rounded-3xl border border-rose-100/50">
                    <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Baby {birthData.babies.length > 1 ? idx + 1 : ''}</h4>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Baby's Name</label>
                      <input value={baby.name} onChange={e => {
                        const newBabies = [...birthData.babies];
                        newBabies[idx].name = e.target.value;
                        setBirthData({...birthData, babies: newBabies});
                      }} placeholder="Enter name..." className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Date of Birth</label>
                        <input type="date" value={baby.dob} onChange={e => {
                          const newBabies = [...birthData.babies];
                          newBabies[idx].dob = e.target.value;
                          setBirthData({...birthData, babies: newBabies});
                        }} className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Gender</label>
                        <select value={baby.gender} onChange={e => {
                          const newBabies = [...birthData.babies];
                          newBabies[idx].gender = e.target.value as any;
                          setBirthData({...birthData, babies: newBabies});
                        }} className="w-full p-4 bg-white rounded-2xl text-sm font-bold outline-none border border-slate-100">
                          <option value="neutral">Neutral</option>
                          <option value="boy">Boy</option>
                          <option value="girl">Girl</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Weight (kg)</label>
                        <input type="number" step="0.1" value={baby.weight} onChange={e => {
                          const newBabies = [...birthData.babies];
                          newBabies[idx].weight = e.target.value;
                          setBirthData({...birthData, babies: newBabies});
                        }} placeholder="3.5" className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Height (cm)</label>
                        <input type="number" step="0.1" value={baby.height} onChange={e => {
                          const newBabies = [...birthData.babies];
                          newBabies[idx].height = e.target.value;
                          setBirthData({...birthData, babies: newBabies});
                        }} placeholder="50" className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                  <button onClick={() => setIsBirthOnboarding(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={() => {
                      const updatedProfile: PregnancyProfile = {
                        ...profile,
                        lifecycleStage: LifecycleStage.NEWBORN,
                        babies: birthData.babies.map((b, i) => ({
                          id: (Date.now() + i).toString(),
                          name: b.name,
                          birthDate: b.dob,
                          gender: b.gender,
                          birthWeight: parseFloat(b.weight),
                          skinTone: '👶'
                        }))
                      };
                      
                      const archiveEntry: any = {
                        id: Date.now().toString(),
                        startDate: profile.lmpDate,
                        endDate: new Date().toISOString(),
                        type: profile.pregnancyType,
                        outcome: 'birth',
                        babies: birthData.babies.map(b => b.name)
                      };
                      
                      storage.addToArchive(archiveEntry);
                      onUpdateProfile?.(updatedProfile);
                      setIsBirthOnboarding(false);
                    }}
                    className="flex-2 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100"
                  >
                    Complete Birth Setup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
              <h3 className="text-xl font-serif text-rose-800">Welcome to Motherhood</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Transition to newborn mode to track your baby's growth.</p>
              
              <button 
                onClick={() => setIsBirthOnboarding(true)}
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                <Baby size={18} /> Mark as Born & Switch to Newborn Mode
              </button>
            </div>
          )}
        </div>
      )}

      {activeCategory === 'journal' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
              <h3 className="text-xl font-serif text-rose-800">Parent's Reflections</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                 {[
                   { id: 'sparkles', icon: Sparkles },
                   { id: 'flower', icon: Flower },
                   { id: 'moon', icon: Moon },
                   { id: 'heart', icon: Heart },
                   { id: 'smile', icon: Smile },
                   { id: 'activity', icon: Activity }
                 ].map(m => (
                   <button 
                    key={m.id} 
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedMood === m.id ? 'bg-rose-500 text-white shadow-md scale-110' : 'bg-slate-50 text-slate-400'}`}
                   >
                    <m.icon size={20} />
                   </button>
                 ))}
              </div>
              <textarea 
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="How are you feeling today?"
                className="w-full h-32 bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-medium resize-none focus:bg-white transition-all shadow-inner"
              />
              <button 
                onClick={() => { if(journalInput) { onAddJournal(journalInput, selectedMood); setJournalInput(''); } }}
                className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
              >
                Save Reflection
              </button>
           </div>
 
           <div className="space-y-4">
              {journalEntries.map(entry => (
                <div key={entry.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex gap-4 items-start">
                   <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                     {entry.mood === 'sparkles' ? <Sparkles size={20} /> : 
                      entry.mood === 'flower' ? <Flower size={20} /> :
                      entry.mood === 'moon' ? <Moon size={20} /> :
                      entry.mood === 'heart' ? <Heart size={20} /> :
                      entry.mood === 'smile' ? <Smile size={20} /> :
                      entry.mood === 'activity' ? <Activity size={20} /> :
                      <FileText size={20} />}
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => onRemoveJournal(entry.id)} className="text-[10px] text-rose-300 hover:text-rose-500 font-bold">Delete</button>
                      </div>
                      <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{entry.content}"</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeCategory === 'labor' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="card-premium p-10 bg-white border-2 border-white text-center space-y-8">
              <div className="space-y-1">
                 <h3 className="text-xl font-serif text-rose-800">Contraction Timer</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tap when it starts, tap when it ends.</p>
              </div>

              <button 
                onClick={handleContractionToggle}
                className={`w-56 h-56 mx-auto rounded-[4rem] flex flex-col items-center justify-center gap-2 transition-all duration-500 shadow-2xl border-8 ${isContractionActive ? 'bg-rose-500 border-rose-200 animate-pulse scale-105' : 'bg-slate-900 border-slate-700'}`}
              >
                 <div className="text-white">
                   {isContractionActive ? <Square size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
                 </div>
                 <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{isContractionActive ? 'Stop' : 'Start'}</span>
              </button>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Duration</span>
                    <div className="text-lg font-bold text-rose-900">{formatDuration(contractions[0]?.duration)}</div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Frequency</span>
                    <div className="text-lg font-bold text-slate-900">{formatDuration(contractions[0]?.interval)}</div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labor History</h4>
              {contractions.map(c => (
                <div key={c.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex justify-between items-center">
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(c.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-sm font-bold text-slate-900">Duration: {formatDuration(c.duration)}</div>
                   </div>
                   <div className="text-right space-y-1">
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Interval</span>
                      <div className="text-sm font-black text-rose-600">{formatDuration(c.interval)}</div>
                   </div>
                </div>
              ))}
           </div>

            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-5">
               <div className="text-amber-500">
                 <Bell size={32} />
               </div>
               <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">If contractions are 5 mins apart and last 1 min for 1 hour, contact your provider.</p>
            </div>
        </div>
      )}
      {activeCategory === 'bath' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-cyan-800">Bath Tracker</h3>
            <p className="text-xs text-slate-400 font-medium">Keep track of your baby's bath schedule.</p>
            <button 
              onClick={() => {
                onAddJournal(`[Bath] Given a bath`, 'clean');
                showSuccess('Bath time logged!');
              }}
              className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-600 transition-colors"
            >
              Log Bath Today
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'pumping' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-pink-800">Pumping Log</h3>
            <p className="text-xs text-slate-400 font-medium">Track your pumping sessions and amounts.</p>
            <div className="flex gap-4">
              <input 
                type="number" 
                placeholder="Amount (ml)" 
                className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-200 text-sm"
                id="pumpingInput"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('pumpingInput') as HTMLInputElement).value;
                  if (val) {
                    onAddJournal(`[Pumping] ${val} ml`, 'milk');
                    showSuccess('Pumping session logged!');
                    (document.getElementById('pumpingInput') as HTMLInputElement).value = '';
                  }
                }}
                className="px-6 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'teething' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-yellow-800">Teething Tracker</h3>
            <p className="text-xs text-slate-400 font-medium">Log teething symptoms and milestones.</p>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Symptoms or tooth spotted..." 
                className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-yellow-200 text-sm"
                id="teethingInput"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('teethingInput') as HTMLInputElement).value;
                  if (val) {
                    onAddJournal(`[Teething] ${val}`, 'tooth');
                    showSuccess('Teething log saved!');
                    (document.getElementById('teethingInput') as HTMLInputElement).value = '';
                  }
                }}
                className="px-6 bg-yellow-500 text-white rounded-2xl font-bold shadow-lg shadow-yellow-200 hover:bg-yellow-600 transition-colors"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'tummy_time' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500">
              <Activity size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-rose-900">Tummy Time Tracker</h3>
              <p className="text-xs text-slate-400 font-medium">Log your baby's daily stomach-down playtime to support motor skill development.</p>
            </div>

            <div className="py-8">
              <div className="text-6xl font-mono font-black text-rose-900 tracking-tighter">
                {formatTime(tummyTimer.duration)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-2">Current Session</p>
            </div>

            <div className="flex gap-4">
              {!tummyTimer.startTime ? (
                <button 
                  onClick={() => setTummyTimer({ startTime: Date.now(), duration: 0 })}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={20} fill="currentColor" />
                  Start Session
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onAddTummyTime({ 
                      babyId: profile.babies?.[0]?.id || 'default', 
                      duration: tummyTimer.duration,
                      notes: ''
                    });
                    setTummyTimer({ startTime: null, duration: 0 });
                    showSuccess('Tummy time session saved!');
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Square size={20} fill="currentColor" />
                  Stop & Save
                </button>
              )}
            </div>
          </div>

          <div className="card-premium p-6 bg-white border-2 border-slate-50">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Today's Progress</h4>
            {(() => {
              const today = new Date().setHours(0,0,0,0);
              const todayLogs = tummyTimeLogs.filter(l => l.timestamp >= today);
              const totalSecs = todayLogs.reduce((acc, curr) => acc + curr.duration, 0);
              const goalSecs = 30 * 60; // 30 minutes goal
              const progress = Math.min((totalSecs / goalSecs) * 100, 100);

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-3xl font-black text-rose-900">{Math.floor(totalSecs / 60)}</span>
                      <span className="text-xs font-bold text-slate-400 ml-1">/ 30 min goal</span>
                    </div>
                    <span className="text-xs font-black text-rose-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeCategory === 'export' && (
        <ExportReport 
          profile={profile}
          feedingLogs={feedingLogs}
          sleepLogs={sleepLogs}
          diaperLogs={diaperLogs}
          babyGrowthLogs={babyGrowthLogs}
          milestones={milestones}
          healthLogs={healthLogs}
          tummyTimeLogs={tummyTimeLogs}
          journalEntries={journalEntries}
          kickLogs={kickLogs}
          reactions={reactions}
          calendarEvents={calendarEvents}
          bloodPressureLogs={bloodPressureLogs}
          medicationLogs={medicationLogs}
          weightLogs={weightLogs}
          waterLogs={waterLogs}
          vitamins={vitamins}
          symptoms={symptoms}
          contractions={contractions}
          kegelLogs={kegelLogs}
          foodEntries={foodEntries}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-white/80 backdrop-blur-xl text-slate-800 text-xs font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-white/50 min-w-[280px] justify-center"
          >
            <div className={`w-3 h-3 rounded-full animate-ping ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};