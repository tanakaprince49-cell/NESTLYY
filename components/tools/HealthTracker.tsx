import React, { useMemo, useState } from 'react';
import { Stethoscope, Plus } from 'lucide-react';
import { HealthLog, PregnancyProfile } from '../../types.ts';

interface HealthTrackerProps {
  healthLogs: HealthLog[];
  onAddHealth: (health: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const HealthTracker: React.FC<HealthTrackerProps> = ({
  healthLogs,
  onAddHealth,
  profile,
  selectedBabyId,
  setSelectedBabyId,
}) => {
  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';
  const [type, setType] = useState<HealthLog['type']>('symptom');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<HealthLog['status']>('normal');
  const [error, setError] = useState<string | null>(null);

  const babyHealth = useMemo(() => {
    return healthLogs
      .filter((h) => h.babyId === currentBabyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [healthLogs, currentBabyId]);

  if (!profile.babies?.length) {
    return (
      <div className="card-premium p-8 bg-white border-2 border-white text-center">
        <h3 className="text-xl font-serif text-rose-800">Health</h3>
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
            <h3 className="text-xl font-serif text-rose-800">Health</h3>
            <p className="text-xs text-slate-500 italic">Quick notes for symptoms, temps, meds, and vaccines.</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <Stethoscope size={22} />
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

        <div className="grid grid-cols-2 gap-2">
          {(['symptom', 'temperature', 'medication', 'vaccination'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                type === t ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-50 text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Value</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'temperature' ? '37.2°C' : type === 'vaccination' ? 'DTaP' : type === 'medication' ? 'Paracetamol 2.5ml' : 'Cough, rash, fussiness…'}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="1–2 lines…"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-semibold resize-none"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatus('normal')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                status === 'normal' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-50 text-slate-400'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setStatus('abnormal')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                status === 'abnormal' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-50 text-slate-400'
              }`}
            >
              Abnormal
            </button>
            <button
              onClick={() => {
                const cleanValue = value.trim();
                if (!cleanValue) {
                  setError('Please enter a value.');
                  return;
                }
                onAddHealth({
                  babyId: currentBabyId,
                  type,
                  value: cleanValue,
                  notes: notes.trim(),
                  status,
                });
                setValue('');
                setNotes('');
                setStatus('normal');
                setError(null);
              }}
              className="px-5 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="card-premium p-6 bg-white border-2 border-slate-50">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent</h4>
        {babyHealth.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No logs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {babyHealth.slice(0, 8).map((h) => (
              <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h.type}</div>
                    <div className="text-sm font-bold text-slate-800">{h.value}</div>
                    {h.notes && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{h.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${h.status === 'normal' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {h.status}
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap mt-1">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </div>
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

