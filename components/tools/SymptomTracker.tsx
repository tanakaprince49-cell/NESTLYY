import React from 'react';
import { SymptomLog } from '../../types.ts';

interface SymptomTrackerProps {
  symptoms: SymptomLog[];
  onLogSymptom: (type: string, severity: number) => void;
}

export const SymptomTracker: React.FC<SymptomTrackerProps> = ({ symptoms, onLogSymptom }) => {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Symptom Tracker</h3>
        <p className="text-xs text-slate-400 font-medium">Log your symptoms to track patterns.</p>
        <div className="grid grid-cols-2 gap-4">
          {['Nausea', 'Headache', 'Fatigue', 'Heartburn', 'Cramps', 'Back Pain'].map(sym => (
            <button
              key={sym}
              onClick={() => onLogSymptom(sym, 3)}
              className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:bg-rose-50 hover:border-rose-200 transition-all text-sm font-bold text-slate-700"
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-50">
          <div className="flex gap-2">
            <input 
              type="text" 
              id="customSymptomInput"
              placeholder="Other symptom..."
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-100 text-sm focus:outline-none focus:border-rose-200 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) {
                    onLogSymptom(val, 3);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button 
              onClick={() => {
                const input = document.getElementById('customSymptomInput') as HTMLInputElement;
                if (input.value) {
                  onLogSymptom(input.value, 3);
                  input.value = '';
                }
              }}
              className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      {symptoms.length > 0 && (
        <div className="card-premium p-6 bg-white border-2 border-slate-50">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Recent Symptoms</h4>
          <div className="space-y-3">
            {symptoms.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="text-sm font-bold text-slate-800">{log.type}</div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
