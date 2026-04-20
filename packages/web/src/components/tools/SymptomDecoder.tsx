import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, Sparkles, Send, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, Phone } from 'lucide-react';
import { Trimester } from '@nestly/shared';

interface SymptomDecoderProps {
  trimester: Trimester;
}

interface AnalysisResult {
  validation: string;
  safetyRating: 'Green' | 'Amber' | 'Red';
  explanation: string;
  action: string;
  medicalNote: string;
}

export const SymptomDecoder: React.FC<SymptomDecoderProps> = ({ trimester }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/symptom-decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms, trimester })
      });

      if (!response.ok) throw new Error('Failed to analyze symptoms');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Could not reach Ava for support. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case 'Green': return 'bg-emerald-500 text-white';
      case 'Amber': return 'bg-amber-500 text-white';
      case 'Red': return 'bg-rose-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const getSafetyIcon = (rating: string) => {
    switch (rating) {
      case 'Green': return <CheckCircle2 size={24} />;
      case 'Amber': return <AlertTriangle size={24} />;
      case 'Red': return <AlertCircle size={24} />;
      default: return <Stethoscope size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-50 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-rose-50 rounded-[1.8rem] flex items-center justify-center text-rose-500 shadow-inner">
            <Stethoscope size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-slate-900 leading-tight">Symptom Decoder</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Ava's Triage Engine</span>
            </div>
          </div>
        </div>

        <div className="p-2 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group transition-all focus-within:border-rose-200 focus-within:bg-white focus-within:shadow-xl">
           <textarea
             value={symptoms}
             onChange={e => setSymptoms(e.target.value)}
             placeholder="Describe how you're feeling... (e.g. slight nausea, lower back pain, cramping)"
             className="w-full h-40 p-6 bg-transparent border-none rounded-[1.8rem] text-sm font-medium outline-none resize-none placeholder:text-slate-300 transition-all"
           />
           <div className="absolute bottom-4 right-4 flex gap-2">
             <button 
               onClick={analyzeSymptoms}
               disabled={!symptoms.trim() || loading}
               className="h-14 px-8 bg-rose-900 text-white rounded-[1.2rem] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-40 transition-all transition-transform hover:translate-y-[-2px] hover:shadow-xl group-active:scale-90"
             >
               {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Ask Ava <Send size={16} /></>}
             </button>
           </div>
        </div>

        <p className="text-[9px] text-slate-400 text-center italic text-balance font-medium leading-relaxed leading-tight opacity-70">
           Nestly AI provides supportive information only. <b>Always seek professional medical advice</b> if you're concerned about your health or your baby's.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="space-y-4"
          >
            {/* Validation & Rating */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-rose-50 shadow-md flex items-center justify-between gap-6 overflow-hidden relative">
               <div className="space-y-2 flex-1">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Ava's Analysis</h4>
                 <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{result.validation}"</p>
               </div>
               <div className={`shrink-0 w-20 h-20 rounded-[1.8rem] flex flex-col items-center justify-center gap-1 shadow-lg ${getSafetyColor(result.safetyRating)}`}>
                  {getSafetyIcon(result.safetyRating)}
                  <span className="text-[8px] font-black uppercase tracking-widest">{result.safetyRating}</span>
               </div>
            </div>

            {/* Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                     <Sparkles size={18} className="text-rose-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Context</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{result.explanation}</p>
               </div>

               <div className="bg-rose-900 text-white p-8 rounded-[2.5rem] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 size={18} className="text-rose-300" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Action Step</span>
                  </div>
                  <p className="text-sm font-bold text-white/90 leading-relaxed italic">"{result.action}"</p>
               </div>
            </div>

            {/* Medical Note */}
            <div className="p-8 bg-white rounded-[2.5rem] border-2 border-rose-50 shadow-sm flex items-start gap-6 border-l-8 border-l-rose-500/10">
               <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                  <Phone size={24} />
               </div>
               <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">When to call the doctor</h4>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{result.medicalNote}</p>
               </div>
            </div>

            <button 
               onClick={() => {setResult(null); setSymptoms('');}}
               className="w-full py-4 text-rose-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
            >
               Clear Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-6 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center gap-4 border border-rose-100 shadow-inner">
           <AlertCircle size={24} />
           <span className="text-sm font-bold">{error}</span>
        </div>
      )}
    </div>
  );
};
