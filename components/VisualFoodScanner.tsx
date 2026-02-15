
import React, { useRef, useState, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { FoodResearchResult, FoodEntry } from '../types.ts';

interface VisualFoodScannerProps {
  onClose: () => void;
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

export const VisualFoodScanner: React.FC<VisualFoodScannerProps> = ({ onClose, onAddEntry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.");
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      const analysis = await analyzeFoodImage(base64Image);
      setResult(analysis);
    } catch (err) {
      setError("AI couldn't analyze the photo. Try again with a clearer shot.");
    } finally {
      setLoading(false);
    }
  };

  const handleLog = () => {
    if (result) {
      onAddEntry({
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        folate: result.folate,
        iron: result.iron,
        calcium: result.calcium
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      <header className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 pointer-events-none">
        <button 
          onClick={onClose}
          className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
          Nestly Vision Scanner
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {!result ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/40 rounded-[3rem] relative">
                <div className="absolute inset-0 bg-white/5 animate-pulse rounded-[3rem]" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[#fffaf9] overflow-y-auto p-6 pt-24 animate-in slide-in-from-bottom-10 duration-500">
            <div className="max-w-md mx-auto space-y-8 pb-32">
              <div className="text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-100 mb-4">
                  Analysis Complete
                </div>
                <h2 className="text-4xl font-serif text-slate-900 mb-2">{result.name}</h2>
                <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${
                  result.safetyRating === 'Safe' ? 'bg-emerald-500' : result.safetyRating === 'Caution' ? 'bg-amber-500' : 'bg-rose-500'
                }`}>
                  {result.safetyRating} Rating
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Calories</span>
                  <span className="text-2xl font-serif text-slate-900">{result.calories} <small className="text-xs font-sans font-bold text-slate-400">kcal</small></span>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Protein</span>
                  <span className="text-2xl font-serif text-slate-900">{result.protein} <small className="text-xs font-sans font-bold text-slate-400">g</small></span>
                </div>
              </div>

              <div className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100">
                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Mama Advice</h4>
                <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{result.advice}"</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nutrient Highlights</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-50 text-center">
                    <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Folate</span>
                    <span className="text-xs font-black text-slate-800">{result.folate}μg</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-50 text-center">
                    <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Iron</span>
                    <span className="text-xs font-black text-slate-800">{result.iron}mg</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-50 text-center">
                    <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Calcium</span>
                    <span className="text-xs font-black text-slate-800">{result.calcium}mg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <footer className="absolute bottom-10 inset-x-0 p-8 flex justify-center pointer-events-none">
        {!result ? (
          <button 
            onClick={captureAndAnalyze}
            disabled={loading}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl pointer-events-auto active:scale-95 transition-all border-[6px] border-white/20"
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-[#7e1631]/20 border-t-[#7e1631] rounded-full animate-spin" />
            ) : (
              <div className="w-16 h-16 bg-[#7e1631] rounded-full flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
            )}
          </button>
        ) : (
          <div className="w-full max-w-sm flex gap-4 pointer-events-auto">
            <button 
              onClick={() => setResult(null)}
              className="flex-1 py-5 bg-white text-slate-400 font-black rounded-3xl text-[10px] uppercase tracking-widest border-2 border-slate-100"
            >
              Retake
            </button>
            <button 
              onClick={handleLog}
              className="flex-[2] py-5 bg-[#7e1631] text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl"
            >
              Add to Log
            </button>
          </div>
        )}
      </footer>

      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-8 bg-white rounded-[3rem] text-center shadow-2xl z-50 animate-in zoom-in-95">
          <div className="text-3xl mb-4">⚠️</div>
          <p className="text-sm font-medium text-slate-800 mb-6">{error}</p>
          <button onClick={() => setError(null)} className="px-8 py-3 bg-[#7e1631] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Dismiss</button>
        </div>
      )}
    </div>
  );
};
