import React, { useState } from 'react';
import { storage } from '../../services/storageService.ts';
import { MemoryAlbums, MemoryPhoto } from '../../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Camera as CameraIcon, Baby, Heart, Home, Users, Sparkles, Plus } from 'lucide-react';

interface MemoriesTrackerProps {
  albums: MemoryAlbums;
  onUpdateAlbums: () => void;
}

const ALBUM_TYPES: Array<{ id: keyof MemoryAlbums, label: string, icon: any }> = [
  { id: 'bump', label: 'Bump Photos', icon: CameraIcon },
  { id: 'baby', label: 'Baby Moments', icon: Baby },
  { id: 'ultrasound', label: 'Ultrasounds', icon: Heart },
  { id: 'nursery', label: 'Nursery', icon: Home },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'other', label: 'Other', icon: Sparkles },
];

export const MemoriesTracker: React.FC<MemoriesTrackerProps> = ({ albums, onUpdateAlbums }) => {
  const [pendingAdd, setPendingAdd] = useState<{ type: keyof MemoryAlbums; url: string } | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');
  const [activePhoto, setActivePhoto] = useState<MemoryPhoto | null>(null);

  const handleAddPhoto = (type: keyof MemoryAlbums) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPendingCaption('');
          setPendingAdd({ type, url: base64String });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALBUM_TYPES.map((album) => (
          <div key={album.id} className="card-premium p-6 bg-white border-2 border-white space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                  <album.icon size={20} />
                </div>
                <h3 className="text-lg font-serif text-slate-800">{album.label}</h3>
              </div>
              <button 
                onClick={() => handleAddPhoto(album.id)}
                className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {albums[album.id]?.length === 0 ? (
                <div className="col-span-3 py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No photos yet</p>
                </div>
              ) : (
                albums[album.id]?.slice(0, 6).map((photo) => (
                  <motion.button
                    key={photo.id}
                    layoutId={photo.id}
                    onClick={() => setActivePhoto(photo)}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer"
                  >
                    <img 
                      src={photo.url} 
                      alt="Memory" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </motion.button>
                ))
              )}
            </div>
            
            {albums[album.id]?.length > 6 && (
              <p className="text-[10px] text-center font-bold text-slate-400">
                + {albums[album.id].length - 6} more photos
              </p>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {pendingAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[900] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPendingAdd(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-serif text-slate-900">Add memory</h3>
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                <img src={pendingAdd.url} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Caption (1–2 lines)</label>
                <textarea
                  value={pendingCaption}
                  onChange={(e) => setPendingCaption(e.target.value)}
                  rows={2}
                  maxLength={140}
                  placeholder="A tiny note about this moment…"
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-rose-100 focus:bg-white outline-none text-sm font-semibold transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPendingAdd(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const photo: MemoryPhoto = {
                      id: crypto.randomUUID(),
                      url: pendingAdd.url,
                      caption: pendingCaption.trim() || undefined,
                      timestamp: Date.now(),
                    };
                    storage.saveAlbumPhoto(pendingAdd.type, photo);
                    onUpdateAlbums();
                    setPendingAdd(null);
                  }}
                  className="flex-1 py-4 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[950] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="max-h-[70vh] bg-black">
                  <img src={activePhoto.url} alt="Memory" className="w-full h-full object-contain max-h-[70vh]" />
                </div>
                {(activePhoto.caption || activePhoto.timestamp) && (
                  <div className="p-5 space-y-1">
                    {activePhoto.caption && <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{activePhoto.caption}</p>}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(activePhoto.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
