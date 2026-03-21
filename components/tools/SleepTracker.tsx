import React, { useState, useMemo } from 'react';
import { Moon, Frown, Meh, Sparkles } from 'lucide-react';
import { SleepLog, PregnancyProfile } from '../../types.ts';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

interface SleepTrackerProps {
  sleepLogs: SleepLog[];
  onAddSleep: (log: Omit<SleepLog, 'id' | 'timestamp'>) => void;
  onRemoveSleep: (id: string) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({ 
  sleepLogs, onAddSleep, onRemoveSleep, profile, selectedBabyId 
}) => {
  const [sleepHours, setSleepHours] = useState('8');
  const [sleepQuality, setSleepQuality] = useState<SleepLog['quality']>(3);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('night');
  const [showSleepTooltip, setShowSleepTooltip] = useState(false);

  const sleepChartData = useMemo(() => {
    return sleepLogs.slice(-7).map(l => ({
      hours: l.hours,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [sleepLogs]);

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

  return (
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

        {sleepChartData.length > 0 && (
          <div className="pt-6 border-t border-slate-50 h-64">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Sleep Trend (Last 7 Days)</span>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#8b5cf6" 
                    strokeWidth={4} 
                    dot={{r: 4, fill: '#8b5cf6'}} 
                    animationDuration={2500}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

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
                className="text-xs font-black text-rose-400 uppercase tracking-widest hover:text-rose-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
