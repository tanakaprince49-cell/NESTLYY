import React, { useState } from 'react';
import { Play, Square, Bell } from 'lucide-react';
import { Contraction } from '../../types.ts';
import { formatDuration } from '../../src/utils/formatters.ts';

interface ContractionTimerProps {
  contractions: Contraction[];
  onUpdateContractions: (contractions: Contraction[]) => void;
}

export const ContractionTimer: React.FC<ContractionTimerProps> = ({ contractions, onUpdateContractions }) => {
  const [isContractionActive, setIsContractionActive] = useState(false);
  const [currentContractionStart, setCurrentContractionStart] = useState<number | null>(null);

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
          id: crypto.randomUUID(),
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

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-10 bg-white border-2 border-white text-center space-y-8">
        <div className="space-y-1">
          <h3 className="text-xl font-serif text-rose-800">Contraction Timer</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tap when it starts, tap when it ends.</p>
        </div>
        <p className="text-xs text-slate-500 italic">
          Nestly provides informational support only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>

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
  );
};
