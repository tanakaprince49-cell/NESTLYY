import React, { useState } from 'react';
import { PartyPopper, Baby } from 'lucide-react';
import { PregnancyProfile, LifecycleStage } from '../../types.ts';
import { storage } from '../../services/storageService.ts';

interface BirthOnboardingProps {
  profile: PregnancyProfile;
  onUpdateProfile: (p: PregnancyProfile) => void;
  onUpdateArchive: () => void;
}

export const BirthOnboarding: React.FC<BirthOnboardingProps> = ({ profile, onUpdateProfile, onUpdateArchive }) => {
  const [isBirthOnboarding, setIsBirthOnboarding] = useState(false);
  const [birthData, setBirthData] = useState({
    babies: [{ name: '', dob: new Date().toISOString().split('T')[0], gender: 'neutral' as const, weight: '', height: '' }]
  });

  if (!isBirthOnboarding) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
          <h3 className="text-xl font-serif text-rose-800">Welcome to Motherhood</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Transition to newborn mode to track your baby's growth.</p>
          
          <button 
            onClick={() => setIsBirthOnboarding(true)}
            className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
          >
            <Baby size={18} /> Mark as Born & Switch to Newborn Mode
          </button>
        </div>
      </div>
    );
  }

  const handleCompleteBirth = () => {
    const updatedProfile: PregnancyProfile = {
      ...profile,
      lifecycleStage: LifecycleStage.NEWBORN,
      babies: birthData.babies.map((b, i) => ({
        id: crypto.randomUUID(),
        name: b.name,
        birthDate: b.dob,
        gender: b.gender,
        birthWeight: parseFloat(b.weight) || 0,
        skinTone: '👶'
      }))
    };
    
    const archiveEntry: any = {
      id: crypto.randomUUID(),
      startDate: profile.lmpDate,
      endDate: new Date().toISOString(),
      type: profile.pregnancyType,
      outcome: 'birth',
      babies: birthData.babies.map(b => b.name)
    };
    
    storage.addToArchive(archiveEntry);
    onUpdateArchive();
    onUpdateProfile(updatedProfile);
    setIsBirthOnboarding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-rose-100 space-y-6 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto no-scrollbar">
        <div className="text-center space-y-2">
          <div className="flex justify-center text-rose-500">
            <PartyPopper size={40} />
          </div>
          <h3 className="text-xl font-serif text-rose-800">Welcome, Little One{birthData.babies.length > 1 ? 's' : ''}!</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Let's set up your baby profile{birthData.babies.length > 1 ? 's' : ''}</p>
        </div>

        <div className="space-y-8">
          {birthData.babies.map((baby, idx) => (
            <div key={idx} className="space-y-4 p-6 bg-rose-50/30 rounded-3xl border border-rose-100/50">
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Baby {birthData.babies.length > 1 ? idx + 1 : ''}</h4>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Baby's Name</label>
                <input 
                  value={baby.name} 
                  onChange={e => {
                    const newBabies = [...birthData.babies];
                    newBabies[idx].name = e.target.value;
                    setBirthData({...birthData, babies: newBabies});
                  }} 
                  placeholder="Enter name..." 
                  className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={baby.dob} 
                    onChange={e => {
                      const newBabies = [...birthData.babies];
                      newBabies[idx].dob = e.target.value;
                      setBirthData({...birthData, babies: newBabies});
                    }} 
                    className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Gender</label>
                  <select 
                    value={baby.gender} 
                    onChange={e => {
                      const newBabies = [...birthData.babies];
                      newBabies[idx].gender = e.target.value as any;
                      setBirthData({...birthData, babies: newBabies});
                    }} 
                    className="w-full p-4 bg-white rounded-2xl text-sm font-bold outline-none border border-slate-100"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={baby.weight} 
                    onChange={e => {
                      const newBabies = [...birthData.babies];
                      newBabies[idx].weight = e.target.value;
                      setBirthData({...birthData, babies: newBabies});
                    }} 
                    placeholder="3.5" 
                    className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">Height (cm)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={baby.height} 
                    onChange={e => {
                      const newBabies = [...birthData.babies];
                      newBabies[idx].height = e.target.value;
                      setBirthData({...birthData, babies: newBabies});
                    }} 
                    placeholder="50" 
                    className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100" 
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white py-4 border-t border-slate-50">
            <button 
              onClick={() => setIsBirthOnboarding(false)} 
              className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleCompleteBirth}
              className="flex-2 py-4 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100"
            >
              Complete Birth Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
