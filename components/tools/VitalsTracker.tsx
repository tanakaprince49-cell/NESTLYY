import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { WeightLog, BloodPressureLog, BabyGrowthLog, PregnancyProfile, LifecycleStage } from '../../types.ts';

interface VitalsTrackerProps {
  weightLogs: WeightLog[];
  onAddWeight: (val: number) => void;
  bloodPressureLogs: BloodPressureLog[];
  onAddBloodPressure: (log: Omit<BloodPressureLog, 'id' | 'timestamp'>) => void;
  babyGrowthLogs: BabyGrowthLog[];
  onAddBabyGrowth: (log: Omit<BabyGrowthLog, 'id' | 'timestamp'>) => void;
  profile: PregnancyProfile;
  selectedBabyId: string;
  setSelectedBabyId: (id: string) => void;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({ 
  weightLogs, onAddWeight, bloodPressureLogs, onAddBloodPressure, 
  babyGrowthLogs, onAddBabyGrowth, profile, selectedBabyId, setSelectedBabyId 
}) => {
  const [weightInput, setWeightInput] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpPulse, setBpPulse] = useState('');
  const [bpNotes, setBpNotes] = useState('');
  const [babyWeightInput, setBabyWeightInput] = useState('');
  const [babyHeightInput, setBabyHeightInput] = useState('');

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
      .filter(l => l.babyId === selectedBabyId)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return filtered.map(l => ({
      weight: l.weight,
      height: l.height,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [babyGrowthLogs, selectedBabyId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {profile.lifecycleStage === LifecycleStage.NEWBORN && (
        <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
          <h3 className="text-xl font-serif text-rose-800">Baby Growth Tracker</h3>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {profile.babies?.map(b => (
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
              <input type="number" step="0.1" value={babyWeightInput} onChange={e => setBabyWeightInput(e.target.value)} placeholder="Weight (kg)" className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              <input type="number" step="0.1" value={babyHeightInput} onChange={e => setBabyHeightInput(e.target.value)} placeholder="Height (cm)" className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
            </div>
            <button 
              onClick={() => {
                if (babyWeightInput && babyHeightInput && selectedBabyId) {
                  onAddBabyGrowth({ babyId: selectedBabyId, weight: parseFloat(babyWeightInput) || 0, height: parseFloat(babyHeightInput) || 0 });
                  setBabyWeightInput('');
                  setBabyHeightInput('');
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
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                      <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-48">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Height Trend (cm)</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={babyGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="height" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
        <h3 className="text-xl font-serif text-rose-800">{profile.lifecycleStage === LifecycleStage.NEWBORN ? 'Parent Weight Tracker' : 'Weight Tracker'}</h3>
        <div className="flex gap-3">
          <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="Current weight (kg)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
          <button 
            onClick={() => {
              if (weightInput) {
                onAddWeight(parseFloat(weightInput) || 0);
                setWeightInput('');
              }
            }} 
            className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
          >
            Log
          </button>
        </div>
        
        {weightChartData.length > 0 && (
          <div className="pt-6 border-t border-slate-50 h-64">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Weight Trend Analysis</span>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={4} dot={{r: 4, fill: '#8b5cf6'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
        <h3 className="text-xl font-serif text-rose-800">Blood Pressure Tracker</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="number" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} placeholder="Systolic (e.g. 120)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
            <span className="text-2xl text-slate-300 font-light flex items-center">/</span>
            <input type="number" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} placeholder="Diastolic (e.g. 80)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
          </div>
          <div className="flex gap-3">
            <input type="number" value={bpPulse} onChange={e => setBpPulse(e.target.value)} placeholder="Pulse (bpm) - Optional" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
            <button 
              onClick={() => {
                if (bpSystolic && bpDiastolic) {
                  onAddBloodPressure({
                    systolic: parseInt(bpSystolic),
                    diastolic: parseInt(bpDiastolic),
                    pulse: bpPulse ? parseInt(bpPulse) : undefined,
                    notes: bpNotes
                  });
                  setBpSystolic('');
                  setBpDiastolic('');
                  setBpPulse('');
                  setBpNotes('');
                }
              }} 
              className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest"
            >
              Log
            </button>
          </div>
        </div>
        
        {bloodPressureLogs.length > 0 && (
          <div className="pt-6 border-t border-slate-50 space-y-4">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 block">Recent Readings</span>
            <div className="space-y-3">
              {bloodPressureLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <div className="text-lg font-bold text-slate-800">{log.systolic}/{log.diastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span></div>
                    {log.pulse && <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Pulse: {log.pulse} bpm</div>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
