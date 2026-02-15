import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  SymptomLog, 
  Contraction, 
  JournalEntry, 
  CalendarEvent, 
  WeightLog, 
  SleepLog,
  Trimester,
  PregnancyProfile,
  MemoryPhoto,
  MemoryAlbums
} from '../types.ts';
import { storage } from '../services/storageService.ts';
import { ReportCenter } from './ReportCenter.tsx';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface ToolsHubProps {
  symptoms: SymptomLog[];
  onLogSymptom: (type: string, severity: number) => void;
  contractions: Contraction[];
  onUpdateContractions: (logs: Contraction[]) => void;
  journalEntries: JournalEntry[];
  onAddJournal: (content: string, mood?: string) => void;
  onRemoveJournal: (id: string) => void;
  calendarEvents: CalendarEvent[];
  onAddEvent: (title: string, date: string, type: CalendarEvent['type']) => void;
  onRemoveEvent: (id: string) => void;
  weightLogs: WeightLog[];
  onAddWeight: (weight: number) => void;
  sleepLogs: SleepLog[];
  onAddSleep: (hours: number, quality: SleepLog['quality']) => void;
  onRemoveSleep: (id: string) => void;
  trimester: Trimester;
  profile: PregnancyProfile;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const ToolsHub: React.FC<ToolsHubProps> = ({ 
  symptoms, onLogSymptom, contractions, onUpdateContractions, 
  journalEntries, onAddJournal, onRemoveJournal, calendarEvents, onAddEvent, onRemoveEvent,
  weightLogs, onAddWeight, sleepLogs, onAddSleep, onRemoveSleep, trimester, profile,
  activeCategory, setActiveCategory
}) => {
  const [weightInput, setWeightInput] = useState('');
  const [sleepHours, setSleepHours] = useState('8');
  const [sleepQuality, setSleepQuality] = useState<SleepLog['quality']>('good');
  
  // Kegels
  const [isKegelActive, setIsKegelActive] = useState(false);
  const [kegelTimer, setKegelTimer] = useState(0);
  const kegelInterval = useRef<number | null>(null);

  // Journal
  const [journalInput, setJournalInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('✨');

  // Labor / Contractions
  const [isContractionActive, setIsContractionActive] = useState(false);
  const [currentContractionStart, setCurrentContractionStart] = useState<number | null>(null);

  // Albums
  const [albums, setAlbums] = useState<MemoryAlbums>(profile.albums || { ultrasound: [], family: [], favorites: [] });

  const handleWeightLog = () => {
    if (weightInput) {
      onAddWeight(parseFloat(weightInput));
      setWeightInput('');
    }
  };

  const handleSleepLog = () => {
    const hrs = parseFloat(sleepHours);
    if (!isNaN(hrs)) {
      onAddSleep(hrs, sleepQuality);
    }
  };

  const startKegel = () => {
    setIsKegelActive(true);
    setKegelTimer(0);
    kegelInterval.current = window.setInterval(() => setKegelTimer(v => v + 1), 1000);
  };
  const stopKegel = () => {
    setIsKegelActive(false);
    if (kegelInterval.current) clearInterval(kegelInterval.current);
  };

  const handleAddPhoto = (type: keyof MemoryAlbums) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto: MemoryPhoto = { id: Date.now().toString(), url: reader.result as string, timestamp: Date.now() };
          const updated = { ...albums, [type]: [newPhoto, ...albums[type]] };
          setAlbums(updated);
          storage.saveAlbums(updated);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const weightChartData = useMemo(() => {
    return weightLogs.slice().reverse().map(l => ({
      val: l.weight,
      date: new Date(l.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [weightLogs]);

  // Labor Logic
  const handleContractionToggle = () => {
    const now = Date.now();
    if (!isContractionActive) {
      setIsContractionActive(true);
      setCurrentContractionStart(now);
    } else {
      if (currentContractionStart) {
        const duration = now - currentContractionStart;
        const last = contractions[0];
        const interval = last ? currentContractionStart - last.startTime : undefined;
        
        const newLog: Contraction = {
          id: now.toString(),
          startTime: currentContractionStart,
          endTime: now,
          duration,
          interval
        };
        onUpdateContractions([newLog, ...contractions]);
      }
      setIsContractionActive(false);
      setCurrentContractionStart(null);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // Trimester Progress Data
  const progressWeeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }, [profile]);
  const progressMonths = Math.floor(progressWeeks / 4.3);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 sticky top-0 z-50 bg-[#fffaf9]/90 backdrop-blur-md">
        {['vitals', 'sleep', 'memories', 'kegels', 'progress', 'journal', 'labor', 'reports'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-none px-6 py-3 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest ${activeCategory === cat ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-gray-400'}`}>{cat}</button>
        ))}
      </div>

      {activeCategory === 'reports' && <ReportCenter />}

      {activeCategory === 'vitals' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card-premium p-8 bg-white space-y-6 shadow-sm border-2 border-white">
            <h3 className="text-xl font-serif text-rose-800">Weight Tracker</h3>
            <div className="flex gap-3">
              <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="Current weight (kg)" className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold" />
              <button onClick={handleWeightLog} className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Log</button>
            </div>
            
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
          </div>
        </div>
      )}

      {activeCategory === 'sleep' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card-premium p-8 bg-white space-y-8 shadow-sm border-2 border-white">
            <div className="space-y-2">
              <h3 className="text-xl font-serif text-rose-800">Restful Nights</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Track your sleep quality and duration</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-600">Hours Rested</span>
                <input 
                  type="number" 
                  value={sleepHours} 
                  onChange={e => setSleepHours(e.target.value)}
                  className="w-20 bg-white border-none text-right font-serif text-xl p-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['poor', 'average', 'good'] as const).map(q => (
                  <button 
                    key={q}
                    onClick={() => setSleepQuality(q)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${sleepQuality === q ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-50 opacity-60'}`}
                  >
                    <span className="text-2xl">{q === 'poor' ? '😫' : q === 'average' ? '😐' : '😴'}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">{q}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSleepLog}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all"
              >
                Log Sleep Session
              </button>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recent Logs</h4>
              {sleepLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{log.quality === 'poor' ? '😫' : log.quality === 'average' ? '😐' : '😴'}</span>
                    <span className="text-sm font-bold text-slate-700">{log.hours} Hours</span>
                  </div>
                  <button 
                    onClick={() => onRemoveSleep(log.id)}
                    className="text-[8px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'progress' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="card-premium p-10 bg-white space-y-12 text-center border-2 border-white">
              <div className="space-y-2">
                 <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em]">Journey Progress</h3>
                 <div className="text-4xl font-serif text-slate-900">Month {progressMonths + 1} / Week {progressWeeks}</div>
              </div>

              <div className="space-y-6">
                 {/* Trimester Timeline */}
                 <div className="relative pt-6">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-300 tracking-widest mb-4">
                       <span>Tri 1</span>
                       <span>Tri 2</span>
                       <span>Tri 3</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full flex overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${progressWeeks < 13 ? 'bg-rose-500' : 'bg-rose-200'}`} style={{ width: '33.3%' }} />
                       <div className={`h-full transition-all duration-1000 ${progressWeeks >= 13 && progressWeeks < 27 ? 'bg-rose-500' : progressWeeks >= 27 ? 'bg-rose-200' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                       <div className={`h-full transition-all duration-1000 ${progressWeeks >= 27 ? 'bg-rose-500' : 'bg-slate-100'}`} style={{ width: '33.3%' }} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-rose-50 rounded-[2rem] border-2 border-white">
                       <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Time Lapsed</span>
                       <div className="text-2xl font-bold text-rose-900">{Math.round((progressWeeks / 40) * 100)}%</div>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-white">
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Weeks Left</span>
                       <div className="text-2xl font-bold text-emerald-900">{40 - progressWeeks}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeCategory === 'kegels' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="card-premium p-12 bg-white space-y-8 text-center border-2 border-white">
              <div className="space-y-2">
                 <h3 className="text-xl font-serif text-rose-800">Kegel Trainer</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Press and hold to contract.<br/>Release to rest.</p>
              </div>

              <button 
                onMouseDown={startKegel} 
                onMouseUp={stopKegel} 
                onTouchStart={startKegel} 
                onTouchEnd={stopKegel} 
                className={`w-52 h-52 mx-auto rounded-full transition-all duration-300 flex flex-col items-center justify-center gap-2 border-[12px] shadow-2xl active:scale-95 ${isKegelActive ? 'bg-rose-500 border-rose-200 scale-105 shadow-rose-200' : 'bg-white border-slate-50 text-rose-500 shadow-slate-100'}`}
              >
                 {isKegelActive ? (
                   <>
                    <span className="text-4xl tabular-nums font-mono font-black">{kegelTimer}s</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Contracting...</span>
                   </>
                 ) : (
                   <>
                    <span className="text-4xl">🌸</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Press & Hold</span>
                   </>
                 )}
              </button>
           </div>
        </div>
      )}

      {activeCategory === 'memories' && (
        <div className="space-y-10 animate-in fade-in">
           {(['ultrasound', 'family', 'favorites'] as const).map(type => (
             <div key={type} className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-sm font-serif text-slate-900 capitalize">{type} Album</h3>
                   <button onClick={() => handleAddPhoto(type)} className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">+</button>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
                   {albums[type].length > 0 ? albums[type].map(p => (
                     <div key={p.id} className="flex-none w-48 h-60 bg-white p-2.5 rounded-3xl border-2 border-white shadow-xl rotate-[2deg] group">
                        <img src={p.url} className="w-full h-full object-cover rounded-2xl" />
                     </div>
                   )) : (
                     <div className="flex-none w-full py-12 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                        <p className="text-xs text-slate-300 italic">No memories here yet...</p>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      )}

      {activeCategory === 'journal' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
              <h3 className="text-xl font-serif text-rose-800">Mama's Reflections</h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                 {['✨', '🌸', '😴', '🤰', '🤍', '🍰', '💪'].map(m => (
                   <button 
                    key={m} 
                    onClick={() => setSelectedMood(m)}
                    className={`flex-none w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${selectedMood === m ? 'bg-rose-500 shadow-md scale-110' : 'bg-slate-50'}`}
                   >
                    {m}
                   </button>
                 ))}
              </div>
              <textarea 
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="How are you feeling today, Mama?"
                className="w-full h-32 bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-medium resize-none focus:bg-white transition-all shadow-inner"
              />
              <button 
                onClick={() => { if(journalInput) { onAddJournal(journalInput, selectedMood); setJournalInput(''); } }}
                className="w-full py-5 bg-[#7e1631] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
              >
                Save Reflection
              </button>
           </div>

           <div className="space-y-4">
              {journalEntries.map(entry => (
                <div key={entry.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex gap-4 items-start">
                   <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-xl shrink-0">{entry.mood || '📝'}</div>
                   <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => onRemoveJournal(entry.id)} className="text-[10px] text-rose-300 hover:text-rose-500 font-bold">Delete</button>
                      </div>
                      <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{entry.content}"</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeCategory === 'labor' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="card-premium p-10 bg-white border-2 border-white text-center space-y-8">
              <div className="space-y-1">
                 <h3 className="text-xl font-serif text-rose-800">Contraction Timer</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tap when it starts, tap when it ends.</p>
              </div>

              <button 
                onClick={handleContractionToggle}
                className={`w-56 h-56 mx-auto rounded-[4rem] flex flex-col items-center justify-center gap-2 transition-all duration-500 shadow-2xl border-8 ${isContractionActive ? 'bg-rose-500 border-rose-200 animate-pulse scale-105' : 'bg-slate-900 border-slate-700'}`}
              >
                 <span className="text-white text-4xl">{isContractionActive ? '⏹️' : '▶️'}</span>
                 <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{isContractionActive ? 'Stop' : 'Start'}</span>
              </button>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Duration</span>
                    <div className="text-lg font-bold text-rose-900">{formatDuration(contractions[0]?.duration)}</div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Frequency</span>
                    <div className="text-lg font-bold text-slate-900">{formatDuration(contractions[0]?.interval)}</div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labor History</h4>
              {contractions.map(c => (
                <div key={c.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex justify-between items-center">
                   <div className="space-y-1">
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(c.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-sm font-bold text-slate-900">Duration: {formatDuration(c.duration)}</div>
                   </div>
                   <div className="text-right space-y-1">
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Interval</span>
                      <div className="text-sm font-black text-rose-600">{formatDuration(c.interval)}</div>
                   </div>
                </div>
              ))}
           </div>

           <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-5">
              <span className="text-3xl">⚠️</span>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">If contractions are 5 mins apart and last 1 min for 1 hour, contact your provider.</p>
           </div>
        </div>
      )}
    </div>
  );
};