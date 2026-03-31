import React from 'react';
import { motion } from 'motion/react';
import { Users, MapPin, MessageCircle, Heart, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { PregnancyProfile, LifecycleStage } from '../types.ts';

interface VillageHubProps {
  profile: PregnancyProfile;
}

export const VillageHub: React.FC<VillageHubProps> = ({ profile }) => {
  const isPostpartum = profile.lifecycleStage === LifecycleStage.NEWBORN;

  const mockNests = [
    { id: 1, name: "Chelsea Mamas-to-be", distance: "0.4 miles", members: 12, match: "Matched by Trimester (2nd)", activity: "Active now" },
    { id: 2, name: "Kensington Newborn Nest", distance: "1.2 miles", members: 8, match: "Matched by Stage (0-3m)", activity: "Gathering Friday" },
    { id: 3, name: "West London Active Moms", distance: "2.1 miles", members: 45, match: "Matched by Interests", activity: "3 events this week" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="bg-rose-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
           <Users size={180} />
        </div>
        <div className="relative z-10 space-y-2">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Neighborhood Nests</span>
           <h2 className="text-4xl font-serif leading-tight">Find Your <br/>Village, {profile.userName}.</h2>
           <p className="text-sm font-medium text-rose-100 max-w-xs leading-relaxed opacity-80">
              Motherhood is better when shared. We've found 3 nests in your neighborhood matching your current journey.
           </p>
        </div>
        <div className="flex gap-4 relative z-10 pt-4">
           <button className="h-14 px-8 bg-white text-rose-900 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Discover All <ArrowRight size={18} />
           </button>
           <button className="w-14 h-14 bg-rose-800 text-white rounded-2xl flex items-center justify-center border border-rose-700/50 hover:bg-rose-700 transition-colors">
              <Plus size={24} />
           </button>
        </div>
      </div>

      {/* Discovery Feed */}
      <div className="space-y-4 px-1">
         <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Closest Nests</h3>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
               <MapPin size={12} /> LONDON, UK
            </span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNests.map((nest, i) => (
              <motion.div 
                key={nest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-rose-100 transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:translate-y-[-4px]"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-inner group-hover:bg-rose-100 transition-colors">
                       <Heart size={24} />
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          {nest.activity}
                       </span>
                       <span className="text-[10px] font-medium text-slate-400 block mt-1">{nest.distance} away</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h4 className="text-xl font-serif text-slate-800 group-hover:text-rose-900 transition-colors">{nest.name}</h4>
                    <div className="flex items-center gap-2">
                       <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">{nest.members} Members</span>
                       <span className="px-2.5 py-1 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                         <Sparkles size={10} /> {nest.match}
                       </span>
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-3">
                       {[...Array(4)].map((_, j) => (
                         <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${nest.id}-${j}`} alt="Member" className="w-full h-full object-cover" />
                         </div>
                       ))}
                       <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-50 flex items-center justify-center text-[8px] font-black text-rose-400">
                          +{nest.members - 4}
                       </div>
                    </div>
                    <button className="p-3 text-slate-300 group-hover:text-rose-500 transition-colors">
                       <MessageCircle size={20} />
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Featured Insight */}
      <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100/50 flex flex-col items-center text-center space-y-4">
         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-rose-500 animate-float">
            <Sparkles size={28} />
         </div>
         <div className="space-y-1">
            <h4 className="text-lg font-serif text-slate-800">Why Nests work?</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
               We match you with women in the exact same life stage and zip code. Shared context creates instant bonds.
            </p>
         </div>
         <button className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 py-2 border-b-2 border-rose-100">See Science of Belonging</button>
      </div>
    </div>
  );
};
