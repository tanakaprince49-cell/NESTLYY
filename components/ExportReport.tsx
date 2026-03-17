import React, { useRef, useState, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  Download, Baby, Ruler, Milk, Moon, Droplets, Stethoscope, Activity, 
  Heart, FileText, Calendar, Trophy, Pill, Activity as ActivityIcon,
  Thermometer, Zap, Utensils, Waves, Search, Check, Smile, Sparkles
} from 'lucide-react';
import { 
  PregnancyProfile, FeedingLog, SleepLog, DiaperLog, BabyGrowthLog, 
  MilestoneLog, HealthLog, TummyTimeLog, JournalEntry, KickLog, 
  ReactionLog, CalendarEvent, BloodPressureLog, MedicationLog, 
  WeightLog, SymptomLog, VitaminLog, Contraction,
  KegelLog, FoodEntry
} from '../types.ts';

interface ExportReportProps {
  profile: PregnancyProfile;
  feedingLogs: FeedingLog[];
  sleepLogs: SleepLog[];
  diaperLogs: DiaperLog[];
  babyGrowthLogs: BabyGrowthLog[];
  milestones: MilestoneLog[];
  healthLogs: HealthLog[];
  tummyTimeLogs: TummyTimeLog[];
  journalEntries: JournalEntry[];
  kickLogs: KickLog[];
  reactions: ReactionLog[];
  calendarEvents: CalendarEvent[];
  bloodPressureLogs: BloodPressureLog[];
  medicationLogs: MedicationLog[];
  weightLogs: WeightLog[];
  symptoms: SymptomLog[];
  vitamins: VitaminLog[];
  contractions: Contraction[];
  kegelLogs: KegelLog[];
  foodEntries: FoodEntry[];
}

