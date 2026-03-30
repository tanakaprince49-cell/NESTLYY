import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { 
  SymptomLog, 
  Contraction, 
  JournalEntry, 
  CalendarEvent, 
  WeightLog, 
  SleepLog,
  Trimester,
  PregnancyProfile,
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
  VitaminLog,
  FoodEntry,
  ChecklistItem
} from '../types.ts';
import { storage } from '../services/storageService.ts';
const reportCenterImport = () => import('./ReportCenter.tsx');
const exportReportImport = () => import('./ExportReport.tsx');
const ReportCenter = lazy(() => reportCenterImport().then(m => ({ default: m.ReportCenter })));
const ExportReport = lazy(() => exportReportImport().then(m => ({ default: m.ExportReport })));
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Footprints, 
  Smile, 
  Heart, 
  Milk, 
  Soup, 
  Droplet, 
  Droplets, 
  Trophy, 
  Activity,
  Calendar as CalendarIcon,
  Moon,
  Thermometer,
  Pill,
  Stethoscope,
  Wind,
  ListTodo,
  Gift,
  Camera as CameraIcon,
  ArrowLeft,
  Search,
  Download,
  FileText,
  Timer,
  Book
} from 'lucide-react';

// Lazy load tracker components
const SymptomTracker = lazy(() => import('./tools/SymptomTracker.tsx').then(m => ({ default: m.SymptomTracker })));
const VitaminTracker = lazy(() => import('./tools/VitaminTracker.tsx').then(m => ({ default: m.VitaminTracker })));
const NutritionTracker = lazy(() => import('./tools/NutritionTracker.tsx').then(m => ({ default: m.NutritionTracker })));
const ContractionTimer = lazy(() => import('./tools/ContractionTimer.tsx').then(m => ({ default: m.ContractionTimer })));
const FeedingTracker = lazy(() => import('./tools/FeedingTracker.tsx').then(m => ({ default: m.FeedingTracker })));
const DiaperTracker = lazy(() => import('./tools/DiaperTracker.tsx').then(m => ({ default: m.DiaperTracker })));
const SleepTracker = lazy(() => import('./tools/SleepTracker.tsx').then(m => ({ default: m.SleepTracker })));
const KickCounter = lazy(() => import('./tools/KickCounter.tsx').then(m => ({ default: m.KickCounter })));
const KegelTracker = lazy(() => import('./tools/KegelTracker.tsx').then(m => ({ default: m.KegelTracker })));
const MedicationTracker = lazy(() => import('./tools/MedicationTracker.tsx').then(m => ({ default: m.MedicationTracker })));
const AppointmentTracker = lazy(() => import('./tools/AppointmentTracker.tsx').then(m => ({ default: m.AppointmentTracker })));
const ChecklistTracker = lazy(() => import('./tools/ChecklistTracker.tsx').then(m => ({ default: m.ChecklistTracker })));
const VitalsTracker = lazy(() => import('./tools/VitalsTracker.tsx').then(m => ({ default: m.VitalsTracker })));
const BabyNames = lazy(() => import('./tools/BabyNames.tsx').then(m => ({ default: m.BabyNames })));
const BumpDiary = lazy(() => import('./tools/BumpDiary.tsx').then(m => ({ default: m.BumpDiary })));
const MemoriesTracker = lazy(() => import('./tools/MemoriesTracker.tsx').then(m => ({ default: m.MemoriesTracker })));
const CalmTracker = lazy(() => import('./tools/CalmTracker.tsx').then(m => ({ default: m.CalmTracker })));
const BirthOnboarding = lazy(() => import('./tools/BirthOnboarding.tsx').then(m => ({ default: m.BirthOnboarding })));
const JournalTracker = lazy(() => import('./tools/JournalTracker.tsx').then(m => ({ default: m.JournalTracker })));
const BathTracker = lazy(() => import('./tools/BathTracker.tsx').then(m => ({ default: m.BathTracker })));
const PumpingTracker = lazy(() => import('./tools/PumpingTracker.tsx').then(m => ({ default: m.PumpingTracker })));
const TeethingTracker = lazy(() => import('./tools/TeethingTracker.tsx').then(m => ({ default: m.TeethingTracker })));
const TummyTimeTracker = lazy(() => import('./tools/TummyTimeTracker.tsx').then(m => ({ default: m.TummyTimeTracker })));

