
import React, { useState } from 'react';
import { WaterLog } from '../types';

interface HydrationTrackerProps {
  logs: WaterLog[];
  onAddWater: (amount: number) => void;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({ logs, onAddWater }) => {
  const [goal] = useState(2000); 
  const [isOz, setIsOz] = useState(false);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysTotal = logs
    .filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const progress = Math.min(100, (todaysTotal / goal) * 100);
  const toOz = (ml: number) => Math.round(ml / 29.5735);
  const displayGoal = isOz ? toOz(goal) : goal;
  const displayTotal = isOz ? toOz(todaysTotal) : todaysTotal;
  const unit = isOz ? 'oz' : 'ml';

  return (
    <div className="glass p-6 sm:p-8 rounded-[2rem] shadow-lg relative overflow-hidden border-2 border-white/50 group">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-sky-700 uppercase tracking-widest">Hydration</h3>
        <button 
          onClick={() => setIsOz(!isOz)}
          className="text-[10px] text-sky-400 font-bold uppercase hover:text-sky-600 bg-sky-50/50 px-3 py-1 rounded-full border border-sky-100/50 backdrop-blur-sm active:scale-95 transition-all"
        >
          {isOz ? 'To ml' : 'To oz'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
        <div className="relative w-32 h-32 sm:w-28 sm:h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="10" fill="transparent" className="sm:cx-56 sm:cy-56 sm:r-50" />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="url(#waterGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
              className="transition-all duration-1000 sm:cx-56 sm:cy-56 sm:r-50"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          {/* Responsive center adjustment */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-2xl font-bold text-sky-900 leading-none">{displayTotal}</span>
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">{unit}</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <p className="text-xs text-gray-500 font-medium">
            Daily target: <span className="font-bold text-sky-700">{displayGoal}{unit}</span>
          </p>
          <div className="flex flex-row justify-center sm:justify-start gap-3">
            {[250, 500].map(amt => (
              <button
                key={amt}
                onClick={() => onAddWater(amt)}
                className="flex-1 sm:flex-none px-6 py-3 sm:px-4 sm:py-2 bg-sky-500 text-white text-xs font-black rounded-2xl hover:bg-sky-600 transition-all shadow-md shadow-sky-100 active:scale-95 uppercase tracking-widest"
              >
                +{isOz ? toOz(amt) : amt}{unit}
              </button>
            ))}
          </div>
          <p className="hidden sm:block text-[10px] text-sky-300 italic font-medium">
            Tip: Water supports baby's brain and blood flow!
          </p>
        </div>
      </div>
    </div>
  );
};