export const ExportReport: React.FC<ExportReportProps> = ({
  profile,
  feedingLogs,
  sleepLogs,
  diaperLogs,
  babyGrowthLogs,
  milestones,
  healthLogs,
  tummyTimeLogs,
  journalEntries,
  kickLogs,
  reactions,
  calendarEvents,
  bloodPressureLogs,
  medicationLogs,
  weightLogs,
  symptoms,
  vitamins,
  contractions,
  kegelLogs,
  foodEntries
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [recentReports, setRecentReports] = useState<{start: string, end: string, id: string}[]>(() => {
    const saved = localStorage.getItem('nestly_recent_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const filteredData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // Include the full end day

    const filter = (logs: any[]) => logs.filter(l => {
      const ts = l.timestamp || (l.date ? new Date(l.date).getTime() : 0);
      return ts >= start && ts <= end;
    });

    return {
      feeding: filter(feedingLogs),
      sleep: filter(sleepLogs),
      diaper: filter(diaperLogs),
      growth: filter(babyGrowthLogs),
      milestones: filter(milestones),
      health: filter(healthLogs),
      tummyTime: filter(tummyTimeLogs),
      journal: filter(journalEntries),
      kicks: filter(kickLogs),
      reactions: filter(reactions),
      events: filter(calendarEvents),
      bp: filter(bloodPressureLogs),
      meds: filter(medicationLogs),
      weight: filter(weightLogs),
      symptoms: filter(symptoms),
      vitamins: filter(vitamins),
      contractions: filter(contractions),
      kegels: filter(kegelLogs),
      nutrition: filter(foodEntries)
    };
  }, [startDate, endDate, feedingLogs, sleepLogs, diaperLogs, babyGrowthLogs, milestones, healthLogs, tummyTimeLogs, journalEntries, kickLogs, reactions, calendarEvents, bloodPressureLogs, medicationLogs, weightLogs, symptoms, vitamins, contractions, kegelLogs, foodEntries]);

  const handleExport = () => {
    if (!reportRef.current) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (startDate > today || endDate > today) return;
    if (startDate > endDate) return;
    
    const opt: any = {
      margin:       [10, 10, 10, 10],
      filename:     `nestly-report-${startDate}-to-${endDate}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        windowWidth: 1024, 
        scrollY: 0,
        backgroundColor: '#ffffff'
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(reportRef.current).save();

    // Save to recent reports
    const newReport = { start: startDate, end: endDate, id: Date.now().toString() };
    const updated = [newReport, ...recentReports.slice(0, 4)];
    setRecentReports(updated);
    localStorage.setItem('nestly_recent_reports', JSON.stringify(updated));
  };

  const Section = ({ title, icon: Icon, children, color = "pink" }: any) => (
    <div className="mb-8 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
      <div className={`flex items-center gap-3 mb-4 border-b-2 border-${color}-100 pb-2`}>
        {Icon && <Icon className={`text-${color}-500`} size={20} />}
        <h2 className="text-xl font-serif font-bold text-slate-800">{title}</h2>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        {children}
      </div>
    </div>
  );

  const DataRow = ({ label, value, subValue }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-sm font-bold text-slate-700">{label}</div>
        {subValue && <div className="text-[10px] text-slate-400 font-medium">{subValue}</div>}
      </div>
      <div className="text-sm font-black text-pink-600">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif text-rose-800">Comprehensive Health Report</h3>
          <p className="text-xs text-slate-400 font-medium">Select a date range to generate your personalized report.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <input 
              type="date"
              value={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => {
                const val = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (val <= today) setStartDate(val);
              }}
              className={`w-full px-4 py-3 bg-pink-50/50 rounded-xl text-sm font-bold border-2 transition-all ${
                startDate > endDate ? 'border-rose-300 bg-rose-50' : 'border-pink-100 focus:ring-2 focus:ring-pink-200 focus:border-pink-300'
              }`}
            />
          </div>
          <div className="space-y-1">
            <input 
              type="date"
              value={endDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => {
                const val = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (val <= today) setEndDate(val);
              }}
              className={`w-full px-4 py-3 bg-pink-50/50 rounded-xl text-sm font-bold border-2 transition-all ${
                startDate > endDate ? 'border-rose-300 bg-rose-50' : 'border-pink-100 focus:ring-2 focus:ring-pink-200 focus:border-pink-300'
              }`}
            />
          </div>
        </div>

        {startDate > endDate && (
          <p className="text-[10px] font-bold text-rose-500 text-center animate-pulse">
            Start date must be before or equal to end date.
          </p>
        )}

        {recentReports.length > 0 && (
          <div className="pt-4 border-t border-pink-50">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Recently Generated</h4>
            <div className="flex flex-wrap gap-2">
              {recentReports.map(report => (
                <button
                  key={report.id}
                  onClick={() => {
                    setStartDate(report.start);
                    setEndDate(report.end);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    startDate === report.start && endDate === report.end
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                  }`}
                >
                  {new Date(report.start).toLocaleDateString()} - {new Date(report.end).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date(profile.dueDate);
              start.setMonth(start.getMonth() - 9);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 transition-colors"
          >
            Full Journey
          </button>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={startDate > endDate}
          className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
            startDate > endDate 
              ? 'bg-slate-200 cursor-not-allowed shadow-none' 
              : 'bg-pink-500 shadow-pink-200 hover:bg-pink-600'
          }`}
        >
          <Download size={20} />
          Generate PDF Report
        </button>
      </div>

      {/* Hidden Report Content for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={reportRef} className="bg-white text-slate-800 font-sans p-10" style={{ width: '800px', margin: '0 auto' }}>
          
          {/* HEADER */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Baby size={40} />
              </div>
            </div>
            <h1 className="text-4xl font-serif font-bold text-rose-800 tracking-tight">Nestly Health Report</h1>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-600">Prepared for {profile.userName}</p>
              <p className="text-sm font-medium text-slate-400">
                Period: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-300">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* EXECUTIVE SUMMARY */}
            <Section title="Executive Summary" icon={Sparkles} color="amber">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-pink-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Activities</div>
                  <div className="text-2xl font-black text-pink-600">
                    {filteredData.feeding.length + filteredData.sleep.length + filteredData.diaper.length + filteredData.kicks.length}
                  </div>
                </div>
                <div className="text-center p-4 bg-rose-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Health Logs</div>
                  <div className="text-2xl font-black text-rose-600">
                    {filteredData.health.length + filteredData.bp.length + filteredData.meds.length}
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Journal</div>
                  <div className="text-2xl font-black text-amber-600">{filteredData.journal.length}</div>
                </div>
              </div>
            </Section>

            {/* MATERNAL HEALTH */}
            <Section title="Maternal Wellness" icon={Heart} color="rose">
              <div className="space-y-6">
                {filteredData.bp.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Blood Pressure</h4>
                    {filteredData.bp.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={`${log.systolic}/${log.diastolic} mmHg`} 
                        value={log.pulse ? `${log.pulse} bpm` : ""} 
                        subValue={new Date(log.timestamp).toLocaleString()} 
                      />
                    ))}
                  </div>
                )}
                {filteredData.weight.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Weight Tracking</h4>
                    {filteredData.weight.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={`${log.weight} kg`} 
                        value="" 
                        subValue={new Date(log.timestamp).toLocaleString()} 
                      />
                    ))}
                  </div>
                )}
                {filteredData.symptoms.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Symptoms</h4>
                    {filteredData.symptoms.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={log.type} 
                        value={`Severity: ${log.severity}/5`} 
                        subValue={new Date(log.timestamp).toLocaleString()} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* BABY TRACKING */}
            <Section title="Baby Tracking" icon={Baby} color="pink">
              <div className="space-y-6">
                {filteredData.feeding.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Feeding</h4>
                    {filteredData.feeding.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={log.type} 
                        value={log.amount ? `${log.amount}ml` : log.duration ? `${log.duration}m` : 'Logged'} 
                        subValue={new Date(log.timestamp).toLocaleString()} 
                      />
                    ))}
                  </div>
                )}
                {filteredData.sleep.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Sleep</h4>
                    {filteredData.sleep.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={log.type} 
                        value={`${log.hours}h`} 
                        subValue={new Date(log.timestamp).toLocaleString()} 
                      />
                    ))}
                  </div>
                )}
                {filteredData.growth.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Growth</h4>
                    {filteredData.growth.map(log => (
                      <DataRow 
                        key={log.id} 
                        label={`${log.weight}kg / ${log.height}cm`} 
                        value="" 
                        subValue={new Date(log.timestamp).toLocaleDateString()} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* MILESTONES & JOURNAL */}
            {(filteredData.milestones.length > 0 || filteredData.journal.length > 0) && (
              <Section title="Milestones & Journal" icon={Trophy} color="amber">
                <div className="space-y-6">
                  {filteredData.milestones.map(m => (
                    <div key={m.id} className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                      <div className="text-sm font-bold text-slate-800">{m.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(m.timestamp).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {filteredData.journal.map(entry => (
                    <div key={entry.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-sm font-bold text-slate-800 mb-1">{entry.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium mb-2">{new Date(entry.timestamp).toLocaleDateString()}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{entry.content}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* FOOTER */}
            <div className="mt-20 pt-8 border-t border-slate-100 text-center space-y-4">
              <div className="flex justify-center gap-4 text-slate-300">
                <Baby size={24} />
                <Milk size={24} />
                <Heart size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
                Medical Disclaimer: This report is for informational purposes only and does not constitute medical advice. 
                Always consult with a healthcare professional for medical concerns.
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-300">
                Generated by Nestly • nestlyapp.com • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