const TOOL_METADATA: Record<string, { label: string, icon: any, color: string, bgColor: string }> = {
  vitals: { label: 'Vitals', icon: Activity, color: 'text-rose-400', bgColor: 'bg-rose-50' },
  blood_pressure: { label: 'Blood Pressure', icon: Heart, color: 'text-red-400', bgColor: 'bg-red-50' },
  medications: { label: 'Medications', icon: Pill, color: 'text-indigo-400', bgColor: 'bg-indigo-50' },
  names: { label: 'Baby Names', icon: Sparkles, color: 'text-amber-400', bgColor: 'bg-amber-50' },
  bump: { label: 'Bump Photos', icon: CameraIcon, color: 'text-rose-400', bgColor: 'bg-rose-50' },
  nutrition: { label: 'Nutrition', icon: Soup, color: 'text-emerald-400', bgColor: 'bg-emerald-50' },
  vitamins: { label: 'Vitamins', icon: Pill, color: 'text-amber-400', bgColor: 'bg-amber-50' },
  feeding: { label: 'Feeding', icon: Milk, color: 'text-rose-400', bgColor: 'bg-rose-50' },
  diaper: { label: 'Diaper', icon: Droplets, color: 'text-emerald-400', bgColor: 'bg-emerald-50' },
  milestones: { label: 'Milestones', icon: Trophy, color: 'text-amber-400', bgColor: 'bg-amber-50' },
  health: { label: 'Health', icon: Stethoscope, color: 'text-red-400', bgColor: 'bg-red-50' },
  tummy_time: { label: 'Tummy Time', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-50' },
  bath: { label: 'Bath', icon: Droplet, color: 'text-cyan-400', bgColor: 'bg-cyan-50' },
  pumping: { label: 'Pumping', icon: Droplets, color: 'text-pink-400', bgColor: 'bg-pink-50' },
  teething: { label: 'Teething', icon: Smile, color: 'text-yellow-400', bgColor: 'bg-yellow-50' },
  export: { label: 'Export PDF', icon: Download, color: 'text-purple-400', bgColor: 'bg-purple-50' },
  journal: { label: 'Journal', icon: Book, color: 'text-blue-400', bgColor: 'bg-blue-50' },
  labor: { label: 'Labor', icon: Timer, color: 'text-orange-400', bgColor: 'bg-orange-50' },
  kicks: { label: 'Kicks', icon: Footprints, color: 'text-rose-400', bgColor: 'bg-rose-50' },
  reactions: { label: 'Reactions', icon: Smile, color: 'text-yellow-400', bgColor: 'bg-yellow-50' },
  calm: { label: 'Calm', icon: Wind, color: 'text-teal-400', bgColor: 'bg-teal-50' },
  birth: { label: 'Birth', icon: Gift, color: 'text-rose-400', bgColor: 'bg-rose-50' },
  kegels: { label: 'Kegels', icon: Activity, color: 'text-purple-400', bgColor: 'bg-purple-50' },
  memories: { label: 'Memories', icon: CameraIcon, color: 'text-pink-400', bgColor: 'bg-pink-50' },
  reports: { label: 'Reports', icon: FileText, color: 'text-indigo-400', bgColor: 'bg-indigo-50' },
  calendar: { label: 'Calendar', icon: CalendarIcon, color: 'text-blue-400', bgColor: 'bg-blue-50' },
  checklists: { label: 'Checklists', icon: ListTodo, color: 'text-emerald-400', bgColor: 'bg-emerald-50' },
  symptoms: { label: 'Symptoms', icon: Thermometer, color: 'text-red-400', bgColor: 'bg-red-50' },
  sleep: { label: 'Sleep', icon: Moon, color: 'text-indigo-400', bgColor: 'bg-indigo-50' },
};

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
  onAddFoodEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
  onRemoveFoodEntry: (id: string) => void;
  vitamins: VitaminLog[];
  onAddVitamin: (vitamin: Omit<VitaminLog, 'id' | 'timestamp'>) => void;
  trimester: Trimester;
  profile: PregnancyProfile;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onUpdateProfile?: (profile: PregnancyProfile) => void;
  onUpdateChecklist?: () => void;
  onUpdateBumpPhotos?: () => void;
  onUpdateBabyNames?: () => void;
  onUpdateArchive?: () => void;
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
  foodEntries, onAddFoodEntry, onRemoveFoodEntry,
  vitamins, onAddVitamin,
  profile,
  activeCategory, setActiveCategory, onUpdateProfile, onUpdateChecklist, onUpdateBumpPhotos, onUpdateBabyNames, onUpdateArchive
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Prefetch PDF-heavy chunks when Tools tab opens so they're cached before user clicks
  useEffect(() => {
    reportCenterImport();
    exportReportImport();
  }, []);
  const [selectedBabyId, setSelectedBabyId] = useState<string>(profile.babies?.[0]?.id || '');
  const [babyNames, setBabyNames] = useState(storage.getBabyNames());
  const [bumpPhotos, setBumpPhotos] = useState(storage.getBumpPhotos());
  const [albums, setAlbums] = useState(storage.getAlbums());
  const [checklists, setChecklists] = useState<{ [key: string]: ChecklistItem[] }>({
    hospital_bag: storage.getChecklist('hospital_bag'),
    birth_plan: storage.getChecklist('birth_plan'),
    nursery: storage.getChecklist('nursery'),
    general: storage.getChecklist('general')
  });

  const isPostpartum = profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;

  const categories = useMemo(() => {
    if (isPostpartum) {
      return ['feeding', 'sleep', 'diaper', 'milestones', 'health', 'medications', 'vitals', 'blood_pressure', 'tummy_time', 'bath', 'pumping', 'teething', 'journal', 'export', 'calendar', 'checklists', 'memories', 'symptoms', 'nutrition', 'vitamins'];
    }
    return ['vitals', 'blood_pressure', 'medications', 'names', 'bump', 'sleep', 'calendar', 'checklists', 'memories', 'kegels', 'journal', 'labor', 'kicks', 'reactions', 'calm', 'birth', 'reports', 'symptoms', 'nutrition', 'vitamins'];
  }, [isPostpartum]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat => {
      const meta = TOOL_METADATA[cat];
      return meta?.label?.toLowerCase().includes(searchQuery.toLowerCase()) || cat.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [categories, searchQuery]);

  useEffect(() => {
    if (!selectedBabyId && profile.babies?.length) {
      setSelectedBabyId(profile.babies[0].id);
    }
  }, [profile.babies, selectedBabyId]);

  const progressWeeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }, [profile]);

  const handleUpdateChecklist = () => {
    setChecklists({
      hospital_bag: storage.getChecklist('hospital_bag'),
      birth_plan: storage.getChecklist('birth_plan'),
      nursery: storage.getChecklist('nursery'),
      general: storage.getChecklist('general')
    });
    onUpdateChecklist?.();
  };

  const renderTool = () => {
    switch (activeCategory) {
      case 'symptoms':
        return <SymptomTracker symptoms={symptoms} onLogSymptom={onLogSymptom} />;
      case 'vitamins':
        return <VitaminTracker vitamins={vitamins} onAddVitamin={onAddVitamin} />;
      case 'nutrition':
        return <NutritionTracker foodEntries={foodEntries} onAddFoodEntry={onAddFoodEntry} onRemoveFoodEntry={onRemoveFoodEntry} />;
      case 'labor':
        return <ContractionTimer contractions={contractions} onUpdateContractions={onUpdateContractions} />;
      case 'feeding':
        return <FeedingTracker feedingLogs={feedingLogs} onAddFeeding={onAddFeeding} profile={profile} selectedBabyId={selectedBabyId} setSelectedBabyId={setSelectedBabyId} />;
      case 'diaper':
        return <DiaperTracker diaperLogs={diaperLogs} onAddDiaper={onAddDiaper} profile={profile} selectedBabyId={selectedBabyId} setSelectedBabyId={setSelectedBabyId} />;
      case 'sleep':
        return <SleepTracker sleepLogs={sleepLogs} onAddSleep={onAddSleep} onRemoveSleep={onRemoveSleep} profile={profile} selectedBabyId={selectedBabyId} />;
      case 'kicks':
        return <KickCounter kickLogs={kickLogs} onAddKick={onAddKick} profile={profile} selectedBabyId={selectedBabyId} setSelectedBabyId={setSelectedBabyId} />;
      case 'kegels':
        return <KegelTracker kegelLogs={kegelLogs} onAddKegel={onAddKegel} />;
      case 'medications':
        return <MedicationTracker medicationLogs={medicationLogs} onAddMedication={onAddMedication} onRemoveMedication={onRemoveMedication} />;
      case 'calendar':
        return <AppointmentTracker calendarEvents={calendarEvents} onAddEvent={onAddEvent} onRemoveEvent={onRemoveEvent} />;
      case 'checklists':
        return <ChecklistTracker checklists={checklists} onUpdateChecklist={handleUpdateChecklist} />;
      case 'vitals':
      case 'blood_pressure':
        return (
          <VitalsTracker 
            weightLogs={weightLogs} 
            onAddWeight={onAddWeight} 
            bloodPressureLogs={bloodPressureLogs} 
            onAddBloodPressure={onAddBloodPressure} 
            babyGrowthLogs={babyGrowthLogs} 
            onAddBabyGrowth={onAddBabyGrowth} 
            profile={profile} 
            selectedBabyId={selectedBabyId} 
            setSelectedBabyId={setSelectedBabyId} 
          />
        );
      case 'names':
        return <BabyNames babyNames={babyNames} onUpdateBabyNames={() => { setBabyNames(storage.getBabyNames()); onUpdateBabyNames?.(); }} />;
      case 'bump':
        return <BumpDiary bumpPhotos={bumpPhotos} onUpdateBumpPhotos={() => { setBumpPhotos(storage.getBumpPhotos()); onUpdateBumpPhotos?.(); }} progressWeeks={progressWeeks} />;
      case 'memories':
        return <MemoriesTracker albums={albums} onUpdateAlbums={() => { setAlbums(storage.getAlbums()); onUpdateProfile?.({ ...profile, albums: storage.getAlbums() }); }} />;
      case 'calm':
        return <CalmTracker onAddJournal={onAddJournal} journalEntries={journalEntries} />;
      case 'birth':
        return <BirthOnboarding profile={profile} onUpdateProfile={onUpdateProfile!} onUpdateArchive={onUpdateArchive!} />;
      case 'journal':
        return <JournalTracker journalEntries={journalEntries} onAddJournal={onAddJournal} onRemoveJournal={onRemoveJournal} />;
      case 'bath':
        return <BathTracker journalEntries={journalEntries} onAddJournal={onAddJournal} />;
      case 'pumping':
        return <PumpingTracker journalEntries={journalEntries} onAddJournal={onAddJournal} />;
      case 'teething':
        return <TeethingTracker journalEntries={journalEntries} onAddJournal={onAddJournal} />;
      case 'tummy_time':
        return <TummyTimeTracker tummyTimeLogs={tummyTimeLogs} onAddTummyTime={onAddTummyTime} profile={profile} />;
      case 'reports':
        return <ReportCenter />;
      case 'export':
        return <ExportReport 
          profile={profile} 
          symptoms={symptoms} 
          weightLogs={weightLogs} 
          contractions={contractions} 
          journalEntries={journalEntries} 
          calendarEvents={calendarEvents} 
          sleepLogs={sleepLogs} 
          feedingLogs={feedingLogs} 
          diaperLogs={diaperLogs} 
          milestones={milestones} 
          healthLogs={healthLogs} 
          reactions={reactions} 
          kickLogs={kickLogs} 
          kegelLogs={kegelLogs} 
          babyGrowthLogs={babyGrowthLogs} 
          tummyTimeLogs={tummyTimeLogs} 
          bloodPressureLogs={bloodPressureLogs} 
          medicationLogs={medicationLogs} 
          foodEntries={foodEntries} 
          vitamins={vitamins} 
        />;
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24"
    >
      {activeCategory === 'all' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-serif text-slate-900">Tools</h2>
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-50 text-slate-400">
              <Search size={20} />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl text-sm font-bold border-none shadow-sm focus:ring-2 focus:ring-rose-200 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredCategories.map(cat => {
              const meta = TOOL_METADATA[cat] || { label: cat, icon: Activity, color: 'text-rose-400', bgColor: 'bg-rose-50' };
              const Icon = meta.icon;
              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat)}
                  className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col items-center text-center gap-4 transition-all hover:shadow-md"
                >
                  <div className={`w-16 h-16 ${meta.bgColor} rounded-full flex items-center justify-center ${meta.color}`}>
                    <Icon size={32} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-tight">{meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => setActiveCategory('all')}
            className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest mb-4 hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} /> Back to Tools
          </button>
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
          }>
            {renderTool()}
          </Suspense>
        </div>
      )}
    </motion.div>
  );
};
