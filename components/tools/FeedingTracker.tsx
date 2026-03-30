import React, { useState } from 'react';
import { Heart, Milk, Soup } from 'lucide-react';
import { FeedingLog, PregnancyProfile } from '../../types.ts';

interface FeedingTrackerProps {
  feedingLogs: FeedingLog[];
  onAddFeeding: (log: Omit<FeedingLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const FeedingTracker: React.FC<FeedingTrackerProps> = ({ 
  feedingLogs, onAddFeeding, profile, selectedBabyId, setSelectedBabyId 
}) => {
  const [feedingType, setFeedingType] = useState<'breast' | 'bottle' | 'solid'>('breast');
  const [feedingSubType, setFeedingSubType] = useState<'milk' | 'formula'>('milk');
  const [feedingSide, setFeedingSide] = useState<'left' | 'right' | 'both'>('both');
  const [feedingAmount, setFeedingAmount] = useState('120');
  const [feedingDuration, setFeedingDuration] = useState('15');
  const [error, setError] = useState<string | null>(null);

  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Feeding Tracker</h3>
        <p className="text-xs text-slate-500 italic">
          Track your baby's feeding with Nestly.
        </p>
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 text-center">
            {error}
          </div>
        )}
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
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

          <div className="grid grid-cols-3 gap-2">
            {(['breast', 'bottle', 'solid'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setFeedingType(type)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${feedingType === type ? 'bg-rose-50 border-rose-500 text-rose-500 shadow-md' : 'bg-white border-slate-50 opacity-60'}`}
              >
                <span className="text-rose-400">
                  {type === 'breast' ? <Heart size={24} /> : type === 'bottle' ? <Milk size={24} /> : <Soup size={24} />}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {feedingType === 'breast' && (
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'right', 'both'] as const).map(side => (
                  <button 
                    key={side}
                    onClick={() => setFeedingSide(side)}
                    className={`p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all ${feedingSide === side ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'}`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            )}
            {feedingType === 'bottle' && (
              <div className="grid grid-cols-2 gap-2">
                {(['milk', 'formula'] as const).map(sub => (
                  <button 
                    key={sub}
                    onClick={() => setFeedingSubType(sub)}
                    className={`p-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all ${feedingSubType === sub ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-50'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Amount (ml)</label>
                <input type="number" value={feedingAmount} onChange={e => setFeedingAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Duration (min)</label>
                <input type="number" value={feedingDuration} onChange={e => setFeedingDuration(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              const amount = parseFloat(feedingAmount) || 0;
              const duration = parseFloat(feedingDuration) || 0;
              
              if ((amount > 0 && amount < 1000) || (duration > 0 && duration < 180)) {
                onAddFeeding({ 
                  babyId: currentBabyId, 
                  type: feedingType, 
                  subType: feedingType === 'bottle' ? feedingSubType : undefined,
                  side: feedingType === 'breast' ? feedingSide : undefined,
                  amount,
                  duration
                });
                setFeedingAmount('');
                setFeedingDuration('');
                setError(null);
              } else {
                setError("Please enter a valid amount or duration.");
              }
            }}
            className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Log Feeding Session
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {feedingLogs.filter(f => f.babyId === currentBabyId).map(log => (
          <div key={log.id} className="card-premium p-4 bg-white border-2 border-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-rose-400">
                {log.type === 'breast' ? <Heart size={20} /> : log.type === 'bottle' ? <Milk size={20} /> : <Soup size={20} />}
              </span>
              <div>
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.type} {log.side ? `(${log.side})` : ''}</div>
                <div className="text-sm font-bold text-slate-700">{log.amount} ml • {log.duration} min</div>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
