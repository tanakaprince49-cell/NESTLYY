import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, Baby, Ruler, Milk, Moon, Droplets } from 'lucide-react';
import { PregnancyProfile, FeedingLog, SleepLog, DiaperLog, BabyGrowthLog, MilestoneLog } from '../types.ts';

interface ExportReportProps {
  profile: PregnancyProfile;
  feedingLogs: FeedingLog[];
  sleepLogs: SleepLog[];
  diaperLogs: DiaperLog[];
  babyGrowthLogs: BabyGrowthLog[];
  milestones: MilestoneLog[];
}

export const ExportReport: React.FC<ExportReportProps> = ({
  profile,
  feedingLogs,
  sleepLogs,
  diaperLogs,
  babyGrowthLogs,
  milestones
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!reportRef.current) return;
    
    const opt: any = {
      margin:       10,
      filename:     'nestly-baby-report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(reportRef.current).save();
  };

  const recentFeedings = feedingLogs.slice(0, 5);
  const recentSleep = sleepLogs.slice(0, 5);
  const recentDiapers = diaperLogs.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white text-center space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Export Baby Report</h3>
        <p className="text-xs text-slate-400 font-medium">Download a comprehensive PDF report of your baby's recent activities, growth, and milestones.</p>
        
        <button 
          onClick={handleExport}
          className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Download PDF Report
        </button>
      </div>

      {/* Hidden Report Content for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={reportRef} className="p-8 bg-white text-slate-800 font-sans" style={{ width: '800px' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-rose-100 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-serif text-rose-600">Nestly Baby Report</h1>
              <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-700">{profile.userName}'s Dashboard</h2>
              {profile.babies && profile.babies.length > 0 && (
                <p className="text-sm text-slate-500 mt-1">Baby: {profile.babies.map(b => b.name).join(', ')}</p>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Feeding Summary */}
            <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Milk size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest">Recent Feedings</h3>
              </div>
              <div className="space-y-3">
                {recentFeedings.length > 0 ? recentFeedings.map(log => (
                  <div key={log.id} className="text-xs flex justify-between items-center border-b border-rose-100/50 pb-2">
                    <span className="text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="font-black text-rose-900">{log.type} {log.amount ? `${log.amount}ml` : ''} {log.duration ? `${log.duration}m` : ''}</span>
                  </div>
                )) : <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent feedings</p>}
              </div>
            </div>

            {/* Sleep Summary */}
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Moon size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest">Recent Sleep</h3>
              </div>
              <div className="space-y-3">
                {recentSleep.length > 0 ? recentSleep.map(log => (
                  <div key={log.id} className="text-xs flex justify-between items-center border-b border-indigo-100/50 pb-2">
                    <span className="text-slate-400 font-bold">{new Date(log.timestamp).toLocaleDateString()}</span>
                    <span className="font-black text-indigo-900">{log.hours} hrs ({log.type})</span>
                  </div>
                )) : <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent sleep</p>}
              </div>
            </div>

            {/* Diaper Summary */}
            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Droplets size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest">Recent Diapers</h3>
              </div>
              <div className="space-y-3">
                {recentDiapers.length > 0 ? recentDiapers.map(log => (
                  <div key={log.id} className="text-xs flex justify-between items-center border-b border-emerald-100/50 pb-2">
                    <span className="text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="font-black text-emerald-900 capitalize">{log.type}</span>
                  </div>
                )) : <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent diapers</p>}
              </div>
            </div>

            {/* Growth Summary */}
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Ruler size={20} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-widest">Latest Growth</h3>
              </div>
              <div className="space-y-3">
                {babyGrowthLogs.length > 0 ? (
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Weight:</span>
                      <span className="font-black text-blue-900">{babyGrowthLogs[0].weight} kg</span>
                    </div>
                    {babyGrowthLogs[0].height && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Height:</span>
                        <span className="font-black text-blue-900">{babyGrowthLogs[0].height} cm</span>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-300 mt-4 text-right font-black uppercase tracking-widest">
                      Recorded on {new Date(babyGrowthLogs[0].timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ) : <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No growth data</p>}
              </div>
            </div>
          </div>

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="mt-6 bg-amber-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Baby size={20} />
                <h3 className="font-bold">Recent Milestones</h3>
              </div>
              <div className="space-y-2">
                {milestones.slice(0, 5).map(m => (
                  <div key={m.id} className="text-sm flex justify-between border-b border-amber-100 pb-1">
                    <span className="font-medium">{m.title}</span>
                    <span className="text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>This report is generated by Nestly - Your companion for pregnancy and newborn care.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
