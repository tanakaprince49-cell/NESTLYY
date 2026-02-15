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
          <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-rose-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-rose-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-rose-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-rose-500 rounded-br-xl" />
            <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] animate-scan" />
          </div>
          <p className="absolute bottom-1/4 text-white text-[10px] font-black uppercase tracking-[0.4em] bg-black/50 backdrop-blur-lg px-8 py-3 rounded-full border border-white/10">
            Scanning Environment...
          </p>
        </div>
      )}

      {/* AR Content Layer - The Baby Sprite */}
      {!error && stream && !isScanning && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-75 duration-1000">
          <div className="animate-float-ar flex flex-col items-center">
            <div className="relative group pointer-events-auto">
              {/* Diffuse glow beneath the baby */}
              <div className="absolute inset-0 bg-rose-400/40 blur-[80px] scale-150 animate-pulse" />
              
              <div className="text-[140px] sm:text-[180px] drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] relative z-20">
                {babyEmoji}
              </div>
              
              {/* Floating metadata label */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 glass px-8 py-3 rounded-[1.8rem] border-2 border-white/90 shadow-2xl flex flex-col items-center min-w-[160px]">
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">True Scale</span>
                <span className="text-slate-900 font-bold text-base tracking-tight">{babySize}</span>
              </div>
            </div>
          </div>
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