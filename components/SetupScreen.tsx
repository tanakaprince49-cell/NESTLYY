import React, { useState, useEffect } from 'react';
import { PregnancyProfile, NutritionTargets, MemoryAlbums, LifecycleStage } from '../types.ts';
import { Logo } from './Logo.tsx';

interface SetupScreenProps {
  onComplete: (profile: PregnancyProfile) => void;
  initialProfile?: PregnancyProfile | null;
}

type SetupStep = 'welcome' | 'lifecycle' | 'name' | 'lmp' | 'calculation' | 'multiples' | 'baby_details' | 'theme' | 'weight' | 'nutrition' | 'photo' | 'final';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, initialProfile }) => {
  const [step, setStep] = useState<SetupStep>(initialProfile ? 'name' : 'welcome');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(initialProfile?.lifecycleStage || LifecycleStage.PREGNANCY);
  const [userName, setUserName] = useState(initialProfile?.userName || '');
  const [lmp, setLmp] = useState(initialProfile?.lmpDate ? initialProfile.lmpDate.split('T')[0] : '');
  const [pregnancyType, setPregnancyType] = useState<'singleton' | 'twins' | 'triplets'>(initialProfile?.pregnancyType || 'singleton');
  const [babies, setBabies] = useState<any[]>(initialProfile?.babies || [{ id: '1', name: '', skinTone: '🏼', gender: 'surprise' }]);
  const [themeColor, setThemeColor] = useState<'pink' | 'blue' | 'neutral'>(initialProfile?.themeColor || 'pink');
  const [isManualDueDate, setIsManualDueDate] = useState(initialProfile?.isManualDueDate || false);
  const [weight, setWeight] = useState(initialProfile?.startingWeight?.toString() || '');
  const [profileImage, setProfileImage] = useState(initialProfile?.profileImage || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialProfile?.notificationsEnabled ?? true);
  
  // Nutrition Targets
  const [useCustomTargets, setUseCustomTargets] = useState(!!initialProfile?.customTargets);
  const [targets, setTargets] = useState<NutritionTargets>(initialProfile?.customTargets || {
    cals: 2200,
    protein: 75,
    folate: 600,
    iron: 27,
    calcium: 1000
  });

  const [dueDate, setDueDate] = useState<string>('');
  const [remainingWeeks, setRemainingWeeks] = useState<number>(0);

  useEffect(() => {
    if (lmp) {
      const lmpDate = new Date(lmp);
      const estDueDate = new Date(lmpDate.getTime() + (280 * 24 * 60 * 60 * 1000));
      setDueDate(estDueDate.toISOString().split('T')[0]);
      const diff = estDueDate.getTime() - new Date().getTime();
      setRemainingWeeks(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7))));
    }
  }, [lmp]);

  const goTo = (next: SetupStep) => setStep(next);

  const handleFinish = () => {
    const emptyAlbums: MemoryAlbums = { ultrasound: [], family: [], favorites: [] };
    onComplete({ 
      userName,
      lmpDate: lmp ? new Date(lmp).toISOString() : new Date().toISOString(), 
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(), 
      isManualDueDate,
      pregnancyType,
      babies,
      themeColor,
      profileImage,
      startingWeight: parseFloat(weight) || 0,
      customTargets: useCustomTargets ? targets : undefined,
      albums: initialProfile?.albums || emptyAlbums,
      lifecycleStage,
      notificationsEnabled
    });
  };

  return (
    <div className="min-h-screen bg-[#fffaf9] flex flex-col relative overflow-hidden p-6 sm:p-8">
      {/* Persistent Floating Teddy Bears */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05]">
        <div className="absolute top-[10%] left-[15%] text-6xl animate-float-teddy">🧸</div>
        <div className="absolute bottom-[20%] right-[10%] text-7xl animate-float-teddy">🧸</div>
      </div>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center gap-10 relative z-10">
        
        {step === 'welcome' && (
          <div className="animate-slide-up space-y-10 text-center">
            <Logo className="w-24 h-24 mx-auto" />
            <div className="space-y-4">
              <h1 className="text-5xl font-serif text-slate-900 leading-tight">Welcome, <br/>Parent.</h1>
              <p className="text-slate-400 font-medium px-4">Let's set up your private nest.</p>
            </div>
            <button onClick={() => goTo('lifecycle')} className="w-full py-6 bg-rose-900 text-white font-black rounded-[2rem] shadow-xl text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all">Start Setup</button>
          </div>
        )}

        {step === 'lifecycle' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Choose your journey mode</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: LifecycleStage.PREGNANCY, label: 'Pregnancy Mode', icon: '🤰', desc: 'Track growth, symptoms, and health' },
                { id: LifecycleStage.NEWBORN, label: 'After Pregnancy (Newborn)', icon: '🍼', desc: 'Track feeding, sleep, and milestones' }
              ].map(stage => (
                <button
                  key={stage.id}
                  onClick={() => {
                    setLifecycleStage(stage.id);
                    goTo('name');
                  }}
                  className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${lifecycleStage === stage.id ? 'bg-rose-500 text-white border-rose-500 shadow-xl' : 'bg-white border-rose-50 text-slate-400'}`}
                >
                  <span className="text-4xl">{stage.icon}</span>
                  <span className="text-sm font-black uppercase tracking-widest">{stage.label}</span>
                  <span className={`text-[10px] ${lifecycleStage === stage.id ? 'text-rose-100' : 'text-slate-300'}`}>{stage.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">What's your name?</h2>
            <input autoFocus value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your Name" className="w-full text-center text-2xl font-serif border-b-2 border-rose-100 p-4 focus:border-rose-500 outline-none bg-transparent" />
            <button 
              onClick={() => goTo(lifecycleStage === LifecycleStage.NEWBORN ? 'multiples' : 'lmp')} 
              className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4"
            >
              Next
            </button>
          </div>
        )}

        {step === 'lmp' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Last Period (LMP)</h2>
            <input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="w-full bg-white border-2 border-rose-50 rounded-[2rem] px-8 py-6 text-xl font-bold text-center outline-none" />
            <button onClick={() => goTo('calculation')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Calculate Due Date</button>
          </div>
        )}

        {step === 'calculation' && (
          <div className="animate-slide-up space-y-10 w-full text-center">
            <div className="space-y-2">
              <h2 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em]">Estimated Due Date</h2>
              <div className="flex flex-col items-center gap-4">
                {isManualDueDate ? (
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-white border-2 border-rose-50 rounded-[2rem] px-8 py-4 text-xl font-bold text-center outline-none"
                  />
                ) : (
                  <div className="text-4xl font-serif text-slate-900 py-4">
                    {new Date(dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                <button 
                  onClick={() => setIsManualDueDate(!isManualDueDate)}
                  className="text-[10px] font-black text-rose-400 uppercase tracking-widest underline"
                >
                  {isManualDueDate ? "Use Calculated Date" : "Override with Doctor's Date"}
                </button>
              </div>
            </div>
            <div className="p-8 bg-rose-50 rounded-[3rem] border-2 border-white shadow-inner">
               <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Time Remaining</span>
               <div className="text-3xl font-bold text-rose-900">{remainingWeeks} Weeks Left</div>
            </div>
            <button onClick={() => goTo('multiples')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Continue</button>
          </div>
        )}

        {step === 'multiples' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">How many babies?</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['singleton', 'twins', 'triplets'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setPregnancyType(type);
                    const count = type === 'singleton' ? 1 : type === 'twins' ? 2 : 3;
                    setBabies(Array.from({ length: count }, (_, i) => ({ id: (i + 1).toString(), name: '', skinTone: '🏼', gender: 'surprise' })));
                  }}
                  className={`p-6 rounded-[2rem] border-2 transition-all ${pregnancyType === type ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-rose-50 text-slate-400'}`}
                >
                  <div className="text-2xl mb-2">
                    {type === 'singleton' ? '👶' : type === 'twins' ? '👶👶' : '👶👶👶'}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                </button>
              ))}
            </div>
            <button onClick={() => goTo('baby_details')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Next</button>
          </div>
        )}

        {step === 'baby_details' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Baby Details</h2>
            <div className="space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar p-2">
              {babies.map((baby, idx) => (
                <div key={baby.id} className="p-6 bg-white rounded-[2rem] border-2 border-rose-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Baby {idx + 1}</span>
                    <div className="flex gap-2">
                      {['🏻', '🏼', '🏽', '🏾', '🏿'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => {
                            const newBabies = [...babies];
                            newBabies[idx].skinTone = tone;
                            setBabies(newBabies);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${baby.skinTone === tone ? 'scale-125 border-2 border-rose-500' : 'opacity-50'}`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-4">
                      {(['boy', 'girl', 'surprise'] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => {
                            const newBabies = [...babies];
                            newBabies[idx].gender = g;
                            setBabies(newBabies);
                            // Auto-set theme based on first baby or any boy
                            if (idx === 0 || g === 'boy') {
                              setThemeColor(g === 'boy' ? 'blue' : g === 'girl' ? 'pink' : 'neutral');
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${baby.gender === g ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-50'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <input 
                      value={baby.name} 
                      onChange={e => {
                        const newBabies = [...babies];
                        newBabies[idx].name = e.target.value;
                        setBabies(newBabies);
                      }} 
                      placeholder="Nickname (e.g. Peanut)" 
                      className="w-full text-center text-xl font-serif border-b-2 border-rose-100 p-2 focus:border-rose-500 outline-none bg-transparent" 
                    />
                    
                    {lifecycleStage !== LifecycleStage.PREGNANCY && lifecycleStage !== LifecycleStage.PRE_PREGNANCY && (
                      <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in">
                        <div className="space-y-1 text-left">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Birth Weight (kg)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={baby.birthWeight || ''} 
                            onChange={e => {
                              const newBabies = [...babies];
                              newBabies[idx].birthWeight = parseFloat(e.target.value);
                              setBabies(newBabies);
                            }}
                            className="w-full h-10 bg-slate-50 rounded-xl px-3 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Birth Date</label>
                          <input 
                            type="date" 
                            value={baby.birthDate || ''} 
                            onChange={e => {
                              const newBabies = [...babies];
                              newBabies[idx].birthDate = e.target.value;
                              setBabies(newBabies);
                            }}
                            className="w-full h-10 bg-slate-50 rounded-xl px-3 text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('theme')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Continue</button>
          </div>
        )}

        {step === 'theme' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Choose your theme</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['pink', 'blue', 'neutral'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${themeColor === color ? 'border-rose-500 bg-rose-50' : 'bg-white border-slate-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full shadow-inner ${color === 'pink' ? 'bg-rose-400' : color === 'blue' ? 'bg-blue-400' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{color}</span>
                </button>
              ))}
            </div>
            <button onClick={() => goTo('weight')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Next</button>
          </div>
        )}

        {step === 'weight' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Starting Weight</h2>
            <div className="flex items-center justify-center gap-4 bg-white/50 p-8 rounded-[3rem] border-2 border-rose-50">
              <input type="number" step="0.1" autoFocus value={weight} onChange={e => setWeight(e.target.value)} placeholder="00.0" className="w-32 text-4xl font-serif text-center bg-transparent border-b-2 border-rose-200 focus:border-rose-500 outline-none p-0" />
              <span className="text-2xl font-serif text-rose-400 italic">kg</span>
            </div>
            <button onClick={() => goTo('nutrition')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Next</button>
          </div>
        )}

        {step === 'nutrition' && (
          <div className="animate-slide-up space-y-6 w-full text-center">
            <h2 className="text-3xl font-serif text-slate-900">Nutrition Targets</h2>
            
            <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                <div className="text-left">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Personalized Plan</span>
                  <span className="text-sm font-bold text-slate-800">Custom Parent Goals</span>
                </div>
                <button 
                  onClick={() => setUseCustomTargets(!useCustomTargets)}
                  className={`w-14 h-8 rounded-full transition-all relative ${useCustomTargets ? 'bg-rose-900' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${useCustomTargets ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {useCustomTargets ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Calories</label>
                    <input type="number" value={targets.cals} onChange={e => setTargets({...targets, cals: +e.target.value})} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Protein (g)</label>
                    <input type="number" value={targets.protein} onChange={e => setTargets({...targets, protein: +e.target.value})} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Iron (mg)</label>
                    <input type="number" value={targets.iron} onChange={e => setTargets({...targets, iron: +e.target.value})} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Folate (mcg)</label>
                    <input type="number" value={targets.folate} onChange={e => setTargets({...targets, folate: +e.target.value})} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                  <p className="text-[11px] text-rose-800 font-medium italic leading-relaxed">
                    Nestly will automatically apply clinician-standardized daily targets optimized for your specific trimester.
                  </p>
                </div>
              )}
            </div>
            
            <button onClick={() => goTo('photo')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest shadow-lg">Confirm Goals</button>
          </div>
        )}

        {step === 'photo' && (
          <div className="animate-slide-up space-y-8 w-full text-center">
            <h2 className="text-4xl font-serif text-slate-900">Profile Glow</h2>
            <div className="w-48 h-48 bg-rose-50 rounded-[3rem] border-4 border-white shadow-xl mx-auto flex items-center justify-center overflow-hidden cursor-pointer group" onClick={() => document.getElementById('p-up-setup')?.click()}>
              {profileImage ? (
                <img src={profileImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📸</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Upload Photo</span>
                </div>
              )}
              <input id="p-up-setup" type="file" className="hidden" accept="image/*" onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => setProfileImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }} />
            </div>
            <button onClick={() => goTo('final')} className="w-full py-6 bg-rose-500 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-widest mt-4">Almost Done</button>
          </div>
        )}

        {step === 'final' && (
          <div className="animate-slide-up space-y-10 w-full text-center">
            <div className="text-8xl animate-float">🕊️</div>
            <div className="space-y-4">
              <h2 className="text-5xl font-serif text-slate-900">{initialProfile ? "Profile Updated" : "Nest is ready."}</h2>
              <p className="text-slate-400 font-medium">Your data is stored securely on your device.</p>
            </div>
            
            <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 flex items-center justify-between">
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</span>
                <span className="text-sm font-bold text-slate-800">Reminders & Guidance</span>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-14 h-8 rounded-full transition-all relative ${notificationsEnabled ? 'bg-rose-900' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <button onClick={handleFinish} className="w-full py-6 bg-rose-900 text-white font-black rounded-[2rem] shadow-xl text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all">Enter My Nest</button>
          </div>
        )}

      </div>
    </div>
  );
};