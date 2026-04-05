import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { WeightLog, BabyGrowthLog, PregnancyProfile, LifecycleStage } from '../../types.ts';
import { Baby, User } from 'lucide-react';

interface VitalsTrackerProps {
  weightLogs: WeightLog[];
  onAddWeight: (val: number) => void;
  babyGrowthLogs: BabyGrowthLog[];
  onAddBabyGrowth: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({ 
  weightLogs, onAddWeight,
  babyGrowthLogs, onAddBabyGrowth, profile, selectedBabyId, setSelectedBabyId 
}) => {
  const isPostpartum =
    profile.lifecycleStage !== LifecycleStage.PREGNANCY &&
    profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;

  const [view, setView] = useState<'parent' | 'baby'>(isPostpartum ? 'baby' : 'parent');
  const [weightInput, setWeightInput] = useState('');
  const [babyWeightInput, setBabyWeightInput] = useState('');
  const [babyHeightInput, setBabyHeightInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const currentBabyId = selectedBabyId || profile.babies?.[0]?.id || '';

  const weightChartData = useMemo(() => {
    return [...weightLogs]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7)
      .map(l => ({
        val: l.weight,
        date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
      }));
  }, [weightLogs]);

  const babyGrowthChartData = useMemo(() => {
    const filtered = babyGrowthLogs
      .filter(l => l.babyId === currentBabyId)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return filtered.map(l => ({
      weight: l.weight,
      height: l.height,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [babyGrowthLogs, currentBabyId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {error && (
        <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 text-center">
          {error}
        </div>
      )}

      {isPostpartum && (
        <div className="flex justify-center">
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setView('parent')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                view === 'parent' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              Parent
            </button>
            <button
              onClick={() => setView('baby')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                view === 'baby' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Baby className="w-4 h-4" />
              Baby
            </button>
          </div>
        </div>
      )}

      {(!isPostpartum || view === 'parent') && (
        <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
          <h3 className="text-xl font-serif text-rose-800">Weight Tracker</h3>
          <p className="text-xs text-slate-500 italic">Monitor your health journey with Nestly.</p>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Current weight (kg)"
              className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
            />
            <button
              onClick={() => {
                const val = parseFloat(weightInput);
                if (val && val > 0 && val < 500) {
                  onAddWeight(val);
                  setWeightInput('');
                  setError(null);
                } else if (weightInput) {
                  setError('Please enter a valid weight.');
                }
              }}
              className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
            >
              Log
            </button>
          </div>

          {weightChartData.length > 0 && (
            <div className="pt-6 border-t border-slate-50 h-64">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Weight Trend</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {isPostpartum && view === 'baby' && (
        <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
          <h3 className="text-xl font-serif text-rose-800">Baby Growth Tracker</h3>
          <div className="space-y-4">
            {profile.babies?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {profile.babies?.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBabyId(b.id)}
                    className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      currentBabyId === b.id ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {b.name || `Baby ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.1"
                value={babyWeightInput}
                onChange={(e) => setBabyWeightInput(e.target.value)}
                placeholder="Weight (kg)"
                className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
              />
              <input
                type="number"
                step="0.1"
                value={babyHeightInput}
                onChange={(e) => setBabyHeightInput(e.target.value)}
                placeholder="Height (cm)"
                className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold"
              />
            </div>
            <button
              onClick={() => {
                if (babyWeightInput && babyHeightInput && currentBabyId) {
                  const weight = parseFloat(babyWeightInput);
                  const height = parseFloat(babyHeightInput);
                  if (weight > 0 && weight < 50 && height > 0 && height < 150) {
                    onAddBabyGrowth({ babyId: currentBabyId, weight, height });
                    setBabyWeightInput('');
                    setBabyHeightInput('');
                    setError(null);
                  } else {
                    setError('Please enter valid weight and height values.');
                  }
                }
              }}
              className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg"
            >
              Log Baby Growth
            </button>

            {babyGrowthChartData.length > 0 && (
              <div className="pt-6 border-t border-slate-50 space-y-8">
                <div className="h-48">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Weight Trend (kg)</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={babyGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                      <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-48">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Height Trend (cm)</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={babyGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="height" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
