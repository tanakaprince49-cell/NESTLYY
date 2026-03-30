import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Dumbbell, 
  Calendar, 
  Stethoscope, 
  Sparkles, 
  ChevronRight, 
  RefreshCw,
  Sun,
  Coffee,
  Moon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { PregnancyProfile, CustomPlan, Trimester } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { auth } from '../firebase.ts';

interface CustomPlanViewProps {
  profile: PregnancyProfile;
  trimester: Trimester;
}

export const CustomPlanView: React.FC<CustomPlanViewProps> = ({ profile, trimester }) => {
  const [plan, setPlan] = useState<CustomPlan | null>(storage.getCustomPlan());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<'nutrition' | 'fitness' | 'routine' | 'medical'>('nutrition');

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/custom-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trimester,
          dietPreference: profile.dietPreference || 'normal'
        })
      });

      if (!response.ok) throw new Error('Failed to generate plan');
      
      const newPlan = await response.json();
      const planWithMeta: CustomPlan = {
        ...newPlan,
        id: crypto.randomUUID(),
        trimester,
        dietPreference: profile.dietPreference || 'normal',
        timestamp: Date.now()
      };
      
      storage.saveCustomPlan(planWithMeta);
      setPlan(planWithMeta);
    } catch (err) {
      console.error(err);
      setError('Could not generate your personalized plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const segments = [
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'bg-rose-500' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'bg-emerald-500' },
    { id: 'routine', label: 'Routine', icon: Calendar, color: 'bg-blue-500' },
    { id: 'medical', label: 'Medical', icon: Stethoscope, color: 'bg-purple-500' }
  ];

  if (!plan && !loading) {
    return (
      <div className="p-8 text-center bg-white rounded-[2.5rem] border-2 border-rose-50 shadow-sm space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <Sparkles size={40} className="animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-serif text-slate-900">Your Personalized Plan</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Generate a custom daily routine with nutrition, fitness, and medical guidance tailored to your <b>{trimester}</b> and <b>{profile.dietPreference}</b> diet.
          </p>
        </div>
        <button 
          onClick={generatePlan}
          className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95"
        >
          Generate My Plan
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-rose-50 shadow-sm space-y-8 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto text-rose-500 animate-bounce" size={32} />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-serif text-slate-900">Crafting your plan...</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Consulting Nestly AI Experts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header / Meta */}
      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-rose-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-serif text-slate-900">Personalized Companion</h3>
            <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest">Updated {new Date(plan!.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
        <button onClick={generatePlan} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Segment Selectors */}
      <div className="flex gap-2 p-1 bg-rose-50/50 rounded-2xl overflow-x-auto no-scrollbar">
        {segments.map(seg => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl min-w-[100px] transition-all ${activeSegment === seg.id ? 'bg-white text-rose-600 shadow-sm font-black' : 'text-slate-400 font-bold'}`}
          >
            <seg.icon size={16} />
            <span className="text-[10px] uppercase tracking-widest">{seg.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSegment}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {activeSegment === 'nutrition' && plan && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Morning Fuel', icon: Sun, items: plan.nutrition.breakfast, color: 'text-amber-500' },
                  { label: 'Power Lunch', icon: Coffee, items: plan.nutrition.lunch, color: 'text-rose-500' },
                  { label: 'Nourishing Dinner', icon: Moon, items: plan.nutrition.dinner, color: 'text-indigo-500' }
                ].map((meal, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                       <meal.icon className={meal.color} size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{meal.label}</span>
                    </div>
                    <ul className="space-y-2">
                      {meal.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-200 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div className="bg-rose-900 text-white p-6 rounded-[2.5rem] shadow-xl">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Focus Nutrients for {trimester}</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plan.nutrition.nutrients.map((n, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-sm font-bold">{n.name}</div>
                        <div className="text-[10px] opacity-80 leading-relaxed font-medium">{n.importance}</div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeSegment === 'fitness' && plan && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Dumbbell className="text-emerald-500" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Exercise Goal</span>
                </div>
                <div className="space-y-4">
                   {plan.fitness.exercises.map((ex, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">{i+1}</div>
                        <span className="text-sm font-bold text-slate-700">{ex}</span>
                     </div>
                   ))}
                </div>
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3">
                   <Calendar size={16} className="text-slate-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frequency:</span>
                   <span className="text-sm font-bold text-slate-800">{plan.fitness.frequency}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-amber-100/50 space-y-4">
                 <div className="flex items-center gap-2">
                    <AlertCircle className="text-amber-600" size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Safety Precautions</span>
                 </div>
                 <ul className="space-y-3">
                    {plan.fitness.safety.map((s, i) => (
                      <li key={i} className="text-xs font-bold text-amber-900/70 leading-relaxed">{s}</li>
                    ))}
                 </ul>
              </div>
            </div>
          )}

          {activeSegment === 'routine' && plan && (
            <div className="bg-white p-2 rounded-[2.5rem] border-2 border-slate-50 shadow-sm overflow-hidden">
               {[
                 { label: 'Morning Ritual', icon: Sun, items: plan.routine.morning, color: 'bg-amber-50 text-amber-600' },
                 { label: 'Afternoon Pace', icon: Coffee, items: plan.routine.afternoon, color: 'bg-rose-50 text-rose-600' },
                 { label: 'Evening Wind-down', icon: Moon, items: plan.routine.evening, color: 'bg-indigo-50 text-indigo-600' }
               ].map((part, i) => (
                 <div key={i} className={`p-6 ${i !== 2 ? 'border-b-2 border-slate-50' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${part.color}`}>
                          <part.icon size={20} />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-widest">{part.label}</span>
                    </div>
                    <div className="space-y-3 pl-1">
                       {part.items.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <CheckCircle2 size={16} className="text-slate-300" />
                            {item}
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeSegment === 'medical' && plan && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm space-y-6">
                 <div className="flex items-center gap-2">
                    <Stethoscope size={20} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Focus</span>
                 </div>
                 <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-purple-600">Upcoming Checks</h5>
                    {plan.medical.upcoming.map((u, i) => (
                      <div key={i} className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3">
                         <Calendar className="text-purple-400" size={16} />
                         <span className="text-sm font-bold text-slate-800">{u}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl space-y-6">
                 <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Questions for your next OB/GYN visit</h5>
                    <p className="text-[9px] text-white/40 italic">Nestly identified these specific areas for you to discuss with your healthcare provider.</p>
                 </div>
                 <div className="space-y-3">
                    {plan.medical.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                         <span className="text-sm font-medium text-white/90 italic">"{q}"</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}
    </div>
  );
};
