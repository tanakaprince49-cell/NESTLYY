import React, { useState } from 'react';
import { Pill, Check } from 'lucide-react';
import { VitaminLog } from '../../types.ts';

interface VitaminTrackerProps {
  vitamins: VitaminLog[];
  onAddVitamin: (v: { name: string }) => void;
}

export const VitaminTracker: React.FC<VitaminTrackerProps> = ({ vitamins, onAddVitamin }) => {
  const [vitaminName, setVitaminName] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-indigo-500" />
          Log Vitamin
        </h3>
        <p className="text-xs text-slate-500 mb-4 italic">
          Track your daily vitamins with Nestly.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Vitamin Name (e.g. Prenatal)"
            className="flex-1 p-3 rounded-xl border border-black/10"
            value={vitaminName}
            onChange={(e) => setVitaminName(e.target.value)}
          />
          <button
            onClick={() => {
              if (vitaminName) {
                onAddVitamin({ name: vitaminName });
                setVitaminName('');
              }
            }}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Log
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
        <h3 className="text-lg font-semibold mb-4">Today's Vitamins</h3>
        <div className="space-y-3">
          {vitamins.filter(v => new Date(v.timestamp).toDateString() === new Date().toDateString()).map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-stone-500">{new Date(v.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
          {vitamins.filter(v => new Date(v.timestamp).toDateString() === new Date().toDateString()).length === 0 && (
            <p className="text-center text-stone-400 py-4">No vitamins logged today</p>
          )}
        </div>
      </div>
    </div>
  );
};
