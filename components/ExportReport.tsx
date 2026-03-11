import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, Baby, Ruler, Milk, Moon, Droplets, Stethoscope, Activity, Heart, FileText, Calendar, Trophy, Pill, Activity as ActivityIcon } from 'lucide-react';
import { PregnancyProfile, FeedingLog, SleepLog, DiaperLog, BabyGrowthLog, MilestoneLog, HealthLog, TummyTimeLog, JournalEntry, KickLog, ReactionLog, CalendarEvent, BloodPressureLog, MedicationLog, WeightLog } from '../types.ts';

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
  weightLogs
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!reportRef.current) return;
    
    const opt: any = {
      margin:       10,
      filename:     'nestly-comprehensive-report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(reportRef.current).save();
  };

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
          {/* Decorative Header */}
          <div className="relative mb-12 overflow-hidden rounded-[3rem] bg-gradient-to-br from-rose-500 to-indigo-600 p-12 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                  Official Health Report
                </div>
                <h1 className="text-5xl font-serif font-bold tracking-tight">Nestly Baby Report</h1>
                <div className="flex items-center gap-6 text-rose-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="text-sm font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <div className="text-3xl font-serif italic text-white/90">{profile.userName}'s Journey</div>
                {profile.babies && profile.babies.length > 0 && (
                  <div className="inline-block rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/20">
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Baby Name</div>
                    <div className="text-xl font-bold">{profile.babies.map(b => b.name).join(' & ')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Feedings</div>
              <div className="text-3xl font-black text-rose-600">{feedingLogs.length}</div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sleep Entries</div>
              <div className="text-3xl font-black text-indigo-600">{sleepLogs.length}</div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Milestones</div>
              <div className="text-3xl font-black text-amber-600">{milestones.length}</div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Health Logs</div>
              <div className="text-3xl font-black text-emerald-600">{healthLogs.length}</div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Feeding & Sleep */}
            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-rose-100 pb-2">
                  <Milk className="text-rose-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Feeding History</h2>
                </div>
                <div className="space-y-4">
                  {feedingLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">{log.amount ? `${log.amount}ml` : log.duration ? `${log.duration}m` : 'Logged'}</div>
                        {log.side && <div className="text-[9px] uppercase font-black text-rose-300 tracking-widest">{log.side}</div>}
                      </div>
                    </div>
                  ))}
                  {feedingLogs.length === 0 && <div className="text-sm text-slate-400">No feeding logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-indigo-100 pb-2">
                  <Moon className="text-indigo-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Sleep Patterns</h2>
                </div>
                <div className="space-y-4">
                  {sleepLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-indigo-600">{log.hours} Hours</div>
                        <div className="flex gap-1 justify-end mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < log.quality ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sleepLogs.length === 0 && <div className="text-sm text-slate-400">No sleep logs recorded.</div>}
                </div>
              </section>
            </div>

            {/* Health & Growth */}
            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-emerald-100 pb-2">
                  <Stethoscope className="text-emerald-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Health Records</h2>
                </div>
                <div className="space-y-4">
                  {healthLogs.map(log => (
                    <div key={log.id} className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${log.status === 'normal' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {log.status}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 italic mb-1">"{log.notes || log.value}"</div>
                      <div className="text-[9px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                  {healthLogs.length === 0 && <div className="text-sm text-slate-400">No health logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-blue-100 pb-2">
                  <Ruler className="text-blue-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Growth Tracking</h2>
                </div>
                <div className="space-y-4">
                  {babyGrowthLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                      </div>
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
                  {babyGrowthLogs.length === 0 && <div className="text-sm text-slate-400">No growth logs recorded.</div>}
                </div>

                <div className="flex items-center gap-3 mb-6 mt-8 border-b-2 border-slate-200 pb-2">
                  <ActivityIcon className="text-slate-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Maternal Weight</h2>
                </div>
                <div className="space-y-4">
                  {weightLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-sm font-black text-slate-700">{log.weight} kg</div>
                    </div>
                  ))}
                  {weightLogs.length === 0 && <div className="text-sm text-slate-400">No maternal weight logs recorded.</div>}
                </div>
              </section>
            </div>

            {/* Tummy Time & Journal */}
            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-orange-100 pb-2">
                  <Activity className="text-orange-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Tummy Time</h2>
                </div>
                <div className="space-y-4">
                  {tummyTimeLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-sm font-black text-orange-600">{Math.floor(log.duration / 60)}m {log.duration % 60}s</div>
                    </div>
                  ))}
                  {tummyTimeLogs.length === 0 && <div className="text-sm text-slate-400">No tummy time logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-2">
                  <FileText className="text-slate-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Parental Notes</h2>
                </div>
                <div className="space-y-4">
                  {journalEntries.map(log => (
                    <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-xs text-slate-700 mb-2">{log.content}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-[9px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                        {log.mood && <div className="text-[10px] font-bold text-rose-400 capitalize">{log.mood}</div>}
                      </div>
                    </div>
                  ))}
                  {journalEntries.length === 0 && <div className="text-sm text-slate-400">No journal entries recorded.</div>}
                </div>
              </section>
            </div>

            {/* Milestones Full Width */}
            <section>
              <div className="flex items-center gap-3 mb-6 border-b-2 border-amber-100 pb-2">
                <Trophy className="text-amber-500" size={24} />
                <h2 className="text-xl font-serif font-bold text-slate-800">Milestones & Achievements</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {milestones.map(m => (
                  <div key={m.id} className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100 text-center" style={{ pageBreakInside: 'avoid' }}>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-amber-500">
                      <Baby size={24} />
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">{m.title}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{new Date(m.timestamp).toLocaleDateString()}</div>
                  </div>
                ))}
                {milestones.length === 0 && <div className="text-sm text-slate-400 col-span-3">No milestones recorded.</div>}
              </div>
            </section>

            {/* Additional Logs */}
            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-cyan-100 pb-2">
                  <Droplets className="text-cyan-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Diaper Logs</h2>
                </div>
                <div className="space-y-4">
                  {diaperLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-cyan-50/30 rounded-2xl border border-cyan-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                        <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      {log.notes && <div className="text-xs text-slate-500">{log.notes}</div>}
                    </div>
                  ))}
                  {diaperLogs.length === 0 && <div className="text-sm text-slate-400">No diaper logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-purple-100 pb-2">
                  <Calendar className="text-purple-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Appointments</h2>
                </div>
                <div className="space-y-4">
                  {calendarEvents.map(event => (
                    <div key={event.id} className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-sm font-bold text-slate-700">{event.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                      </div>
                      <div className="text-xs text-purple-600 capitalize mt-1">{event.type}</div>
                    </div>
                  ))}
                  {calendarEvents.length === 0 && <div className="text-sm text-slate-400">No appointments recorded.</div>}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-rose-200 pb-2">
                  <Heart className="text-rose-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Blood Pressure</h2>
                </div>
                <div className="space-y-4">
                  {bloodPressureLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                        <div className="text-sm font-bold text-slate-700">{log.systolic} / {log.diastolic} mmHg</div>
                        <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      {log.pulse && <div className="text-sm font-black text-rose-600">{log.pulse} bpm</div>}
                    </div>
                  ))}
                  {bloodPressureLogs.length === 0 && <div className="text-sm text-slate-400">No blood pressure logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-teal-100 pb-2">
                  <Pill className="text-teal-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Medications</h2>
                </div>
                <div className="space-y-4">
                  {medicationLogs.map(log => (
                    <div key={log.id} className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-sm font-bold text-slate-700">{log.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-xs text-teal-600 mt-1">{log.dosage} - {log.frequency}</div>
                    </div>
                  ))}
                  {medicationLogs.length === 0 && <div className="text-sm text-slate-400">No medications recorded.</div>}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-fuchsia-100 pb-2">
                  <ActivityIcon className="text-fuchsia-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Kick Counts</h2>
                </div>
                <div className="space-y-4">
                  {kickLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-4 bg-fuchsia-50/30 rounded-2xl border border-fuchsia-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      <div className="text-sm font-black text-fuchsia-600">{log.count} kicks in {Math.floor(log.duration / 60)}m</div>
                    </div>
                  ))}
                  {kickLogs.length === 0 && <div className="text-sm text-slate-400">No kick logs recorded.</div>}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-yellow-100 pb-2">
                  <ActivityIcon className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-serif font-bold text-slate-800">Reactions</h2>
                </div>
                <div className="space-y-4">
                  {reactions.map(log => (
                    <div key={log.id} className="p-4 bg-yellow-50/30 rounded-2xl border border-yellow-100/50" style={{ pageBreakInside: 'avoid' }}>
                      <div className="text-sm font-bold text-slate-700 capitalize">{log.type}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                      {log.notes && <div className="text-xs text-slate-600 mt-1">{log.notes}</div>}
                    </div>
                  ))}
                  {reactions.length === 0 && <div className="text-sm text-slate-400">No reactions recorded.</div>}
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-24 pt-12 border-t-2 border-slate-100 text-center space-y-4">
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
  );
};
