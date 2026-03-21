import React, { useState } from 'react';
import { Droplet, Trash2, Droplets } from 'lucide-react';
import { DiaperLog, PregnancyProfile } from '../../types.ts';

interface DiaperTrackerProps {
  diaperLogs: DiaperLog[];
  onAddDiaper: (log: Omit<DiaperLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const DiaperTracker: React.FC<DiaperTrackerProps> = ({ 
  diaperLogs, onAddDiaper, profile, selectedBabyId, setSelectedBabyId 
}) => {
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'mixed'>('wet');

  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Diaper Tracker</h3>
        <p className="text-xs text-slate-500 italic">
          Nestly provides informational support only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
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
              babyId: currentBabyId, 
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
        {diaperLogs.filter(d => d.babyId === currentBabyId).map(log => (
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
  );
};
