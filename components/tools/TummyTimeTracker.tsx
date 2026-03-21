import React, { useState, useEffect } from 'react';
import { Activity, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { TummyTimeLog, PregnancyProfile } from '../../types.ts';
import { formatTime } from '../../src/utils/formatters.ts';

interface TummyTimeTrackerProps {
  tummyTimeLogs: TummyTimeLog[];
  onAddTummyTime: (log: Omit<TummyTimeLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
}

export const TummyTimeTracker: React.FC<TummyTimeTrackerProps> = ({ tummyTimeLogs, onAddTummyTime, profile }) => {
  const [tummyTimer, setTummyTimer] = useState<{ startTime: number | null, duration: number }>({ startTime: null, duration: 0 });

  useEffect(() => {
    let interval: any;
    if (tummyTimer.startTime) {
      interval = setInterval(() => {
        setTummyTimer(prev => ({ ...prev, duration: Math.floor((Date.now() - (prev.startTime || 0)) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tummyTimer.startTime]);

  const handleToggleTimer = () => {
    if (!tummyTimer.startTime) {
      setTummyTimer({ startTime: Date.now(), duration: 0 });
    } else {
      onAddTummyTime({ 
        babyId: profile.babies?.[0]?.id || 'default', 
        duration: tummyTimer.duration,
        notes: ''
      });
      setTummyTimer({ startTime: null, duration: 0 });
    }
  };

  const today = new Date().setHours(0,0,0,0);
  const todayLogs = tummyTimeLogs.filter(l => l.timestamp >= today);
  const totalSecs = todayLogs.reduce((acc, curr) => acc + curr.duration, 0);
  const goalSecs = 30 * 60; // 30 minutes goal
  const progress = Math.min((totalSecs / goalSecs) * 100, 100);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500">
          <Activity size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-serif text-rose-900">Tummy Time Tracker</h3>
          <p className="text-xs text-slate-400 font-medium">Log your baby's daily stomach-down playtime to support motor skill development.</p>
        </div>
        <p className="text-xs text-slate-500 italic">
          Nestly provides informational support only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>

        <div className="py-8">
          <div className="text-6xl font-mono font-black text-rose-900 tracking-tighter">
            {formatTime(tummyTimer.duration)}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-2">Current Session</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleToggleTimer}
            className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2 ${!tummyTimer.startTime ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600' : 'bg-slate-900 shadow-slate-200 hover:bg-slate-800'}`}
          >
            {!tummyTimer.startTime ? <Play size={20} fill="currentColor" /> : <Square size={20} fill="currentColor" />}
            {!tummyTimer.startTime ? 'Start Session' : 'Stop & Save'}
          </button>
        </div>
      </div>

      <div className="card-premium p-6 bg-white border-2 border-slate-50">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Today's Progress</h4>
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
      </div>
      
      {tummyTimeLogs.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Sessions</h4>
          <div className="space-y-3">
            {tummyTimeLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">{Math.floor(log.duration / 60)}m {log.duration % 60}s</div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
