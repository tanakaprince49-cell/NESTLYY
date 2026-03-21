import React, { useRef, useEffect, useState } from 'react';

interface ARVisualizerProps {
  onClose: () => void;
  babySize: string;
  babyEmoji: string;
}

export const ARVisualizer: React.FC<ARVisualizerProps> = ({ onClose, babySize, babyEmoji }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const constraints: MediaStreamConstraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }, 
          audio: false 
        };
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported on this browser.');
        }

        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(activeStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }
        
        setTimeout(() => setIsScanning(false), 2500);
      } catch (err: any) {
        console.error("AR Camera Error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera access was denied. Nestly needs your camera to visualize your baby's size in the real world.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No back camera was found on this device.");
        } else {
          setError("Nestly encountered an issue initializing the AR experience. Please ensure you are using a modern browser on a mobile device.");
        }
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Camera Feed - Full Screen */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: stream ? 1 : 0 }}
      />

      {/* AR Scanning Effect Overlay */}
      {isScanning && !error && stream && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="w-72 h-72 border-2 border-white/10 rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-rose-500 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-rose-500 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-rose-500 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-rose-500 rounded-br-2xl" />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_25px_rgba(244,63,94,1)] animate-scan" />
            
            {/* Inner grid lines during scan */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/30" />
              ))}
            </div>
          </div>
          <div className="absolute bottom-1/4 flex flex-col items-center gap-4">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" />
            </div>
            <p className="text-white text-[10px] font-black uppercase tracking-[0.5em] bg-black/40 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
              Mapping Surface
            </p>
          </div>
        </div>
      )}

      {/* Spatial Grid Overlay (Visible after scanning) */}
      {!isScanning && !error && stream && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            perspective: '1000px',
            transform: 'rotateX(60deg) translateY(100px) scale(2)',
            transformOrigin: 'bottom'
          }} />
        </div>
      )}

      {/* AR Content Layer - The Baby Sprite */}
      {!error && stream && !isScanning && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-90 duration-1000">
          <div className="animate-float-ar flex flex-col items-center">
            <div className="relative group pointer-events-auto cursor-grab active:cursor-grabbing">
              {/* Diffuse glow beneath the baby */}
              <div className="absolute inset-0 bg-rose-400/30 blur-[100px] scale-150 animate-pulse" />
              
              <div className="text-[160px] sm:text-[220px] drop-shadow-[0_0_60px_rgba(255,255,255,0.9)] relative z-20 transition-transform hover:scale-110 duration-500">
                {babyEmoji}
              </div>
              
              {/* Floating metadata label */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 glass px-10 py-4 rounded-[2.5rem] border-2 border-white/90 shadow-2xl flex flex-col items-center min-w-[200px] backdrop-blur-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Live Scale</span>
                </div>
                <span className="text-slate-900 font-bold text-xl tracking-tight">{babySize}</span>
                <div className="mt-2 h-1 w-12 bg-rose-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-2/3 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UI Controls Overlay */}
      {!error && stream && !isScanning && (
        <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8 z-[550]">
          <div className="flex items-center gap-6">
            <button className="p-5 glass rounded-full text-slate-800 shadow-xl border-white/50 active:scale-90 transition-all pointer-events-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button 
              onClick={() => {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => {});
                setToast("Snapshot saved to your Nestly Memory Album! ✨");
              }}
              className="w-20 h-20 bg-white rounded-full border-8 border-rose-100 shadow-2xl flex items-center justify-center active:scale-90 transition-all pointer-events-auto group"
            >
              <div className="w-12 h-12 bg-rose-500 rounded-full group-hover:scale-90 transition-transform" />
            </button>
            <button className="p-5 glass rounded-full text-slate-800 shadow-xl border-white/50 active:scale-90 transition-all pointer-events-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </button>
          </div>
          <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">Tap to capture your baby's size</p>
        </div>
      )}

      {/* Robust Error State UI */}
      {error && (
        <div className="relative z-[600] glass m-6 p-10 rounded-[3.5rem] text-center max-w-sm border-white shadow-2xl animate-in fade-in slide-in-from-bottom-10">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-inner">⚠️</div>
          <h3 className="text-2xl font-serif text-slate-900 mb-4">Visionary View Unavailable</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10">{error}</p>
          <button 
            onClick={onClose}
            className="w-full py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-200 active:scale-95 transition-all"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Minimal Header Controls */}
      <div className="absolute top-12 inset-x-8 flex justify-between items-center z-[550] pointer-events-none">
        <button 
          onClick={onClose}
          className="p-4 glass rounded-[1.5rem] text-slate-800 pointer-events-auto hover:bg-white active:scale-90 transition-all shadow-xl border-white/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div className="glass px-6 py-2.5 rounded-2xl text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] pointer-events-auto border-white/50 shadow-md">
          Spatial Visualizer
        </div>
      </div>

      {toast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[600] px-6 py-3 bg-white text-rose-500 rounded-full shadow-lg font-bold text-sm animate-in fade-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes float-ar {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-15px) rotate(2deg) scale(1.05); }
        }
        .animate-float-ar {
          animation: float-ar 10s ease-in-out infinite;
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0.5; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.5; }
        }
        .animate-scan {
          animation: scan 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};