import React, { useState, useRef } from 'react';
import { Flower } from 'lucide-react';
import { KegelLog } from '../../types.ts';

interface KegelTrackerProps {
  kegelLogs: KegelLog[];
  onAddKegel: (log: Omit<KegelLog, 'id' | 'timestamp'>) => void;
}

export const KegelTracker: React.FC<KegelTrackerProps> = ({ kegelLogs, onAddKegel }) => {
  const [isKegelActive, setIsKegelActive] = useState(false);
  const [kegelTimer, setKegelTimer] = useState(0);
  const kegelInterval = useRef<number | null>(null);

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

  return (
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

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Sessions</h4>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
            {kegelLogs.length} Recorded
          </span>
        </div>
        <div className="space-y-3">
          {kegelLogs.slice(0, 5).map((log, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                  <Flower size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{log.duration}s Session</div>
                  <div className="text-[9px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Recorded</div>
            </div>
          ))}
          {kegelLogs.length === 0 && (
            <div className="py-8 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
