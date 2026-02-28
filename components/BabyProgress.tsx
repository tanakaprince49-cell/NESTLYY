
import React, { useMemo, useState } from 'react';
import { PregnancyProfile, Trimester, LifecycleStage, BabyGrowthLog } from '../types';
import { babyGrowthData, getBabyGrowth, DevelopmentInfo } from '../services/babyGrowth';
import { ARVisualizer } from './ARVisualizer';

export const BabyProgress: React.FC<{ profile: PregnancyProfile, babyGrowthLogs?: BabyGrowthLog[] }> = ({ profile, babyGrowthLogs = [] }) => {
  const [showAR, setShowAR] = useState(false);
  
  const currentWeeks = useMemo(() => {
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    return Math.max(1, Math.min(42, Math.floor(diff / (1000 * 60 * 60 * 24 * 7))));
  }, [profile]);

  const [selectedWeek, setSelectedWeek] = useState(currentWeeks);
  const baby = useMemo(() => getBabyGrowth(selectedWeek), [selectedWeek]);
  const currentBaby = useMemo(() => getBabyGrowth(currentWeeks), [currentWeeks]);

  const trimesterFocus = useMemo(() => {
    if (selectedWeek <= 13) return {
      title: "Foundations & Growth",
      advice: "Your focus this trimester is Folate and cell division. Baby's major organs are forming from scratch!",
      ritual: "Ginger tea rituals for gentle digestion."
    };
    if (selectedWeek <= 26) return {
      title: "The Golden Glow",
      advice: "Movement begins! You'll soon feel tiny flutters. Focus on Iron and Vitamin C for energy.",
      ritual: "Stretching rituals to support your changing center of gravity."
    };
    return {
      title: "The Home Stretch",
      advice: "Baby is practicing breathing and opening their eyes. High protein is key for rapid brain growth.",
      ritual: "Evening kick counts as a bonding ritual."
    };
  }, [selectedWeek]);

  const isPostpartum = profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;

  if (isPostpartum) {
    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-700">
        <div className="text-center">
          <h2 className="text-3xl font-serif text-rose-800 text-glow">Baby Growth</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Postpartum Journey</p>
        </div>

        {profile.babies?.map((b, idx) => (
          <div key={b.id} className="card-premium p-8 bg-white border-2 border-white shadow-xl space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-rose-100">
                {b.gender === 'boy' ? '👦' : b.gender === 'girl' ? '👧' : '👶'}{b.skinTone}
              </div>
              <div>
                <h3 className="text-2xl font-serif text-rose-900">{b.name || `Baby ${idx + 1}`}</h3>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{b.gender} • {b.birthWeight}kg at birth</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Current Weight</span>
                <span className="text-xl font-bold text-emerald-900">
                  {babyGrowthLogs.filter(l => l.babyId === b.id).sort((a, b) => b.timestamp - a.timestamp)[0]?.weight || '--'} kg
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl">
                <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Height</span>
                <span className="text-xl font-bold text-blue-900">
                  {babyGrowthLogs.filter(l => l.babyId === b.id).sort((a, b) => b.timestamp - a.timestamp)[0]?.height || '--'} cm
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Developmental Milestones (0-3m)</h4>
              <div className="grid gap-3">
                {[
                  "Lifts head during tummy time",
                  "Follows moving objects with eyes",
                  "Smiles at people (social smile)",
                  "Coos and makes gurgling sounds"
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 bg-rose-400 rounded-full" />
                    <span className="text-xs text-slate-700 font-medium">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100">
              <h4 className="text-[9px] font-black text-rose-700 uppercase tracking-widest mb-2">Growth Tip</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Newborns grow rapidly! Expect them to double their birth weight by 5 months. Regular skin-to-skin contact and responsive feeding are key to healthy growth.
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (showAR) {
    return (
      <ARVisualizer 
        onClose={() => setShowAR(false)} 
        babySize={currentBaby.size} 
        babyEmoji={currentBaby.image} 
      />
    );
  }

  return (
    <div className="relative space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-30">
        <div className="absolute top-[15%] right-[20%] text-5xl rotate-[10deg] animate-float-teddy" style={{ animationDelay: '1s' }}>🧸</div>
        <div className="absolute bottom-[10%] left-[40%] text-5xl rotate-[-5deg] animate-float-teddy" style={{ animationDelay: '2s' }}>🧸</div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-serif text-rose-800 text-glow">Fetal Development</h2>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Exploring {selectedWeek === currentWeeks ? "Today's Progress" : `Week ${selectedWeek}`}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 -mx-4 px-4">
        {Object.keys(babyGrowthData).map((w) => {
          const weekNum = parseInt(w);
          const isSelected = selectedWeek === weekNum;
          return (
            <button
              key={w}
              onClick={() => setSelectedWeek(weekNum)}
              className={`flex-none w-16 h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${isSelected ? 'bg-rose-500 border-rose-400 text-white scale-110' : 'glass border-white text-gray-400'}`}
            >
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>Wk {w}</span>
              <span className="text-xl">{babyGrowthData[weekNum].image}</span>
            </button>
          );
        })}
      </div>

      <div className="card-premium p-8 sm:p-10 bg-white border-2 border-white shadow-xl relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-50" />
        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center gap-2">
              {profile.pregnancyType === 'singleton' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-rose-50/50 rounded-[2.5rem] flex items-center justify-center text-8xl shadow-inner border border-rose-100 shrink-0 animate-in zoom-in-50 duration-500">
                    {baby.image}
                  </div>
                  <div className="text-4xl animate-bounce">
                    {profile.babies?.[0]?.gender === 'boy' ? '👦' : profile.babies?.[0]?.gender === 'girl' ? '👧' : '👶'}{profile.babies?.[0]?.skinTone}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4 max-w-[300px]">
                  {profile.babies?.map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 bg-rose-50/50 rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-rose-100 animate-in zoom-in-50 duration-500">
                        {baby.image}
                      </div>
                      <div className="text-2xl">
                        {b.gender === 'boy' ? '👦' : b.gender === 'girl' ? '👧' : '👶'}{b.skinTone}
                      </div>
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{b.name || `Baby ${i+1}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h3 className="text-2xl font-serif text-rose-900 leading-tight">Size of {profile.pregnancyType === 'singleton' ? 'a' : profile.pregnancyType === 'twins' ? 'two' : 'three'} {baby.size}</h3>
              <p className="text-sm text-gray-500 italic mt-1 leading-relaxed">"{baby.description}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-3 rounded-2xl border border-white">
                <span className="block text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Length</span>
                <span className="text-sm font-bold text-gray-800">{baby.length}</span>
              </div>
              <div className="bg-white/40 p-3 rounded-2xl border border-white">
                <span className="block text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Weight</span>
                <span className="text-sm font-bold text-gray-800">{baby.weight}</span>
              </div>
            </div>
            <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📏</span>
                <div className="text-left">
                  <span className="block text-[8px] font-black text-rose-400 uppercase tracking-widest">Size Comparison</span>
                  <span className="text-xs font-bold text-slate-700">Comparable to a {baby.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-6 relative z-10">
          <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100">
            <h4 className="text-[9px] font-black text-rose-700 uppercase tracking-widest mb-2">{trimesterFocus.title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">"{trimesterFocus.advice}"</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Ritual: {trimesterFocus.ritual}</div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Milestones</h4>
            <div className="grid gap-3">
              {baby.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/30 p-4 rounded-2xl border border-white/60"><div className="w-2 h-2 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]" /><span className="text-xs text-gray-700 font-medium">{m}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative glass p-8 rounded-[2.5rem] border border-white flex flex-col items-center text-center">
        <h3 className="text-sm font-serif text-rose-800 mb-2">Step into the Nursery</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Experience the AR Size Visualizer</p>
        <button onClick={() => setShowAR(true)} className="w-full sm:w-auto px-10 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Launch AR Explorer</button>
      </div>
    </div>
  );
};
