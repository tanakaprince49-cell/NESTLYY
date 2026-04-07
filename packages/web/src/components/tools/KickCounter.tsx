import React from 'react';
import { Footprints } from 'lucide-react';
import { KickLog, PregnancyProfile } from '@nestly/shared';

interface KickCounterProps {
  kickLogs: KickLog[];
  onAddKick: (log: { babyId: string, count: number }) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const KickCounter: React.FC<KickCounterProps> = ({ 
  kickLogs, onAddKick, profile, selectedBabyId, setSelectedBabyId 
}) => {
  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Kick Counter</h3>
        <p className="text-xs text-slate-500 italic">
          Monitor your baby's movements with Nestly.
        </p>
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
            onClick={() => onAddKick({ babyId: currentBabyId, count: 1 })}
            className="w-40 h-40 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-inner border-4 border-white active:scale-90 transition-all"
          >
            <Footprints size={64} />
          </button>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Tap for each kick</span>
        </div>
      </div>
      <div className="space-y-4">
        {kickLogs.filter(k => k.babyId === currentBabyId).slice(0, 5).map(log => (
          <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="text-sm font-black text-rose-500">{log.count} Kick</span>
          </div>
        ))}
      </div>
    </div>
  );
};
