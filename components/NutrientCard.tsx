import React from 'react';

interface NutrientCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  gradient: string;
}

export const NutrientCard: React.FC<NutrientCardProps> = ({ title, current, target, unit, gradient }) => {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div className="card-premium p-6 bg-white flex flex-col justify-between min-h-[140px]">
      <div className="space-y-1">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-serif text-slate-900">{current}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{unit}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
          <span className="text-slate-300">Goal: {target}</span>
          <span className={percentage >= 100 ? 'text-emerald-500' : 'text-rose-400'}>
            {percentage >= 100 ? 'Achieved' : `${Math.round(percentage)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};