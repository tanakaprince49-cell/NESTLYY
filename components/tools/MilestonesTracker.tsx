import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Plus, Baby } from 'lucide-react';
import { MilestoneLog, PregnancyProfile } from '../../types.ts';

interface MilestonesTrackerProps {
  profile: PregnancyProfile;
  milestones: MilestoneLog[];
  onAddMilestone: (milestone: Omit<MilestoneLog, 'id' | 'timestamp'>) => void;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const MilestonesTracker: React.FC<MilestonesTrackerProps> = ({
  profile,
  milestones,
  onAddMilestone,
  selectedBabyId,
  setSelectedBabyId,
}) => {
  const babies = (profile.babies && profile.babies.length > 0)
    ? profile.babies
    : [{ id: '1', name: 'Baby' } as any];

  useEffect(() => {
    if (!selectedBabyId && babies.length > 0) setSelectedBabyId(babies[0].id);
  }, [babies, selectedBabyId, setSelectedBabyId]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return milestones
      .filter(m => m.babyId === selectedBabyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [milestones, selectedBabyId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 text-center">
          {error}
        </div>
      )}

      <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif text-rose-800 flex items-center gap-2">
              <Trophy size={20} /> Milestones
            </h3>
            <p className="text-xs text-slate-500 italic mt-1">Little moments you’ll never forget.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
            <Baby size={22} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {babies.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBabyId(b.id)}
              className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedBabyId === b.id ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}
            >
              {b.name || 'Baby'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Milestone (e.g. Rolled over)"
            className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
            />
            <button
              onClick={() => {
                setError(null);
                if (!selectedBabyId) {
                  setError("Please select a baby first.");
                  return;
                }
                const trimmed = title.trim();
                if (!trimmed) {
                  setError("Please enter a milestone title.");
                  return;
                }
                if (!date) {
                  setError("Please select a date.");
                  return;
                }
                onAddMilestone({
                  babyId: selectedBabyId,
                  title: trimmed,
                  date,
                  notes: notes.trim() || undefined,
                });
                setTitle('');
                setNotes('');
              }}
              className="px-5 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
          />
        </div>
      </div>

      <div className="card-premium p-8 bg-white space-y-5 shadow-sm border-2 border-white">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Recent</span>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
            {filtered.length} total
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-slate-500 text-sm font-semibold">
            No milestones yet. Add the first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 20).map(m => (
              <div key={m.id} className="p-4 bg-slate-50 rounded-2xl flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-800 truncate">{m.title}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                    {new Date(m.date).toLocaleDateString()}
                  </div>
                  {m.notes && (
                    <div className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                      {m.notes}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                  <Trophy size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

