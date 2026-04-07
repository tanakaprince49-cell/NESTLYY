import React, { useRef } from 'react';
import { CameraIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../../services/storageService.ts';

interface BumpDiaryProps {
  bumpPhotos: { id: string, url: string, date: string, week: number }[];
  onUpdateBumpPhotos: () => void;
  progressWeeks: number;
}

export const BumpDiary: React.FC<BumpDiaryProps> = ({ bumpPhotos, onUpdateBumpPhotos, progressWeeks }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newPhotos = [
          { id: crypto.randomUUID(), url: base64String, date: new Date().toISOString(), week: progressWeeks },
          ...bumpPhotos
        ];
        storage.saveBumpPhotos(newPhotos);
        onUpdateBumpPhotos();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (id: string) => {
    const newPhotos = bumpPhotos.filter(p => p.id !== id);
    storage.saveBumpPhotos(newPhotos);
    onUpdateBumpPhotos();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Bump Photo Diary</h3>
        <p className="text-xs text-slate-400 font-medium">Document your growing bump week by week.</p>
        
        <div className="flex justify-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 border-4 border-dashed border-rose-100 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-rose-400 hover:bg-rose-50 hover:border-rose-300 transition-all"
          >
            <CameraIcon size={48} />
            <span className="text-[10px] font-black uppercase tracking-widest">Add New Photo</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence>
          {bumpPhotos.map((photo) => (
            <motion.div 
              key={photo.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="card-premium bg-white border-2 border-white overflow-hidden group relative"
            >
              <img src={photo.url} alt={`Week ${photo.week}`} className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                <span className="text-white font-black text-lg">Week {photo.week}</span>
                <span className="text-white/80 text-[10px] uppercase tracking-widest">{new Date(photo.date).toLocaleDateString()}</span>
              </div>
              <button 
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {bumpPhotos.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center py-8 text-slate-400 text-sm font-medium"
          >
            No photos added yet. Start your diary!
          </motion.div>
        )}
      </div>
    </div>
  );
};
