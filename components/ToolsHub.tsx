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
  LifecycleStage,
  BabyGrowthLog,
  DiaperLog
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
  onAddEvent: (title: string, date: string, type: CalendarEvent['type']) => void;
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
  babyGrowthLogs: BabyGrowthLog[];
  onAddBabyGrowth: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
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
  reactions, onAddReaction, kickLogs, onAddKick, babyGrowthLogs, onAddBabyGrowth,
  trimester, profile,
  activeCategory, setActiveCategory, onUpdateProfile
}) => {
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
    if (kegelInterval.current) clearInterval(kegelInterval.current);
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

  const categories = useMemo(() => {
    if (isPostpartum) {
      return ['feeding', 'sleep', 'diaper', 'milestones', 'health', 'vitals', 'tummy_time', 'bath', 'pumping', 'teething', 'journal', 'export', 'calendar', 'checklists', 'memories', 'reports', 'settings'];
    }
    return ['vitals', 'water', 'names', 'bump', 'sleep', 'calendar', 'checklists', 'memories', 'kegels', 'progress', 'journal', 'labor', 'kicks', 'reactions', 'calm', 'archive', 'reports', 'settings'];
  }, [isPostpartum]);

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
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Baby Names</h3>
            <p className="text-xs text-slate-400 font-medium">Keep track of your favorite baby names.</p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newNameInput} 
                  onChange={e => setNewNameInput(e.target.value)} 
                  placeholder="Enter a name..." 
                  className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" 
                />
                <select 
                  value={newNameGender} 
                  onChange={e => setNewNameGender(e.target.value)}
                  className="px-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none"
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
                  }
                }}
                className="w-full py-4 bg-rose-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
              >
                Add Name
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {babyNames.map((item, idx) => (
                <motion.div 
                  key={`${item.name}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.gender === 'boy' ? 'bg-blue-400' : item.gender === 'girl' ? 'bg-pink-400' : 'bg-emerald-400'}`} />
                    <span className="font-bold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          onClick={() => {
                            const newNames = [...babyNames];
                            newNames[idx].rating = star;
                            setBabyNames(newNames);
                            storage.saveBabyNames(newNames);
                          }}
                          className={`text-lg transition-colors ${star <= item.rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const newNames = babyNames.filter((_, i) => i !== idx);
                        setBabyNames(newNames);
                        storage.saveBabyNames(newNames);
                      }}
                      className="p-2 text-rose-300 hover:text-rose-500 transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {babyNames.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-slate-400 text-sm font-medium"
              >
                No names added yet. Start brainstorming!
              </motion.div>
            )}
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
              <div className="grid grid-cols-2 gap-3">
                {['Music', 'Food', 'Voice', 'Touch'].map(stim => (
                  <button 
                    key={stim}
                    onClick={() => onAddReaction({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', stimulus: stim, reaction: 'Positive', mood: 'Happy' })}
                    className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    {stim}
                  </button>
                ))}
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
                <div className="text-rose-400">
                  <Smile size={24} />
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
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'temperature', icon: Thermometer },
                { type: 'medication', icon: Pill },
                { type: 'vaccination', icon: Syringe },
                { type: 'symptom', icon: Stethoscope }
              ].map(item => (
                <button 
                  key={item.type}
                  onClick={() => onAddHealth({ babyId: selectedBabyId || profile.babies?.[0]?.id || '', type: item.type, value: 'Normal', notes: '' })}
                  className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-500 transition-all flex flex-col items-center gap-2"
                >
                  <item.icon size={20} />
                  {item.type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {healthLogs.filter(h => h.babyId === (selectedBabyId || profile.babies?.[0]?.id || '')).map(log => (
              <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.type}</div>
                  <div className="text-sm font-bold text-slate-700">{log.value}</div>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCategory === 'settings' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
            <h3 className="text-xl font-serif text-rose-800">Account Settings</h3>
            <div className="space-y-4">
              <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4">
                <h4 className="text-sm font-bold text-rose-900">Danger Zone</h4>
                <p className="text-[10px] text-rose-700 leading-relaxed">Deleting your account will permanently remove all your data, including pregnancy history, baby profiles, and journal entries. This action cannot be undone.</p>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you absolutely sure? This will delete ALL your data permanently.")) {
                      storage.deleteAccount();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-4 bg-rose-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'reports' && (
        <div className="space-y-8 animate-in fade-in">
          <ReportCenter />
        </div>
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
                    onAddEvent(eventTitle, eventDate, eventType);
                    setEventTitle('');
                    setEventDate('');
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
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(event.date).toLocaleDateString()}</div>
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

      {activeCategory === 'progress' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="card-premium p-10 bg-white space-y-12 text-center border-2 border-white">
              <div className="space-y-2">
                 <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em]">Journey Progress</h3>
                 <div className="text-4xl font-serif text-slate-900">Month {progressMonths + 1} / Week {progressWeeks}</div>
              </div>

              <div className="space-y-6">
                 {/* Trimester Timeline */}
                 <div className="relative pt-6">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-300 tracking-widest mb-4">
                       <span>Tri 1</span>
                       <span>Tri 2</span>
                       <span>Tri 3</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full flex overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${progressWeeks < 13 ? 'bg-rose-500' : 'bg-rose-200'}`} style={{ width: '33.3%' }} />
                       <div className={`h-full transition-all duration-1000 ${progressWeeks >= 13 && progressWeeks < 27 ? 'bg-rose-500' : progressWeeks >= 27 ? 'bg-rose-200' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                       <div className={`h-full transition-all duration-1000 ${progressWeeks >= 27 ? 'bg-rose-500' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-rose-50 rounded-[2rem] border-2 border-white">
                       <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Time Lapsed</span>
                       <div className="text-2xl font-bold text-rose-900">{Math.round((progressWeeks / 40) * 100)}%</div>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-white">
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Weeks Left</span>
                       <div className="text-2xl font-bold text-emerald-900">{40 - progressWeeks}</div>
                    </div>
                 </div>
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

      {activeCategory === 'archive' && (
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
              <h3 className="text-xl font-serif text-rose-800">Pregnancy Archive</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Preserve your journey, every step of the way.</p>
              
              <button 
                onClick={() => setIsBirthOnboarding(true)}
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                <Baby size={18} /> Mark as Born & Switch to Newborn Mode
              </button>
              <button 
                onClick={() => {
                  const entry: any = {
                    id: Date.now().toString(),
                    startDate: profile.lmpDate,
                    endDate: new Date().toISOString(),
                    type: profile.pregnancyType,
                    outcome: 'other',
                    babies: (profile.babies || []).map(b => b.name)
                  };
                  storage.addToArchive(entry);
                  setArchive(storage.getArchive());
                }}
                className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-[9px] uppercase tracking-widest"
              >
                Archive Current Pregnancy
              </button>
            </div>
          )}

          <div className="space-y-4">
            {archive.map(entry => (
              <div key={entry.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest">{new Date(entry.startDate).getFullYear()} Journey</div>
                    <div className="text-lg font-serif text-slate-900 capitalize">{entry.type} Pregnancy</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${entry.outcome === 'birth' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    {entry.outcome}
                  </div>
                </div>
                <div className="flex gap-2">
                  {entry.babies.map((name, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600">
                      {name || 'Baby'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
      {activeCategory === 'tummy_time' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
            <h3 className="text-xl font-serif text-orange-800">Tummy Time Tracker</h3>
            <p className="text-xs text-slate-400 font-medium">Log your baby's daily tummy time to help build neck and shoulder strength.</p>
            <div className="flex gap-4">
              <input 
                type="number" 
                placeholder="Duration (mins)" 
                className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 text-sm"
                id="tummyTimeInput"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById('tummyTimeInput') as HTMLInputElement).value;
                  if (val) {
                    onAddJournal(`[Tummy Time] ${val} mins`, 'activity');
                    showSuccess('Tummy time logged!');
                    (document.getElementById('tummyTimeInput') as HTMLInputElement).value = '';
                  }
                }}
                className="px-6 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
              >
                Log
              </button>
            </div>
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

      {activeCategory === 'export' && (
        <ExportReport 
          profile={profile}
          feedingLogs={feedingLogs}
          sleepLogs={sleepLogs}
          diaperLogs={diaperLogs}
          babyGrowthLogs={babyGrowthLogs}
          milestones={milestones}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};