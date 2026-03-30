import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Baby, User, Moon, Sun, Calendar, Info } from 'lucide-react';
import { SleepLog, SleepMode, calculateDurationMinutes, formatDuration, generateInsights } from '../src/utils/sleepUtils';
import { SleepEntryForm } from './SleepEntryForm';
import { SleepCharts } from './SleepCharts';
import { SleepInsights } from './SleepInsights';
import { SleepHistory } from './SleepHistory';
import { startOfDay, format, subDays } from 'date-fns';

const SAMPLE_DATA: SleepLog[] = [
  {
    id: '1',
    userId: 'user1',
    startTime: subDays(new Date(), 1).toISOString().replace(/T\d{2}:\d{2}/, 'T22:00'),
    endTime: subDays(new Date(), 0).toISOString().replace(/T\d{2}:\d{2}/, 'T06:30'),
    mode: 'pregnancy',
    quality: 'good',
    type: 'night',
    timestamp: Date.now(),
  },
  {
    id: '2',
    userId: 'user1',
    startTime: subDays(new Date(), 1).toISOString().replace(/T\d{2}:\d{2}/, 'T14:00'),
    endTime: subDays(new Date(), 1).toISOString().replace(/T\d{2}:\d{2}/, 'T15:30'),
    mode: 'pregnancy',
    quality: 'okay',
    type: 'nap',
    timestamp: Date.now(),
  },
];

export const SleepDashboard: React.FC = () => {
  const [mode, setMode] = useState<SleepMode>('pregnancy');
  const [sessions, setSessions] = useState<SleepLog[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SleepLog | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sleep_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      setSessions(SAMPLE_DATA);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('sleep_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleSaveSession = (sessionData: Partial<SleepLog>) => {
    if (editingSession) {
      setSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, ...sessionData } as SleepLog : s));
    } else {
      const newSession: SleepLog = {
        ...sessionData,
        id: Math.random().toString(36).substr(2, 9),
        userId: 'user1',
        timestamp: Date.now(),
      } as SleepLog;
      setSessions(prev => [...prev, newSession]);
    }
    setIsFormOpen(false);
    setEditingSession(null);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sleep entry?')) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEditSession = (session: SleepLog) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const todaySessions = useMemo(() => {
    const today = startOfDay(new Date());
    return sessions.filter(s => new Date(s.startTime) >= today);
  }, [sessions]);

  const totalSleepToday = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + calculateDurationMinutes(s.startTime, s.endTime), 0);
  }, [todaySessions]);

  const insights = useMemo(() => generateInsights(sessions, mode), [sessions, mode]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sleep Tracker</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Rest well, grow strong.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setMode('pregnancy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                mode === 'pregnancy' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              Pregnancy
            </button>
            <button
              onClick={() => setMode('newborn')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                mode === 'newborn' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Baby className="w-4 h-4" />
              Newborn
            </button>
          </div>
        </div>

        {/* Today's Summary Card */}
        <div className="max-w-2xl mx-auto bg-rose-600 rounded-3xl p-6 text-white shadow-2xl shadow-rose-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-rose-100 text-xs font-bold uppercase tracking-widest">Today's Sleep</span>
              <Calendar className="w-5 h-5 text-rose-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{formatDuration(totalSleepToday)}</span>
              <span className="text-rose-200 text-sm font-medium">total</span>
            </div>
            <div className="mt-6 flex gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                <Moon className="w-3.5 h-3.5" />
                {todaySessions.filter(s => s.type === 'night').length} Night
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                <Sun className="w-3.5 h-3.5" />
                {todaySessions.filter(s => s.type === 'nap').length} Naps
              </div>
            </div>
          </div>
          {/* Decorative background circles */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Insights Section */}
        <SleepInsights insights={insights} />

        {/* Charts Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 px-2">Analytics</h2>
          <SleepCharts sessions={sessions} mode={mode} />
        </div>

        {/* History Section */}
        <SleepHistory 
          sessions={sessions} 
          onEdit={handleEditSession}
          onDelete={handleDeleteSession}
        />
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingSession(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-rose-600 text-white rounded-full shadow-2xl shadow-rose-300 flex items-center justify-center hover:bg-rose-700 active:scale-90 transition-all z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Entry Form Modal */}
      {isFormOpen && (
        <SleepEntryForm
          onSave={handleSaveSession}
          onClose={() => {
            setIsFormOpen(false);
            setEditingSession(null);
          }}
          initialData={editingSession || undefined}
          mode={mode}
        />
      )}
    </div>
  );
};
