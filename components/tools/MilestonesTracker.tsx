import React, { useMemo, useState } from 'react';
import { Trophy, Plus } from 'lucide-react';
import { MilestoneLog, PregnancyProfile } from '../../types.ts';

interface MilestonesTrackerProps {
  milestones: MilestoneLog[];
  onAddMilestone: (milestone: Omit<MilestoneLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const MilestonesTracker: React.FC<MilestonesTrackerProps> = ({
  milestones,
  onAddMilestone,
  profile,
  selectedBabyId,
  setSelectedBabyId,
}) => {
  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const babyMilestones = useMemo(() => {
    return milestones
      .filter((m) => m.babyId === currentBabyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [milestones, currentBabyId]);

  if (!profile.babies?.length) {
    return (
      <div className="card-premium p-8 bg-white border-2 border-white text-center">
        <h3 className="text-xl font-serif text-rose-800">Milestones</h3>
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
            <h3 className="text-xl font-serif text-rose-800">Milestones</h3>
            <p className="text-xs text-slate-500 italic">Celebrate the little wins.</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <Trophy size={22} />
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
          <div>
            <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="First smile, rolled over, said 'mama'..."
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
              />
            </div>
            <button
              onClick={() => {
                const cleanTitle = title.trim();
                if (!cleanTitle) {
                  setError('Please add a milestone title.');
                  return;
                }
                onAddMilestone({
                  babyId: currentBabyId,
                  title: cleanTitle,
                  date,
                  notes: notes.trim() || undefined,
                  photo: undefined,
                });
                setTitle('');
                setNotes('');
                setError(null);
              }}
              className="self-end h-[52px] bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          <div>
            <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="1–2 lines about the moment…"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-semibold resize-none"
              maxLength={160}
            />
          </div>
        </div>
      </div>

      <div className="card-premium p-6 bg-white border-2 border-slate-50">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent</h4>
        {babyMilestones.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No milestones yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {babyMilestones.slice(0, 8).map((m) => (
              <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{m.title}</div>
                    {m.notes && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{m.notes}</div>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString()}
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

