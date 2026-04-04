import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Stethoscope, Plus, Baby } from 'lucide-react';
import { HealthLog, PregnancyProfile } from '../../types.ts';

interface HealthTrackerProps {
  profile: PregnancyProfile;
  healthLogs: HealthLog[];
  onAddHealth: (health: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const HealthTracker: React.FC<HealthTrackerProps> = ({
  profile,
  healthLogs,
  onAddHealth,
  selectedBabyId,
  setSelectedBabyId,
}) => {
  const babies = (profile.babies && profile.babies.length > 0)
    ? profile.babies
    : [{ id: '1', name: 'Baby' } as any];

  useEffect(() => {
    if (!selectedBabyId && babies.length > 0) setSelectedBabyId(babies[0].id);
  }, [babies, selectedBabyId, setSelectedBabyId]);

  const [type, setType] = useState<HealthLog['type']>('temperature');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<HealthLog['status']>('normal');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return healthLogs
      .filter(h => h.babyId === selectedBabyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [healthLogs, selectedBabyId]);

  const tempChart = useMemo(() => {
    const temps = filtered
      .filter(h => h.type === 'temperature')
      .map(h => {
        const parsed = parseFloat(String(h.value).replace(/[^\d.]/g, ''));
        return Number.isFinite(parsed) ? { value: parsed, date: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) } : null;
      })
      .filter(Boolean) as { value: number; date: string }[];

    return temps.slice(0, 14).reverse();
  }, [filtered]);

  const valuePlaceholder =
    type === 'temperature' ? 'Temperature (e.g. 37.2)' :
    type === 'medication' ? 'Medication (e.g. Paracetamol 2.5ml)' :
    type === 'vaccination' ? 'Vaccine (e.g. HepB dose 1)' :
    'Symptom (e.g. Cough)';

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
              <Stethoscope size={20} /> Baby Health
            </h3>
            <p className="text-xs text-slate-500 italic mt-1">Track temperature, symptoms, meds, and vaccines.</p>
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

        <div className="grid grid-cols-2 gap-3">
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
          >
            <option value="temperature">Temperature</option>
            <option value="symptom">Symptom</option>
            <option value="medication">Medication</option>
            <option value="vaccination">Vaccination</option>
          </select>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
          >
            <option value="normal">Normal</option>
            <option value="abnormal">Needs attention</option>
          </select>
        </div>

        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={valuePlaceholder}
          className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
        />
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
        />

        <button
          onClick={() => {
            setError(null);
            if (!selectedBabyId) {
              setError("Please select a baby first.");
              return;
            }
            const trimmed = value.trim();
            if (!trimmed) {
              setError("Please enter a value.");
              return;
            }
            if (type === 'temperature') {
              const parsed = parseFloat(trimmed.replace(/[^\d.]/g, ''));
              if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 45) {
                setError("Please enter a valid temperature (e.g. 37.2).");
                return;
              }
            }

            onAddHealth({
              babyId: selectedBabyId,
              type,
              value: trimmed,
              notes: notes.trim(),
              status,
            });
            setValue('');
            setNotes('');
          }}
          className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Health Log
        </button>
      </div>

      {tempChart.length > 0 && (
        <div className="card-premium p-8 bg-white space-y-4 shadow-sm border-2 border-white">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Temperature Trend</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
              last {tempChart.length} readings
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card-premium p-8 bg-white space-y-5 shadow-sm border-2 border-white">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Recent Logs</span>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
            {filtered.length} total
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-slate-500 text-sm font-semibold">
            No health logs yet. Add the first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 20).map(h => (
              <div key={h.id} className="p-4 bg-slate-50 rounded-2xl flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{h.type}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${h.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {h.status === 'abnormal' ? 'attention' : 'normal'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-800 mt-1 break-words">{h.value}</div>
                  {h.notes && (
                    <div className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                      {h.notes}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                    {new Date(h.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${h.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-rose-100 text-rose-600'}`}>
                  <Stethoscope size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

