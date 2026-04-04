import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { HeartPulse, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { KegelLog } from '../../types.ts';

type RoutineId = 'quick_reset' | 'strength_build' | 'relax_release';

const ROUTINES: Record<
  RoutineId,
  {
    title: string;
    subtitle: string;
    steps: Array<{ label: string; seconds: number; kind: 'hold' | 'rest' | 'breathe' }>;
  }
> = {
  quick_reset: {
    title: 'Quick Reset',
    subtitle: 'Gentle 2-minute routine to reconnect and relax.',
    steps: [
      { label: 'Breathe in (soft belly)', seconds: 10, kind: 'breathe' },
      { label: 'Exhale + gentle lift', seconds: 6, kind: 'hold' },
      { label: 'Release fully', seconds: 8, kind: 'rest' },
      { label: 'Exhale + gentle lift', seconds: 6, kind: 'hold' },
      { label: 'Release fully', seconds: 10, kind: 'rest' },
      { label: 'Relaxed breathing', seconds: 60, kind: 'breathe' },
    ],
  },
  strength_build: {
    title: 'Strength Build',
    subtitle: 'Slow holds + rest. Great for daily strength.',
    steps: [
      { label: 'Warm-up breathing', seconds: 20, kind: 'breathe' },
      { label: 'Hold (slow lift)', seconds: 8, kind: 'hold' },
      { label: 'Rest', seconds: 10, kind: 'rest' },
      { label: 'Hold (slow lift)', seconds: 8, kind: 'hold' },
      { label: 'Rest', seconds: 10, kind: 'rest' },
      { label: 'Hold (slow lift)', seconds: 8, kind: 'hold' },
      { label: 'Rest', seconds: 10, kind: 'rest' },
      { label: 'Cool-down breathing', seconds: 30, kind: 'breathe' },
    ],
  },
  relax_release: {
    title: 'Relax & Release',
    subtitle: 'For tension, tightness, or after a long day.',
    steps: [
      { label: 'Breathe in (expand)', seconds: 12, kind: 'breathe' },
      { label: 'Exhale (release)', seconds: 12, kind: 'rest' },
      { label: 'Breathe in (expand)', seconds: 12, kind: 'breathe' },
      { label: 'Exhale (release)', seconds: 12, kind: 'rest' },
      { label: 'Long exhale + soften', seconds: 30, kind: 'rest' },
    ],
  },
};

const formatMmSs = (totalSeconds: number) => {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(clamped / 60)).padStart(2, '0');
  const ss = String(clamped % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const PelvicFloorTracker: React.FC<{
  kegelLogs: KegelLog[];
  onAddKegel: (kegel: Omit<KegelLog, 'id' | 'timestamp'>) => void;
}> = ({ kegelLogs, onAddKegel }) => {
  const [routineId, setRoutineId] = useState<RoutineId>('quick_reset');
  const routine = ROUTINES[routineId];

  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepRemaining, setStepRemaining] = useState(routine.steps[0]?.seconds || 0);
  const [completedSeconds, setCompletedSeconds] = useState(0);

  // Lightweight timer without extra deps; avoids running when tab is hidden.
  React.useEffect(() => {
    setStepIndex(0);
    setIsRunning(false);
    setCompletedSeconds(0);
    setStepRemaining(routine.steps[0]?.seconds || 0);
  }, [routineId]);

  React.useEffect(() => {
    if (!isRunning) return;
    if (document.hidden) return;

    const tick = () => {
      setStepRemaining(prev => {
        if (prev > 1) {
          setCompletedSeconds(s => s + 1);
          return prev - 1;
        }

        // Move to next step
        setCompletedSeconds(s => s + 1);
        setStepIndex(current => {
          const next = current + 1;
          const nextStep = routine.steps[next];
          if (!nextStep) {
            setIsRunning(false);
            // Log the completed routine as one kegel session duration.
            const total = routine.steps.reduce((acc, st) => acc + st.seconds, 0);
            onAddKegel({ duration: total });
            return current;
          }
          setStepRemaining(nextStep.seconds);
          return next;
        });

        return 0;
      });
    };

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, onAddKegel, routine.steps]);

  const totalSeconds = useMemo(() => routine.steps.reduce((acc, s) => acc + s.seconds, 0), [routine.steps]);
  const progress = totalSeconds > 0 ? Math.min(1, completedSeconds / totalSeconds) : 0;
  const currentStep = routine.steps[stepIndex];

  const last7Days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const startMs = start.getTime();

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startMs + i * 86400000);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }

    (kegelLogs || []).forEach(l => {
      if (l.timestamp < startMs) return;
      const day = new Date(l.timestamp);
      day.setHours(0, 0, 0, 0);
      const key = new Date(day.getTime()).toISOString().slice(0, 10);
      if (key in byDay) byDay[key] += l.duration || 0;
    });

    return Object.entries(byDay).map(([key, seconds]) => ({
      day: new Date(key).toLocaleDateString([], { weekday: 'short' }),
      minutes: Math.round((seconds / 60) * 10) / 10,
    }));
  }, [kegelLogs]);

  const totalThisWeekMinutes = useMemo(() => last7Days.reduce((a, b) => a + (b.minutes || 0), 0), [last7Days]);

  const stepColor =
    currentStep?.kind === 'hold' ? 'bg-rose-500' : currentStep?.kind === 'breathe' ? 'bg-indigo-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif text-rose-800 flex items-center gap-2">
              <HeartPulse size={20} /> Pelvic Floor
            </h3>
            <p className="text-xs text-slate-500 italic mt-1">Strength, support, and softness — one guided routine at a time.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(ROUTINES) as RoutineId[]).map(id => (
            <button
              key={id}
              onClick={() => setRoutineId(id)}
              className={`p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-1 ${
                routineId === id ? 'bg-rose-900 text-white border-rose-900 shadow-xl' : 'bg-white border-rose-50 text-slate-500'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{ROUTINES[id].title}</span>
              <span className={`text-[9px] font-bold ${routineId === id ? 'text-rose-200' : 'text-slate-300'}`}>
                {ROUTINES[id].subtitle}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 bg-rose-50/40 rounded-[2.5rem] border border-rose-100/60 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-rose-200/30 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-indigo-200/20 rounded-full blur-2xl" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Step</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-white/60 px-3 py-1 rounded-full border border-white">
                {formatMmSs(stepRemaining)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-lg font-black text-slate-900">{currentStep?.label || 'Ready'}</div>
              <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden border border-white">
                <div className={`h-full ${stepColor}`} style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{formatMmSs(completedSeconds)} done</span>
                <span>{formatMmSs(totalSeconds)} total</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRunning(r => !r)}
                className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setStepIndex(0);
                  setCompletedSeconds(0);
                  setStepRemaining(routine.steps[0]?.seconds || 0);
                }}
                className="px-5 py-4 bg-white/70 border border-white rounded-2xl text-slate-700 font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {routine.steps.slice(0, 6).map((s, idx) => (
                <div
                  key={`${s.label}-${idx}`}
                  className={`p-3 rounded-2xl border text-center ${
                    idx === stepIndex ? 'bg-white border-rose-200' : 'bg-white/50 border-white'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">{s.kind}</div>
                  <div className="text-sm font-black text-slate-800">{s.seconds}s</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium p-8 bg-white space-y-4 shadow-sm border-2 border-white">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Last 7 Days</span>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
            {Math.round(totalThisWeekMinutes)} min
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
              <Area type="monotone" dataKey="minutes" stroke="#f43f5e" strokeWidth={3} fill="url(#pfFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100/50">
        <p className="text-[11px] text-rose-800 font-medium italic leading-relaxed text-center">
          If you feel pain, heaviness, or leaking, consider checking in with a pelvic floor physiotherapist.
        </p>
      </div>
    </div>
  );
};

