import React, { useMemo, useState } from 'react';
import { storage } from '../../services/storageService.ts';
import { MemoryAlbums, MemoryPhoto } from '../../types.ts';
import { AnimatePresence, motion } from 'motion/react';
import { Camera as CameraIcon, Baby, Heart, Home, Users, Sparkles, Plus, X, Images } from 'lucide-react';

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
  const [activeAlbum, setActiveAlbum] = useState<keyof MemoryAlbums | null>(null);
  const [activePhoto, setActivePhoto] = useState<MemoryPhoto | null>(null);
  const [pendingAdd, setPendingAdd] = useState<{ type: keyof MemoryAlbums; url: string } | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');

  const activeAlbumMeta = useMemo(() => {
    if (!activeAlbum) return null;
    return ALBUM_TYPES.find((a) => a.id === activeAlbum) || null;
  }, [activeAlbum]);

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
      <div className="space-y-2 px-1">
        <h3 className="text-2xl font-serif text-rose-900">Memories</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALBUM_TYPES.map((album) => {
          const photos = albums[album.id] || [];
          const cover = photos[0];
          const Icon = album.icon;
          return (
            <motion.button
              key={album.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveAlbum(album.id)}
              className="card-premium p-0 bg-white border-2 border-white overflow-hidden text-left relative"
            >
              <div className="relative h-[180px] md:h-[210px]">
                {cover ? (
                  <img src={cover.url} alt="" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_30%_20%,rgba(255,255,255,0.7),transparent_65%),radial-gradient(closest-side_at_70%_70%,rgba(244,63,94,0.18),transparent_55%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 flex items-center justify-center text-rose-600 shadow-sm">
                    <Icon size={20} />
                  </div>
                  <div className="text-white">
                    <div className="text-lg font-serif drop-shadow-sm">{album.label}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                      {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPhoto(album.id);
                  }}
                  className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 text-rose-700 shadow-sm hover:bg-white/80 transition-colors"
                  aria-label={`Add photo to ${album.label}`}
                >
                  <Plus size={18} />
                </button>

                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2">
                  {photos.slice(0, 4).map((p) => (
                    <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-white/10 border border-white/10">
                      <img src={p.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  {photos.length === 0 &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white/60">
                        <Images size={18} />
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Open album</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Tap</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeAlbum && activeAlbumMeta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[900] bg-black/50 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center"
            onClick={() => setActiveAlbum(null)}
          >
            <motion.div
              initial={{ y: 22, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-3xl bg-white rounded-[2.75rem] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                    <activeAlbumMeta.icon size={20} />
                  </div>
                  <div>
                    <div className="text-xl font-serif text-slate-900">{activeAlbumMeta.label}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {(albums[activeAlbum] || []).length} photos
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPhoto(activeAlbum)}
                    className="px-4 py-2.5 rounded-2xl bg-rose-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-100 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAlbum(null)}
                    className="p-3 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                {(albums[activeAlbum] || []).length === 0 ? (
                  <div className="py-14 text-center border-2 border-dashed border-slate-100 rounded-[2.25rem] bg-slate-50/40">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No photos yet</p>
                    <button
                      type="button"
                      onClick={() => handleAddPhoto(activeAlbum)}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-rose-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-100 active:scale-95 transition-all"
                    >
                      <Plus size={18} />
                      Add first photo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {(albums[activeAlbum] || []).map((photo) => (
                      <motion.button
                        key={photo.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100"
                        onClick={() => setActivePhoto(photo)}
                      >
                        <img src={photo.url} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[950] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPendingAdd(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
            className="fixed inset-0 z-[980] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.98, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-[2.75rem] overflow-hidden shadow-2xl">
                <div className="max-h-[74vh] bg-black">
                  <img src={activePhoto.url} alt="Memory" className="w-full h-full object-contain max-h-[74vh]" />
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
