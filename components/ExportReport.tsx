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
    
    const opt: any = {
      margin:       [10, 10, 10, 10],
      filename:     `nestly-report-${startDate}-to-${endDate}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(reportRef.current).save();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif text-rose-800">Comprehensive Health Report</h3>
          <p className="text-xs text-slate-400 font-medium">Select a date range to generate your personalized report.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Start Date</label>
            <input 
              type="date"
              value={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">End Date</label>
            <input 
              type="date"
              value={endDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Download size={20} />
          Generate PDF Report
        </button>
      </div>

      {/* Hidden Report Content for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={reportRef} className="p-10 bg-white text-slate-800 font-sans" style={{ width: '800px' }}>
          
          {/* PAGE 1: COVER & SUMMARY */}
          <div className="min-h-[1000px] flex flex-col">
            <div className="relative mb-12 overflow-hidden rounded-[3rem] bg-gradient-to-br from-pink-500 to-rose-400 p-16 text-white shadow-2xl text-center">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
              
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-2 text-[12px] font-black uppercase tracking-[0.4em] backdrop-blur-md">
                  Nestly Health Analytics
                </div>
                <h1 className="text-6xl font-serif font-bold tracking-tight">Health & Wellness Report</h1>
                
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="text-2xl font-serif italic text-pink-100">Prepared for</div>
                  <div className="text-4xl font-bold">{profile.userName}</div>
                  {profile.babies && profile.babies.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-black uppercase tracking-widest text-pink-200">Baby Information</div>
                      <div className="text-2xl font-bold">{profile.babies.map(b => b.name).join(' & ')}</div>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-white/20 flex justify-center gap-12">
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-pink-200 mb-1">Report Period</div>
                    <div className="text-lg font-bold">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-pink-200 mb-1">Generated On</div>
                    <div className="text-lg font-bold">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="rounded-[2.5rem] bg-pink-50 p-8 border border-pink-100 text-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-pink-500">
                  <Activity size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Activities</div>
                <div className="text-4xl font-black text-pink-600">
                  {filteredData.feeding.length + filteredData.sleep.length + filteredData.diaper.length + filteredData.kicks.length}
                </div>
              </div>
              <div className="rounded-[2.5rem] bg-rose-50 p-8 border border-rose-100 text-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-rose-500">
                  <Heart size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Health Logs</div>
                <div className="text-4xl font-black text-rose-600">
                  {filteredData.health.length + filteredData.bp.length + filteredData.meds.length}
                </div>
              </div>
              <div className="rounded-[2.5rem] bg-pink-50 p-8 border border-pink-100 text-center">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-pink-500">
                  <Sparkles size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Journal Entries</div>
                <div className="text-4xl font-black text-pink-600">
                  {filteredData.journal.length}
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-[3rem] bg-slate-50 p-12 border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-slate-800 mb-8 flex items-center gap-3">
                <Sparkles className="text-amber-500" />
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Maternal Wellness</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Symptoms Tracked</span>
                        <span className="font-bold">{filteredData.symptoms.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Vitamins Taken</span>
                        <span className="font-bold">{filteredData.vitamins.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Weight Entries</span>
                        <span className="font-bold">{filteredData.weight.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Baby Development</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Milestones Reached</span>
                        <span className="font-bold">{filteredData.milestones.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Growth Measurements</span>
                        <span className="font-bold">{filteredData.growth.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Kick Sessions</span>
                        <span className="font-bold">{filteredData.kicks.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 2: DAILY LOGS & ACTIVITIES */}
          <div className="min-h-[1000px] pt-20" style={{ pageBreakBefore: 'always' }}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nestly Health Report</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {profile.userName} {profile.babies && profile.babies.length > 0 ? `• Baby: ${profile.babies.map(b => b.name).join(', ')}` : ''} • {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Daily Activity Logs</h2>
              <div className="w-24 h-1 bg-pink-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                  <Milk className="text-pink-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Feeding History</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.feeding.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-pink-600">{log.amount ? `${log.amount}ml` : log.duration ? `${log.duration}m` : 'Logged'}</div>
                      </div>
                    </div>
                  ))}
                  {filteredData.feeding.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                  <Moon className="text-pink-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Sleep Patterns</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.sleep.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-pink-600">{log.hours} Hours</div>
                      </div>
                    </div>
                  ))}
                  {filteredData.sleep.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-cyan-100 pb-2">
                  <Droplets className="text-cyan-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Diaper Logs</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.diaper.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-cyan-50/30 rounded-2xl border border-cyan-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {filteredData.diaper.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>


            </div>

            <div className="mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-amber-100 pb-2">
                  <Utensils className="text-amber-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Nutrition & Food Log</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {filteredData.nutrition.map((log, idx) => (
                    <div key={idx} className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-bold text-slate-700">{log.name}</div>
                        <div className="text-[10px] font-black text-amber-600">{log.calories} kcal</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mb-2">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>P: {log.protein}g</span>
                        <span>C: {log.carbs}g</span>
                        <span>F: {log.fat}g</span>
                      </div>
                    </div>
                  ))}
                  {filteredData.nutrition.length === 0 && <div className="text-sm text-slate-400 italic col-span-2 text-center">No nutrition logs for this period.</div>}
                </div>
              </section>
            </div>
          </div>

          {/* PAGE 3: HEALTH & VITALS */}
          <div className="min-h-[1000px] pt-20" style={{ pageBreakBefore: 'always' }}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nestly Health Report</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {profile.userName} {profile.babies && profile.babies.length > 0 ? `• Baby: ${profile.babies.map(b => b.name).join(', ')}` : ''} • {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Health & Vitals</h2>
              <div className="w-24 h-1 bg-pink-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-200 pb-2">
                  <Heart className="text-pink-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Blood Pressure</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.bp.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">{log.systolic} / {log.diastolic} mmHg</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      {log.pulse && <div className="text-sm font-black text-pink-600">{log.pulse} bpm</div>}
                    </div>
                  ))}
                  {filteredData.bp.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-teal-100 pb-2">
                  <Pill className="text-teal-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Medications</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.meds.map(log => (
                    <div key={log.id} className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50">
                      <div className="text-sm font-bold text-slate-700">{log.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-xs text-teal-600 mt-1">{log.dosage}</div>
                    </div>
                  ))}
                  {filteredData.meds.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-amber-100 pb-2">
                  <Zap className="text-amber-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Symptoms Tracked</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.symptoms.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < log.severity ? 'bg-amber-400' : 'bg-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredData.symptoms.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-emerald-100 pb-2">
                  <Utensils className="text-emerald-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Vitamins & Supplements</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.vitamins.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">{log.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <Check className="text-emerald-500" size={16} />
                    </div>
                  ))}
                  {filteredData.vitamins.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>
            </div>

            <div className="mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                  <Activity className="text-pink-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Contractions Log</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {filteredData.contractions.map(log => (
                    <div key={log.id} className="p-4 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.startTime).toLocaleString()}</div>
                        <div className="text-sm font-black text-pink-600">{Math.floor(log.duration / 1000)}s</div>
                      </div>
                      {log.interval && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Interval: {Math.floor(log.interval / 60000)}m {Math.floor((log.interval % 60000) / 1000)}s
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredData.contractions.length === 0 && <div className="text-sm text-slate-400 italic col-span-2 text-center">No contractions logged for this period.</div>}
                </div>
              </section>
            </div>

            <div className="mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                  <Activity className="text-pink-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Kegel Exercises</h2>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {filteredData.kegels.map((log, idx) => (
                    <div key={idx} className="p-6 bg-pink-50/50 rounded-[2rem] border border-pink-100 text-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-pink-500">
                        <Zap size={20} />
                      </div>
                      <div className="text-sm font-bold text-slate-800 mb-1">{log.duration}s</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {filteredData.kegels.length === 0 && <div className="text-sm text-slate-400 col-span-3 italic text-center">No Kegel sessions logged for this period.</div>}
                </div>
              </section>
            </div>
          </div>

          {/* PAGE 4: DEVELOPMENT & MILESTONES */}
          <div className="min-h-[1000px] pt-20" style={{ pageBreakBefore: 'always' }}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nestly Health Report</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {profile.userName} {profile.babies && profile.babies.length > 0 ? `• Baby: ${profile.babies.map(b => b.name).join(', ')}` : ''} • {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Development & Milestones</h2>
              <div className="w-24 h-1 bg-pink-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                <Trophy className="text-pink-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Milestones Reached</h2>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {filteredData.milestones.map(m => (
                  <div key={m.id} className="p-6 bg-pink-50/50 rounded-[2rem] border border-pink-100 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-pink-500">
                      <Baby size={24} />
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">{m.title}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{new Date(m.timestamp).toLocaleDateString()}</div>
                  </div>
                ))}
                {filteredData.milestones.length === 0 && <div className="text-sm text-slate-400 col-span-3 italic text-center">No milestones for this period.</div>}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-blue-100 pb-2">
                  <Ruler className="text-blue-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Growth Progress</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.growth.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Weight</div>
                          <div className="text-sm font-black text-blue-600">{log.weight} kg</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Height</div>
                          <div className="text-sm font-black text-blue-600">{log.height} cm</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredData.growth.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-yellow-100 pb-2">
                  <Smile className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Reactions & Responses</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.reactions.map(log => (
                    <div key={log.id} className="p-4 bg-yellow-50/30 rounded-2xl border border-yellow-100/50">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[9px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-100 px-2 py-0.5 rounded-full">{log.reaction}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                      {log.notes && <div className="text-xs text-slate-600 italic">"{log.notes}"</div>}
                    </div>
                  ))}
                  {filteredData.reactions.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-fuchsia-100 pb-2">
                  <ActivityIcon className="text-fuchsia-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Kick Counts</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.kicks.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-fuchsia-50/30 rounded-2xl border border-fuchsia-100/50">
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-sm font-black text-fuchsia-600">{log.count} kicks</div>
                    </div>
                  ))}
                  {filteredData.kicks.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-orange-100 pb-2">
                  <Activity className="text-orange-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Tummy Time</h2>
                </div>
                <div className="space-y-4">
                  {filteredData.tummyTime.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50">
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-sm font-black text-orange-600">{Math.floor(log.duration / 60)}m {log.duration % 60}s</div>
                    </div>
                  ))}
                  {filteredData.tummyTime.length === 0 && <div className="text-sm text-slate-400 italic">No logs for this period.</div>}
                </div>
              </section>
            </div>
          </div>

          {/* PAGE 5: NUTRITION & SUPPLEMENTS */}
          <div className="min-h-[1000px] pt-20" style={{ pageBreakBefore: 'always' }}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nestly Health Report</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {profile.userName} {profile.babies && profile.babies.length > 0 ? `• Baby: ${profile.babies.map(b => b.name).join(', ')}` : ''} • {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Nutrition & Supplements</h2>
              <div className="w-24 h-1 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-emerald-100 pb-2">
                <Utensils className="text-emerald-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Food Log</h2>
              </div>
              <div className="space-y-4">
                {filteredData.nutrition.map(entry => (
                  <div key={entry.id} className="p-6 bg-emerald-50/30 rounded-[2rem] border border-emerald-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-bold text-slate-700">{entry.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Cals</div>
                        <div className="text-xs font-bold text-emerald-600">{entry.calories}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Protein</div>
                        <div className="text-xs font-bold text-emerald-600">{entry.protein}g</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Folate</div>
                        <div className="text-xs font-bold text-emerald-600">{entry.folate}mcg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Iron</div>
                        <div className="text-xs font-bold text-emerald-600">{entry.iron}mg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Calcium</div>
                        <div className="text-xs font-bold text-emerald-600">{entry.calcium}mg</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredData.nutrition.length === 0 && <div className="text-sm text-slate-400 italic text-center py-8">No food entries for this period.</div>}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6 border-b-2 border-indigo-100 pb-2">
                <Pill className="text-indigo-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Vitamins & Supplements</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {filteredData.vitamins.map(v => (
                  <div key={v.id} className="p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-700">{v.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(v.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {filteredData.vitamins.length === 0 && <div className="text-sm text-slate-400 col-span-2 italic text-center py-8">No vitamins logged for this period.</div>}
              </div>
            </section>
          </div>

          {/* PAGE 6: NOTES & APPOINTMENTS */}
          <div className="min-h-[1000px] pt-20" style={{ pageBreakBefore: 'always' }}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nestly Health Report</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {profile.userName} {profile.babies && profile.babies.length > 0 ? `• Baby: ${profile.babies.map(b => b.name).join(', ')}` : ''} • {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Notes & Appointments</h2>
              <div className="w-24 h-1 bg-pink-500 mx-auto mt-4 rounded-full"></div>
            </div>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-pink-100 pb-2">
                <Calendar className="text-pink-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Upcoming & Past Appointments</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {filteredData.events.map(event => (
                  <div key={event.id} className="p-6 bg-pink-50/30 rounded-[2rem] border border-pink-100/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-bold text-slate-700">{event.title}</div>
                      <div className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest">{event.type}</div>
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                    </div>
                  </div>
                ))}
                {filteredData.events.length === 0 && <div className="text-sm text-slate-400 col-span-2 italic text-center">No appointments for this period.</div>}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-2">
                <FileText className="text-slate-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Journal & Parental Notes</h2>
              </div>
              <div className="space-y-6">
                {filteredData.journal.map(log => (
                  <div key={log.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <div className="text-lg text-slate-700 mb-4 leading-relaxed italic">"{log.content}"</div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                      <div className="text-xs text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      {log.mood && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200">
                          <Smile size={14} className="text-rose-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{log.mood}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredData.journal.length === 0 && <div className="text-sm text-slate-400 italic text-center py-12">No journal entries for this period.</div>}
              </div>
            </section>

            {/* Footer on Last Page */}
            <div className="mt-auto pt-12 border-t-2 border-slate-100 text-center space-y-4">
              <div className="flex justify-center gap-8 text-slate-300">
                <Heart size={32} />
                <Baby size={32} />
                <Milk size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400">
                This report was generated by Nestly. All data is stored securely and provided for informational purposes.
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">
                nestlyapp.com • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
