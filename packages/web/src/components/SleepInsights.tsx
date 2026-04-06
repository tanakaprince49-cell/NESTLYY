import React from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

interface SleepInsightsProps {
  insights: string[];
}

export const SleepInsights: React.FC<SleepInsightsProps> = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-violet-50 p-6 rounded-3xl border border-rose-100/50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-rose-900">Smart Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3 items-start bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm">
            {insight.includes('below') || insight.includes('frequently') ? (
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            )}
            <p className="text-sm text-slate-700 leading-relaxed">
              {insight}
            </p>
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-[10px] text-slate-400 italic text-center">
        This feature provides general sleep tracking and is not medical advice.
      </p>
    </div>
  );
};
