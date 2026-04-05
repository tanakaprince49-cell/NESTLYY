import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Baby, User, Moon, Sun, Calendar, Info, Clock, Edit2, Trash2 } from 'lucide-react';
import { SleepLog, PregnancyProfile, LifecycleStage } from '../../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { SleepMode, calculateDurationMinutes, formatDuration, generateInsights } from '../../src/utils/sleepUtils';
import { SleepEntryForm } from '../SleepEntryForm';
import { SleepCharts } from '../SleepCharts';
import { SleepInsights } from '../SleepInsights';
import { SleepHistory } from '../SleepHistory';
import { startOfDay } from 'date-fns';
import { storage } from '../../services/storageService.ts';

interface SleepTrackerProps {
  sleepLogs: SleepLog[];
  onAddSleep: (log: Omit<SleepLog, 'id' | 'timestamp'>) => void;
  onRemoveSleep: (id: string) => void;
  profile: PregnancyProfile;
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({ 
  sleepLogs, onAddSleep, onRemoveSleep, profile,
}) => {
  const babies = profile.babies || [];
  const [selectedBabyId, setSelectedBabyId] = useState<string>(() => babies[0]?.id || '');
  const isBabyStage =
    profile.lifecycleStage === LifecycleStage.NEWBORN ||
    profile.lifecycleStage === LifecycleStage.INFANT ||
    profile.lifecycleStage === LifecycleStage.TODDLER ||
    profile.lifecycleStage === LifecycleStage.BIRTH;
  const [mode, setMode] = useState<SleepMode>(
    isBabyStage ? 'newborn' : 'pregnancy'
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SleepLog | null>(null);
  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  useEffect(() => {
    if (babies.length === 0) return;
    if (!selectedBabyId || !babies.some((b) => b.id === selectedBabyId)) {
      setSelectedBabyId(babies[0].id);
    }
  }, [babies, selectedBabyId]);

  const filteredSleepLogs = useMemo(() => {
    return sleepLogs.filter((s) => {
      if (s.mode && s.mode !== mode) return false;
      if (mode === 'newborn') return (s.babyId || '') === currentBabyId;
      return true;
    });
  }, [sleepLogs, mode, currentBabyId]);

  const handleSaveSession = (sessionData: Partial<SleepLog>) => {
    const userId = storage.getAuthEmail() || 'guest';
    if (editingSession) {
      // The existing app doesn't have an onUpdateSleep, so we remove and add
      onRemoveSleep(editingSession.id);
      onAddSleep({
        ...sessionData,
        userId: editingSession.userId,
        babyId: mode === 'newborn' ? currentBabyId : undefined,
      } as Omit<SleepLog, 'id' | 'timestamp'>);
    } else {
      onAddSleep({
        ...sessionData,
        userId,
        babyId: mode === 'newborn' ? currentBabyId : undefined,
      } as Omit<SleepLog, 'id' | 'timestamp'>);
    }
    setIsFormOpen(false);
    setEditingSession(null);
  };

  const todaySessions = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredSleepLogs.filter(s => new Date(s.startTime) >= today);
  }, [filteredSleepLogs]);

  const totalSleepToday = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + calculateDurationMinutes(s.startTime, s.endTime), 0);
  }, [todaySessions]);

  const insights = useMemo(() => generateInsights(filteredSleepLogs, mode), [filteredSleepLogs, mode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setMode('pregnancy')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'pregnancy' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            Pregnancy
          </button>
          <button
            onClick={() => setMode('newborn')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'newborn' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Baby className="w-4 h-4" />
            Newborn
          </button>
        </div>
      </div>

      {mode === 'newborn' && babies.length > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {babies.map((baby, idx) => (
              <button
                key={baby.id}
                onClick={() => setSelectedBabyId(baby.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                  currentBabyId === baby.id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'
                }`}
              >
                {baby.name || `Baby ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'newborn' && babies.length === 0 && (
        <div className="card-premium p-6 bg-white border-2 border-white text-center">
          <div className="text-sm font-semibold text-slate-600">
            Add a baby first (Settings → My Babies) to track newborn sleep.
          </div>
        </div>
      )}

      {/* Today's Summary Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-rose-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <span className="text-rose-100 text-[10px] font-black uppercase tracking-[0.2em]">Today's Rest</span>
              <h2 className="text-4xl font-black tracking-tight">{formatDuration(totalSleepToday)}</h2>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Moon className="w-6 h-6 text-rose-100" />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
              <Moon className="w-3.5 h-3.5" />
              {todaySessions.filter(s => s.type === 'night').length} Night
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
              <Sun className="w-3.5 h-3.5" />
              {todaySessions.filter(s => s.type === 'nap').length} Naps
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Insights Section */}
      <SleepInsights insights={insights} />

      {/* Charts Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Sleep Analytics</h3>
        <SleepCharts sessions={filteredSleepLogs} mode={mode} />
      </div>

      {/* History Section */}
      <SleepHistory 
        sessions={filteredSleepLogs} 
        onEdit={(s) => { setEditingSession(s); setIsFormOpen(true); }}
        onDelete={onRemoveSleep}
      />

      {/* Add Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => { setEditingSession(null); setIsFormOpen(true); }}
          disabled={mode === 'newborn' && babies.length === 0}
          className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <Plus className="w-5 h-5" />
          Log Sleep
        </button>
      </div>

      {/* Entry Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <SleepEntryForm
            onSave={handleSaveSession}
            onClose={() => { setIsFormOpen(false); setEditingSession(null); }}
            initialData={editingSession || undefined}
            mode={mode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
