import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ChevronRight,
  MessageSquare,
  FileText,
  PieChart,
  Users,
  Check,
  Heart
} from 'lucide-react';

interface PremiumPageProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ onClose, onSubscribe }) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    setIsSubscribing(true);
    // Simulate subscription process
    setTimeout(() => {
      setSubscribed(true);
      setIsSubscribing(false);
      // Wait for user to see the success state
      setTimeout(() => {
        onSubscribe();
      }, 1500);
    }, 1000);
  };

  const benefits = [
    {
      icon: <MessageSquare className="text-rose-500" size={20} />,
      title: "Unlimited Ava AI",
      description: "Chat freely with your stage-aware AI companion anytime, anywhere."
    },
    {
      icon: <Zap className="text-amber-500" size={20} />,
      title: "AI Custom Plans",
      description: "Personalized nutrition, fitness, and daily routines generated for you."
    },
    {
      icon: <Sparkles className="text-purple-500" size={20} />,
      title: "Symptom Decoder",
      description: "Advanced AI interpretation of your symptoms across all trimesters."
    },
    {
      icon: <FileText className="text-blue-500" size={20} />,
      title: "Health Report Exports",
      description: "Generate and export professional PDF wellness reports for your doctor."
    },
    {
      icon: <PieChart className="text-emerald-500" size={20} />,
      title: "Advanced Analytics",
      description: "30-day and all-time trend charts for sleep, nutrition, and baby growth."
    },
    {
      icon: <Users className="text-indigo-500" size={20} />,
      title: "Village Nest Creator",
      description: "Create and lead your own community nests in the Village Hub."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-slate-50/50 backdrop-blur-md rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-[20]"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="overflow-y-auto no-scrollbar pb-8">
          {/* Hero Section */}
          <div className="relative p-10 sm:p-14 bg-gradient-to-br from-rose-50 via-white to-orange-50 overflow-hidden text-center">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute -top-10 -left-10 w-48 h-48 bg-rose-200 rounded-full blur-3xl" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-200 rounded-full blur-3xl" 
              />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-rose-100/50 backdrop-blur-sm text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-rose-200/50">
                <Crown size={14} fill="currentColor" strokeWidth={2} />
                Nestly Premium
              </div>
              <h2 className="text-4xl sm:text-6xl font-serif text-slate-900 leading-tight">Elevate Your <br/>Journey</h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed font-medium">
                Unlock the full power of AI-driven support and advanced clinical-grade health tracking.
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="px-10 sm:px-14 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex gap-5 group"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-rose-100/50 transition-all duration-500 ease-out">
                  {benefit.icon}
                </div>
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{benefit.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing & CTA */}
          <div className="px-10 sm:px-14 pt-6">
            <div className="p-10 bg-slate-900 rounded-[3rem] text-center space-y-8 shadow-2xl shadow-slate-200 relative overflow-hidden group border border-slate-800">
              {/* Subtle light effect */}
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-1000" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
              
              <div className="space-y-2 relative z-10">
                <div className="text-4xl font-serif text-white">$5.99 <span className="text-sm font-sans text-slate-500 ml-1 font-medium italic">/ month</span></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Cancel anytime. Secure Payments.</p>
              </div>

              <button 
                onClick={handleSubscribe}
                disabled={isSubscribing || subscribed}
                className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl relative overflow-hidden ${
                  subscribed 
                    ? 'bg-emerald-500 text-white' 
                    : isSubscribing 
                      ? 'bg-rose-400 text-white cursor-wait'
                      : 'bg-rose-500 text-white hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {subscribed ? (
                  <>
                    <Check size={20} />
                    Subscribed!
                  </>
                ) : isSubscribing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Unlock Nestly Premium
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10 pt-2 opacity-60">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Secure
                </div>
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <div className="flex items-center gap-2">
                  <Heart size={14} fill="currentColor" className="text-rose-500" /> Support
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-14 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter text-center max-w-sm leading-tight">
             Nestly Premium helps us continue providing clinically-verified guidance for mothers worldwide.
           </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
