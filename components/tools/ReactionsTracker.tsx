import React, { useMemo, useState } from 'react';
import { Smile, Plus } from 'lucide-react';
import { PregnancyProfile, ReactionLog } from '../../types.ts';

interface ReactionsTrackerProps {
  reactions: ReactionLog[];
  onAddReaction: (reaction: Omit<ReactionLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const ReactionsTracker: React.FC<ReactionsTrackerProps> = ({
  reactions,
  onAddReaction,
  profile,
  selectedBabyId,
  setSelectedBabyId,
}) => {
  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';
  const [stimulus, setStimulus] = useState('Music');
  const [reaction, setReaction] = useState('');
  const [mood, setMood] = useState('Calm');
  const [error, setError] = useState<string | null>(null);

  const babyReactions = useMemo(() => {
    return reactions
      .filter((r) => r.babyId === currentBabyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [reactions, currentBabyId]);

  if (!profile.babies?.length) {
    return (
      <div className="card-premium p-8 bg-white border-2 border-white text-center">
        <h3 className="text-xl font-serif text-rose-800">Reactions</h3>
        <p className="text-xs text-slate-500 italic mt-2">Add a baby first in Settings → My Babies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 text-center">
          {error}
        </div>
      )}

      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-rose-800">Reactions</h3>
            <p className="text-xs text-slate-500 italic">Track what your baby reacts to.</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <Smile size={22} />
          </div>
        </div>

        {profile.babies.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {profile.babies.map((baby, idx) => (
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
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Stimulus</label>
              <select
                value={stimulus}
                onChange={(e) => setStimulus(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
              >
                {['Music', 'Voice', 'Light', 'Food', 'Bath', 'Tummy time', 'Toy', 'Other'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
              >
                {['Calm', 'Happy', 'Fussy', 'Sleepy', 'Excited'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Reaction</label>
            <input
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Smiled, calmed down, hiccups, kicked…"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
            />
          </div>
          <button
            onClick={() => {
              const cleanReaction = reaction.trim();
              if (!cleanReaction) {
                setError('Please describe the reaction.');
                return;
              }
              onAddReaction({
                babyId: currentBabyId,
                stimulus,
                reaction: cleanReaction,
                mood,
              });
              setReaction('');
              setError(null);
            }}
            className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Reaction
          </button>
        </div>
      </div>

      <div className="card-premium p-6 bg-white border-2 border-slate-50">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent</h4>
        {babyReactions.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No reactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {babyReactions.slice(0, 8).map((r) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.stimulus}</div>
                    <div className="text-sm font-bold text-slate-800">{r.reaction}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{r.mood}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
                    {new Date(r.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

