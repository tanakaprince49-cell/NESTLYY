import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, Heart, Sparkles, Plus, ArrowLeft, Send, X, Trash2, LogOut, ChevronRight, Image as ImageIcon, Video as VideoIcon, MoreVertical, Shield, Link as LinkIcon, Camera, Search, Compass, MessageCircle, Share2, Settings as SettingsIcon, Ban } from 'lucide-react';
import { PregnancyProfile, NestCategory, Nest, NestPost, NestMembership, NestStory, NestComment } from '../types.ts';
import { villageService } from '../services/villageService.ts';
import { TEMPLATE_NESTS } from '../services/villageTemplates.ts';
import { storage } from '../services/storageService.ts';
import { db } from '../firebase.ts';

interface VillageHubProps {
  profile: PregnancyProfile;
}

type View = 'discover' | 'my-nests' | 'nest-detail';

const CATEGORIES: { label: string; value: NestCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'General', value: 'general' },
  { label: 'Trimester', value: 'trimester' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Diet', value: 'diet' },
  { label: 'Support', value: 'support' },
  { label: 'Postpartum', value: 'postpartum' },
];

export const VillageHub: React.FC<VillageHubProps> = ({ profile }) => {
  const [view, setView] = useState<View>('discover');
  const [selectedNestId, setSelectedNestId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NestCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [nests, setNests] = useState<Nest[]>([]);
  const [memberships, setMemberships] = useState<NestMembership[]>([]);
  
  const currentUserEmail = storage.getAuthEmail() || 'guest';
  
  const previousNestsRef = useRef<Record<string, Nest>>({});
  const joinedIdsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Request permission once
    if ('Notification' in window && Notification.permission === 'default') {
       Notification.requestPermission();
    }

    const unsubNests = villageService.subscribeToNests((fetchedNests) => {
      const mergedNests = [...TEMPLATE_NESTS];
      
      fetchedNests.forEach(fn => {
        // --- Notification Logic ---
        const prev = previousNestsRef.current[fn.id];
        if (
          prev && 
          fn.lastPostTime && 
          (!prev.lastPostTime || fn.lastPostTime > prev.lastPostTime) && 
          fn.lastPostAuthor !== profile.userName &&
          joinedIdsRef.current.has(fn.id)
        ) {
            if (Notification.permission === 'granted') {
               try {
                 new Notification(`New post in ${fn.name} 🌿`, {
                   body: `${fn.lastPostAuthor}: ${fn.lastPostText}`,
                   icon: fn.profilePic || undefined
                 });
               } catch (err) {
                 console.log("Push notification failed", err);
               }
            }
        }
        previousNestsRef.current[fn.id] = fn;
        // --- End Notification Logic ---

        const existingIdx = mergedNests.findIndex(t => t.id === fn.id);
        if (existingIdx >= 0) {
           mergedNests[existingIdx] = fn; // Overwrite template with live DB data
        } else {
           mergedNests.push(fn);
        }
      });
      setNests(mergedNests);
    });

    const unsubMems = villageService.subscribeToMemberships(currentUserEmail, (mems) => {
      setMemberships(mems);
      joinedIdsRef.current = new Set(mems.map(m => m.nestId));
    });

    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite && currentUserEmail !== 'guest') {
      villageService.getInvite(pendingInvite).then((invite) => {
        if (invite && invite.expiresAt > Date.now()) {
          villageService.joinNest(invite.nestId, currentUserEmail, 'admin').then(() => {
             alert("Group Invite Accepted! You are now an Admin.");
             openNest(invite.nestId);
          });
        } else {
           alert("Invite link is invalid or has expired.");
        }
      });
      sessionStorage.removeItem('pendingInvite');
    }
    
    return () => {
      unsubNests();
      unsubMems();
    };
  }, [currentUserEmail]);

  const joinedIds = new Set(memberships.map(m => m.nestId));
  
  const handleJoin = async (nestId: string) => {
    await villageService.joinNest(nestId, currentUserEmail, 'member');
  };

  const handleLeave = async (nestId: string) => {
    if (!confirm('Leave this group?')) return;
    await villageService.leaveNest(nestId, currentUserEmail);
    if (view === 'nest-detail') setView('my-nests');
  };

  const openNest = (nestId: string) => {
    setSelectedNestId(nestId);
    setView('nest-detail');
  };

  const selectedNest = nests.find(n => n.id === selectedNestId);

  const filteredNests = useMemo(() => {
    let filtered = nests;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.name.toLowerCase().includes(lower) || n.description.toLowerCase().includes(lower));
    }
    return filtered;
  }, [nests, categoryFilter, searchQuery]);

  const joinedNestsNodes = nests.filter(n => joinedIds.has(n.id));

  // ── Discover View ──────────────────────────────────
  if (view === 'discover') {
    return (
      <div className="space-y-6 pb-12 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif text-slate-800 flex items-center gap-2 drop-shadow-sm">
            <Compass className="text-pink-500 animate-pulse" />
            Discover Groups
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setView('my-nests')}
              className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full font-bold text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-pink-100"
            >
              My Groups
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all duration-300 shadow-md"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 group-focus-within:text-pink-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white rounded-full border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:-translate-y-0.5 ${
                categoryFilter === cat.value
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white border-transparent shadow-md'
                  : 'bg-white text-slate-500 border border-pink-100 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNests.map((nest) => (
            <div key={nest.id} className="bg-white p-5 rounded-[2rem] border border-pink-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  {nest.profilePic ? (
                    <img src={nest.profilePic} alt={nest.name} className="w-12 h-12 rounded-2xl object-cover bg-pink-50 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl border border-pink-100 shadow-sm">
                      {nest.emoji || '🌿'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-pink-600 transition-colors">{nest.name}</h3>
                    <p className="text-[10px] uppercase font-black tracking-wider text-pink-400">{nest.memberCount} members</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{nest.description}</p>
              </div>
              
              <div className="relative z-10 mt-auto">
                {joinedIds.has(nest.id) ? (
                  <button
                    onClick={() => openNest(nest.id)}
                    className="w-full py-2.5 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold hover:bg-pink-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Already Joined</span>
                    <ArrowLeft size={14} className="rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(nest.id)}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl text-xs font-bold hover:opacity-90 hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Join Group
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredNests.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500 animate-fade-in">
               <span className="text-4xl mb-3 block">🌸</span>
              No groups found. Create one and start the village!
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateNestModal
            currentUserEmail={currentUserEmail}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (nest) => {
              await villageService.createNest(nest);
              await villageService.joinNest(nest.id, currentUserEmail, 'admin');
              setShowCreateModal(false);
              openNest(nest.id);
            }}
          />
        )}
      </div>
    );
  }

  // ── My Nests View ──────────────────────────────────
  if (view === 'my-nests') {
    return (
      <div className="space-y-6 pb-12 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('discover')} className="p-2 -ml-2 text-pink-400 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">My Groups</h2>
        </div>

        {joinedNestsNodes.length === 0 ? (
          <div className="text-center py-20 px-6 border-2 border-dashed border-pink-200 rounded-3xl animate-fade-in">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Users size={24} className="text-pink-400" />
            </div>
            <p className="text-slate-600 mb-6 font-medium">You haven't joined any groups yet.</p>
            <button
              onClick={() => setView('discover')}
              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Explore Village Hub
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {joinedNestsNodes.map(nest => (
              <button
                key={nest.id}
                onClick={() => openNest(nest.id)}
                className="w-full bg-white p-4 rounded-3xl border border-pink-100 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group"
              >
                {nest.profilePic ? (
                  <img src={nest.profilePic} alt={nest.name} className="w-14 h-14 rounded-2xl object-cover bg-pink-50 shadow-sm" />
                ) : (
                  <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl border border-pink-100 shadow-sm">
                    {nest.emoji || '🌿'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate text-lg group-hover:text-pink-600 transition-colors">{nest.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{nest.description}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                   <ChevronRight size={18} className="text-pink-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Nest Detail View ───────────────────────────────
  if (view === 'nest-detail' && selectedNest) {
    const isMember = memberships.some(m => m.nestId === selectedNest.id);
    const myMembership = memberships.find(m => m.nestId === selectedNest.id);
    const isAdmin = selectedNest.admins?.includes(currentUserEmail) || myMembership?.role === 'admin';
    const hasNoAdmin = selectedNest.hasNoAdmin;

    return (
      <NestDetailView
        nest={selectedNest}
        profile={profile}
        currentUserEmail={currentUserEmail}
        isAdmin={isAdmin}
        hasNoAdmin={hasNoAdmin}
        isMember={isMember}
        onBack={() => setView('discover')}
        onLeave={() => handleLeave(selectedNest.id)}
        onDeleted={() => setView('discover')}
      />
    );
  }

  return null;
};

// ── NEST DETAIL & THREADS UI ─────────────────────────────────

function NestDetailView({ nest, profile, currentUserEmail, isAdmin, hasNoAdmin, isMember, onBack, onLeave, onDeleted }: {
  nest: Nest; profile: PregnancyProfile; currentUserEmail: string; isAdmin: boolean; hasNoAdmin?: boolean; isMember: boolean; onBack: () => void; onLeave: () => void; onDeleted: () => void;
}) {
  const [posts, setPosts] = useState<NestPost[]>([]);
  const [stories, setStories] = useState<NestStory[]>([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewingStory, setViewingStory] = useState<NestStory | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubPosts = villageService.subscribeToPosts(nest.id, setPosts);
    const unsubStories = villageService.subscribeToStories(nest.id, setStories);
    return () => {
      unsubPosts();
      unsubStories();
    };
  }, [nest.id]);

  const handlePost = async () => {
    if (!newPost.trim() && !mediaFile) return;
    setIsUploading(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'video' | null = null;

      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith('video');
        mediaType = isVideo ? 'video' : 'image';
        
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res) => {
          reader.onload = (e) => res(e.target?.result as string);
          reader.readAsDataURL(mediaFile);
        });
        
        mediaUrl = await villageService.uploadMedia(`nests/${nest.id}/posts/${Date.now()}_${mediaFile.name}`, dataUrl);
      }

      const hashtags = newPost.match(/#[a-z0-9_]+/gi) || [];

      const post: any = {
        id: crypto.randomUUID(),
        nestId: nest.id,
        authorId: currentUserEmail,
        authorName: profile.userName || 'Mama',
        authorProfilePic: profile.profileImage || null,
        content: newPost.trim(),
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        hashtags: hashtags.map(h => h.toLowerCase()),
        likedBy: [],
        likeCount: 0,
        comments: [],
        timestamp: Date.now(),
        isTemplate: false,
      };
      
      if (!post.mediaUrl) delete post.mediaUrl;
      if (!post.mediaType) delete post.mediaType;
      if (!post.authorProfilePic) delete post.authorProfilePic;

      await villageService.addPost(post);
      setNewPost('');
      setMediaFile(null);
    } catch (e: any) {
      alert("Failed to post: " + (e.message || 'Unknown error'));
    }
    setIsUploading(false);
  };

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((res) => {
        reader.onload = (e) => res(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const mediaUrl = await villageService.uploadMedia(`nests/${nest.id}/stories/${Date.now()}_${file.name}`, dataUrl);
      
      const story: NestStory = {
        id: crypto.randomUUID(),
        nestId: nest.id,
        authorId: currentUserEmail,
        mediaUrl,
        mediaType: isVideo ? 'video' : 'image',
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
      await villageService.addStory(story);
    } catch (err) {
      alert("Failed to upload story");
    }
  };

  const copyGroupLink = () => {
    // Generate a basic share link to this nest
    const link = `${window.location.origin}?village_nest=${nest.id}`;
    navigator.clipboard.writeText(link);
    alert('Group link copied to share!');
  };
  
  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
       const comment: any = {
         id: crypto.randomUUID(),
         authorId: currentUserEmail,
         authorName: profile.userName || 'Mama',
         authorProfilePic: profile.profileImage || null,
         text: commentText.trim(),
         timestamp: Date.now()
       };
       if (!comment.authorProfilePic) delete comment.authorProfilePic;
       await villageService.addComment(postId, comment);
       setCommentText('');
       setActiveCommentPostId(null);
    } catch (e: any) {
       alert("Failed to submit comment: " + (e.message || 'Unknown error'));
    }
  };

  const renderContentWithTags = (content: string) => {
    const parts = content.split(/(#[a-z0-9_]+|@[a-z0-9_]+)/gi);
    return parts.map((part, i) => {
      if (part.startsWith('#')) return <span key={i} className="text-pink-500 hover:underline cursor-pointer">{part}</span>;
      if (part.startsWith('@')) return <span key={i} className="text-pink-600 font-bold hover:underline cursor-pointer">{part}</span>;
      return part;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-4 border-b border-pink-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-pink-400 rounded-full hover:bg-pink-50 transition-colors"><ArrowLeft size={20} /></button>
        <div className="flex flex-col items-center cursor-pointer hover:opacity-80" onClick={copyGroupLink}>
          <h2 className="text-base font-bold text-slate-900 drop-shadow-sm">{nest.name}</h2>
          <span className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{nest.memberCount} members</span>
        </div>
        <div className="flex items-center">
          <button onClick={copyGroupLink} className="p-2 text-pink-400 hover:text-pink-600 rounded-full hover:bg-pink-50 transition-colors" title="Share Group">
             <Share2 size={18} />
          </button>
          <button onClick={() => setShowOptionsId('group-options')} className="p-2 text-slate-400 rounded-full hover:bg-pink-50 transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>
      
      {showOptionsId === 'group-options' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm" onClick={() => setShowOptionsId(null)}>
          <div className="bg-white p-4 rounded-[2rem] w-full max-w-sm space-y-2 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center pb-3 pt-1 border-b border-pink-50 mb-2">
              <h4 className="font-bold text-slate-800">Group Actions</h4>
            </div>
            {isAdmin && (
              <button onClick={() => { setShowSettings(true); setShowOptionsId(null); }} className="w-full p-4 flex items-center justify-center gap-3 text-slate-700 hover:bg-pink-50 rounded-2xl font-bold transition-colors">
                <SettingsIcon size={18} /> Group Settings
              </button>
            )}
            <button onClick={() => { onLeave(); setShowOptionsId(null); }} className="w-full p-4 flex items-center justify-center gap-3 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-colors">
              <LogOut size={18} /> Leave Group
            </button>
            <button onClick={() => setShowOptionsId(null)} className="w-full p-4 flex items-center justify-center bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showSettings && (
        <AdminSettingsModal 
          nest={nest} 
          currentUserEmail={currentUserEmail}
          onClose={() => setShowSettings(false)} 
          onDeleted={() => { setShowSettings(false); onDeleted(); }} 
        />
      )}

      {/* Stories Viewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex flex-col justify-center animate-fade-in">
          <div className="absolute top-4 right-4 z-10 flex gap-4">
             <button onClick={() => setViewingStory(null)} className="w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors">
               <X size={20} />
             </button>
          </div>
          <div className="w-full max-w-lg mx-auto aspect-[9/16] bg-black relative flex items-center justify-center">
             {viewingStory.mediaType === 'image' ? (
                <img src={viewingStory.mediaUrl} className="w-full h-full object-contain" alt="Story" />
             ) : (
                <video src={viewingStory.mediaUrl} autoPlay controls className="w-full h-full object-contain" />
             )}
          </div>
        </div>
      )}

      {/* Stories - Instagram style horizontal scroll */}
      {isMember && (stories.length > 0 || isAdmin) && (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 border-b border-pink-100">
          {isAdmin && (
            <div className="flex flex-col items-center gap-2 shrink-0 animate-fade-in group">
              <label className="w-16 h-16 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center cursor-pointer hover:border-pink-500 transition-all duration-300 relative bg-pink-50 group-hover:scale-105 shadow-sm">
                <Camera size={20} className="text-pink-400 group-hover:text-pink-500 transition-colors" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Plus size={12} />
                </div>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleCreateStory} />
              </label>
              <span className="text-[10px] font-bold text-pink-500 tracking-wide">Add Story</span>
            </div>
          )}
          {stories.map(story => (
            <div key={story.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer animate-fade-in hover:scale-105 transition-transform duration-300" onClick={() => setViewingStory(story)}>
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-rose-400 via-pink-500 to-fuchsia-400 shadow-md">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                  {story.mediaType === 'image' ? (
                     <img src={story.mediaUrl} alt="story" className="w-full h-full object-cover" />
                  ) : (
                     <video src={story.mediaUrl} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700 w-16 truncate text-center">Group</span>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      {isMember && (hasNoAdmin || true) && (
        <div className="flex gap-4 border-b border-pink-100 pb-6 animate-slide-up">
          <div className="w-10 h-10 rounded-full bg-pink-100 shrink-0 overflow-hidden border border-pink-200 shadow-inner">
            {profile.profileImage ? (
              <img src={profile.profileImage} className="w-full h-full object-cover" alt="Me" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-pink-500">
                {profile.userName?.charAt(0) || 'M'}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="What's going on, mama?"
              className="w-full bg-transparent resize-none text-sm placeholder:text-pink-300 focus:outline-none min-h-[40px] text-slate-800 focus:ring-0"
              autoFocus={false}
            />
            
            {mediaFile && (
              <div className="relative rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 max-h-[300px] shadow-sm animate-fade-in">
                <button onClick={() => setMediaFile(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 z-10 backdrop-blur-sm transition-colors">
                  <X size={16} />
                </button>
                {mediaFile.type.startsWith('video') ? (
                  <video src={URL.createObjectURL(mediaFile)} className="w-full h-full object-cover" />
                ) : (
                  <img src={URL.createObjectURL(mediaFile)} className="w-full h-auto object-cover" alt="Selected" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors flex items-center gap-1 group">
                  <ImageIcon size={18} /> <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Media</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                  if (e.target.files?.[0]) setMediaFile(e.target.files[0]);
                }} />
              </div>
              <button
                onClick={handlePost}
                disabled={isUploading || (!newPost.trim() && !mediaFile)}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-bold rounded-full disabled:opacity-40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md"
              >
                {isUploading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-0 relative z-10">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-pink-300 text-sm italic animate-fade-in flex flex-col items-center">
            <Sparkles size={32} className="mb-4 opacity-50" />
            No posts here yet. Be the first to start the chat!
          </div>
        ) : (
          posts.filter(p => !p.isHidden).map((post, index) => (
            <div key={post.id} className={`flex gap-4 py-6 ${index !== posts.length-1 ? 'border-b border-pink-50' : ''} animate-fade-in`}>
              <div className="w-10 h-10 rounded-full bg-pink-100 shrink-0 overflow-hidden border border-pink-200 shadow-sm">
                {post.authorProfilePic ? (
                  <img src={post.authorProfilePic} className="w-full h-full object-cover" alt={post.authorName} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-pink-500 text-xs text-[10px]">
                    {post.authorName.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 drop-shadow-sm">{post.authorName}</span>
                    <span className="text-[11px] text-slate-400 font-medium">· {timeAgo(post.timestamp)}</span>
                  </div>
                  {isAdmin && (
                    <div className="relative">
                      <button onClick={() => setShowOptionsId(post.id)} className="p-1.5 -mr-2 text-slate-400 hover:text-pink-600 rounded-full transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      {showOptionsId === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-pink-100 rounded-2xl shadow-2xl z-20 py-2 animate-fade-in">
                          <button onClick={() => { villageService.deletePost(post.id); setShowOptionsId(null); }} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-pink-50 font-bold flex items-center gap-3 transition-colors">
                            <Trash2 size={16} /> Delete Post
                          </button>
                          <button onClick={() => { villageService.banUser(nest.id, post.authorId); setShowOptionsId(null); }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-pink-50 font-bold flex items-center gap-3 transition-colors">
                            <Ban size={16} /> Ban User
                          </button>
                          <button onClick={() => { villageService.hidePost(post.id); setShowOptionsId(null); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-3 transition-colors">
                            <Shield size={16} /> Hide Post
                          </button>
                          <div className="my-1 border-t border-slate-100"></div>
                          <button onClick={() => { setShowOptionsId(null); }} className="w-full px-4 py-2 text-center text-sm text-slate-400 hover:bg-slate-50 font-bold transition-colors">
                             Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {renderContentWithTags(post.content)}
                </p>

                {post.mediaUrl && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-pink-100 bg-pink-50/50 shadow-sm transition-transform hover:scale-[1.01] duration-300">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="w-full max-h-[400px] object-cover rounded-2xl" />
                    ) : (
                      <img src={post.mediaUrl} className="w-full h-auto max-h-[400px] object-cover rounded-2xl" alt="Post attachment" />
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-6">
                  <button 
                    onClick={() => villageService.toggleLikePost(post.id, currentUserEmail)}
                    className="flex items-center gap-1.5 group"
                  >
                    <div className={`transition-colors duration-300 ${post.likedBy?.includes(currentUserEmail) ? 'text-rose-500 scale-110' : 'text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-50 p-1 rounded-full'}`}>
                      <Heart size={18} fill={post.likedBy?.includes(currentUserEmail) ? 'currentColor' : 'none'} className="transition-all" />
                    </div>
                    {post.likeCount > 0 && <span className={`text-[12px] font-bold ${post.likedBy?.includes(currentUserEmail) ? 'text-rose-500' : 'text-slate-400'}`}>{post.likeCount}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors group p-1 rounded-full hover:bg-pink-50"
                  >
                    <MessageCircle size={18} className="transition-transform group-hover:scale-110" />
                    {(post.comments?.length || 0) > 0 && <span className="text-[12px] font-bold">{post.comments?.length}</span>}
                  </button>
                  <button onClick={() => copyPostLink(post.id)} className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors group p-1 rounded-full hover:bg-pink-50">
                    <Share2 size={18} className="transition-transform group-hover:scale-110" />
                  </button>
                </div>

                {/* Comments Section */}
                {activeCommentPostId === post.id && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-slide-up">
                    {post.comments?.map(comment => (
                      <div key={comment.id} className="flex gap-3 animate-fade-in group">
                        <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 overflow-hidden shadow-sm">
                          {comment.authorProfilePic ? (
                            <img src={comment.authorProfilePic} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-pink-500 text-[10px]">
                              {comment.authorName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 bg-pink-50 p-3 rounded-2xl rounded-tl-none border border-pink-100/50 shadow-sm transition-colors group-hover:bg-pink-100/50">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-[12px] text-slate-800 drop-shadow-sm">{comment.authorName}</span>
                            <span className="text-[10px] text-pink-400 font-medium">{timeAgo(comment.timestamp)}</span>
                          </div>
                          <p className="text-[13px] text-slate-700">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                       <input 
                         type="text" 
                         value={commentText} 
                         onChange={e => setCommentText(e.target.value)}
                         placeholder="Add a sweet comment..."
                         className="flex-1 text-[13px] rounded-full border border-pink-200 bg-white px-5 py-2 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all shadow-sm"
                         onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                       />
                       <button onClick={() => submitComment(post.id)} disabled={!commentText.trim()} className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white flex items-center justify-center disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md">
                         <Send size={16} className="-ml-0.5" />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── ADMIN SETTINGS MODAL ──────────────────────────

function AdminSettingsModal({ nest, currentUserEmail, onClose, onDeleted }: { nest: Nest; currentUserEmail: string; onClose: () => void; onDeleted: () => void; }) {
  const [name, setName] = useState(nest.name);
  const [description, setDescription] = useState(nest.description);
  const [picFile, setPicFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     try {
       let profilePic = nest.profilePic;
       if (picFile) {
         const reader = new FileReader();
         const dataUrl = await new Promise<string>((res) => {
           reader.onload = (e) => res(e.target?.result as string);
           reader.readAsDataURL(picFile);
         });
         profilePic = await villageService.uploadProfilePic(nest.id, dataUrl);
       }
       await villageService.updateNest(nest.id, { name, description, profilePic });
       onClose();
     } catch (e) {
       alert("Failed to update group");
     }
     setIsLoading(false);
  };

  const generateInviteLink = async () => {
    const invite: NestInvite = {
      id: crypto.randomUUID(),
      nestId: nest.id,
      role: 'admin',
      createdBy: currentUserEmail,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    await villageService.createInvite(invite);
    const link = `${window.location.origin}?invite=${invite.id}`;
    navigator.clipboard.writeText(link);
    alert('Admin invite link copied to clipboard! Share it safely.');
  };

  const handleDelete = async () => {
     if (confirm('Are you absolutely sure you want to delete this group for EVERYONE? This cannot be undone.')) {
        await villageService.deleteNest(nest.id);
        onDeleted();
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
         <div className="flex items-center justify-between mb-6 border-b border-pink-50 pb-2">
            <h3 className="text-xl font-bold text-slate-800">Settings</h3>
            <button onClick={onClose} className="p-2 text-slate-400 rounded-full hover:bg-pink-50 transition-colors"><X size={20} /></button>
         </div>

         <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex justify-center mb-6">
              <label className="relative w-24 h-24 rounded-full bg-pink-50 flex items-center justify-center border-2 border-dashed border-pink-200 cursor-pointer hover:border-pink-400 overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md">
                {picFile ? (
                  <img src={URL.createObjectURL(picFile)} className="w-full h-full object-cover" alt="Profile" />
                ) : nest.profilePic ? (
                  <img src={nest.profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <Camera size={24} className="text-pink-300 group-hover:text-pink-500 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-bold mt-2">Change</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files?.[0]) setPicFile(e.target.files[0]);
                }} />
              </label>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-pink-400 ml-1">Group Name</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all font-bold" />
            </div>

            <div className="pb-4 border-b border-pink-50">
              <span className="text-[10px] uppercase font-bold text-pink-400 ml-1">Description</span>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 px-4 py-3 bg-slate-50 rounded-xl border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all resize-none font-medium" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
               {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button type="button" onClick={generateInviteLink} className="w-full h-12 mt-2 bg-pink-50 text-pink-600 rounded-xl text-sm font-bold shadow-sm hover:bg-pink-100 transition-all flex items-center justify-center gap-2">
               <Shield size={16} /> Invite Admin Link
            </button>
            <button type="button" onClick={handleDelete} className="w-full h-12 mt-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold shadow-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2">
               <Trash2 size={16} /> Delete Entire Group
            </button>
         </form>
      </div>
    </div>
  );
}

// ── CREATE NEST MODAL ────────────────────────────────

function CreateNestModal({ currentUserEmail, onClose, onCreate }: {
  currentUserEmail: string;
  onClose: () => void;
  onCreate: (nest: Nest) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NestCategory>('general');
  const [picFile, setPicFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    let profilePic = undefined;
    const nestId = crypto.randomUUID();

    if (picFile) {
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res) => {
          reader.onload = (e) => res(e.target?.result as string);
          reader.readAsDataURL(picFile);
        });
        profilePic = await villageService.uploadProfilePic(nestId, dataUrl);
      } catch (err) {
        console.error(err);
      }
    }

    onCreate({
      id: nestId,
      name: name.trim(),
      description: description.trim(),
      category,
      memberCount: 1,
      isTemplate: false,
      createdAt: Date.now(),
      createdBy: currentUserEmail,
      admins: [currentUserEmail],
      profilePic
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Create Group</h3>
          <button onClick={onClose} className="p-2 text-slate-400 rounded-full hover:bg-pink-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center mb-6 relative">
            <label className="relative w-28 h-28 rounded-full bg-pink-50 flex items-center justify-center border-2 border-dashed border-pink-200 cursor-pointer hover:border-pink-400 overflow-hidden group transition-all hover:shadow-lg hover:scale-105">
              {picFile ? (
                <img src={URL.createObjectURL(picFile)} className="w-full h-full object-cover" alt="Group Profile" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-pink-300 group-hover:text-pink-500 transition-colors">
                   <Camera size={28} />
                   <span className="text-[10px] font-bold">Add Icon</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold mt-2">Upload</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                if (e.target.files?.[0]) setPicFile(e.target.files[0]);
              }} />
            </label>
            <div className="absolute top-0 right-1/4 w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 text-white flex items-center justify-center pointer-events-none shadow-md">
                <Sparkles size={14} />
            </div>
          </div>

          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group Name"
              className="w-full h-14 px-5 bg-slate-50/50 rounded-2xl border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all font-medium placeholder:text-slate-400"
              maxLength={50}
              required
            />
          </div>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="w-full h-28 px-5 py-4 bg-slate-50/50 rounded-2xl border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none transition-all font-medium placeholder:text-slate-400"
              maxLength={200}
              required
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NestCategory)}
              className="w-full h-14 px-5 bg-slate-50/50 rounded-2xl border border-pink-100 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all appearance-none text-slate-700 font-medium cursor-pointer"
            >
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full h-14 mt-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-2xl text-[15px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
          >
            {isLoading ? 'Creating Magic...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
