import React, { useState, useMemo } from 'react';
import { Users, Heart, Sparkles, Plus, ArrowLeft, Send, X, Trash2, LogOut, ChevronRight } from 'lucide-react';
import { PregnancyProfile, NestCategory, Nest, NestPost } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { TEMPLATE_NESTS, TEMPLATE_POSTS } from '../services/villageTemplates.ts';

interface VillageHubProps {
  profile: PregnancyProfile;
}

type View = 'discover' | 'my-nests' | 'nest-detail';

const CATEGORIES: { label: string; value: NestCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Trimester', value: 'trimester' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Diet', value: 'diet' },
  { label: 'Support', value: 'support' },
  { label: 'Postpartum', value: 'postpartum' },
];

const EMOJI_OPTIONS = ['🌸', '🌿', '🦋', '🌙', '🔥', '💪', '🧘', '🎯', '🫶', '☀️', '🍼', '🎀'];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export const VillageHub: React.FC<VillageHubProps> = ({ profile }) => {
  const [view, setView] = useState<View>('discover');
  const [selectedNestId, setSelectedNestId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NestCategory | 'all'>('all');
  const [, setTick] = useState(0);
  const rerender = () => setTick(t => t + 1);

  const memberships = storage.getNestMemberships();
  const joinedIds = new Set(memberships.map(m => m.nestId));
  const customNests = storage.getCustomNests();

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') return TEMPLATE_NESTS;
    return TEMPLATE_NESTS.filter(n => n.category === categoryFilter);
  }, [categoryFilter]);

  const joinedNests = useMemo(() => {
    const templates = TEMPLATE_NESTS.filter(n => joinedIds.has(n.id));
    const custom = customNests.filter(n => joinedIds.has(n.id));
    return [...custom, ...templates];
  }, [joinedIds, customNests]);

  const openNest = (nestId: string) => {
    setSelectedNestId(nestId);
    setView('nest-detail');
  };

  const handleJoin = (nestId: string) => {
    storage.joinNest(nestId);
    rerender();
  };

  const handleLeave = (nestId: string) => {
    if (!confirm('Leave this nest? Your posts will remain.')) return;
    storage.leaveNest(nestId);
    if (view === 'nest-detail') setView('my-nests');
    rerender();
  };

  const selectedNest = selectedNestId
    ? TEMPLATE_NESTS.find(n => n.id === selectedNestId) || customNests.find(n => n.id === selectedNestId)
    : null;

  // ── Discover View ──────────────────────────────────

  if (view === 'discover') {
    return (
      <div className="space-y-8 pb-12">
        {/* Hero */}
        <div className="bg-rose-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Users size={180} />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Neighborhood Nests</span>
            <h2 className="text-4xl font-serif leading-tight">Find Your <br/>Village, {profile.userName || 'Mama'}.</h2>
            <p className="text-sm font-medium text-rose-100 max-w-xs leading-relaxed opacity-80">
              Motherhood is better when shared. Join a nest and connect with women on the same journey.
            </p>
          </div>
          <div className="flex gap-4 relative z-10 pt-4">
            <button
              onClick={() => setView('my-nests')}
              className="h-14 px-8 bg-white text-rose-900 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              My Nests <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-14 h-14 bg-rose-800 text-white rounded-2xl flex items-center justify-center border border-rose-700/50 hover:bg-rose-700 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-rose-900 text-white shadow-lg'
                  : 'bg-white/60 text-slate-400 hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
          {filteredTemplates.map((nest, i) => (
            <NestCard
              key={nest.id}
              nest={nest}
              isJoined={joinedIds.has(nest.id)}
              onJoin={() => handleJoin(nest.id)}
              onOpen={() => openNest(nest.id)}
              delay={i * 0.05}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No nests in this category yet.</div>
        )}

        {/* Info Footer */}
        <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100/50 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-rose-500 animate-float">
            <Sparkles size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-serif text-slate-800">Why Nests work?</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Small groups of women in the same life stage create instant bonds. Shared context builds trust faster than anything else.
            </p>
          </div>
        </div>

        {showCreateModal && (
          <CreateNestModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(nest) => {
              storage.addCustomNest(nest);
              storage.joinNest(nest.id);
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
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4 px-1">
          <button onClick={() => setView('discover')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-serif text-slate-800">My Nests</h2>
        </div>

        {joinedNests.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <Users size={32} className="text-rose-300" />
            </div>
            <p className="text-slate-400 text-sm">You haven't joined any nests yet.</p>
            <button
              onClick={() => setView('discover')}
              className="btn-nestly text-[10px] font-black uppercase tracking-widest px-6 py-3"
            >
              Discover Nests
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-1">
            {joinedNests.map(nest => {
              const postCount = storage.getNestPosts(nest.id).length +
                TEMPLATE_POSTS.filter(p => p.nestId === nest.id).length;
              return (
                <button
                  key={nest.id}
                  onClick={() => openNest(nest.id)}
                  className="w-full bg-white/60 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all text-left"
                >
                  <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner">
                    {nest.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-serif text-slate-800 truncate">{nest.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {postCount} posts
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              );
            })}
          </div>
        )}

        <div className="px-1">
          <button
            onClick={() => { setView('discover'); setShowCreateModal(true); }}
            className="w-full p-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-rose-300 hover:text-rose-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Create Your Own Nest
          </button>
        </div>
      </div>
    );
  }

  // ── Nest Detail View ───────────────────────────────

  if (view === 'nest-detail' && selectedNest) {
    return (
      <NestDetailView
        nest={selectedNest}
        profile={profile}
        onBack={() => setView('my-nests')}
        onLeave={() => handleLeave(selectedNest.id)}
        onDelete={!selectedNest.isTemplate ? () => {
          if (!confirm('Delete this nest? All posts will be removed.')) return;
          storage.removeCustomNest(selectedNest.id);
          setView('my-nests');
          rerender();
        } : undefined}
        rerender={rerender}
      />
    );
  }

  return null;
};

// ── Sub-components ─────────────────────────────────

function NestCard({ nest, isJoined, onJoin, onOpen, delay }: {
  nest: Nest; isJoined: boolean; onJoin: () => void; onOpen: () => void; delay: number;
}) {
  return (
    <div
      className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-rose-100 transition-all group cursor-pointer shadow-sm hover:shadow-xl animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
      onClick={isJoined ? onOpen : undefined}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="w-14 h-14 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner group-hover:bg-rose-100 transition-colors">
          {nest.emoji}
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </span>
          <span className="text-[10px] font-medium text-slate-400 block mt-1">{nest.memberCount} members</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xl font-serif text-slate-800 group-hover:text-rose-900 transition-colors">{nest.name}</h4>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{nest.description}</p>
        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg">
          {nest.category}
        </span>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100">
        {isJoined ? (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Joined</span>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            className="w-full h-12 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-800 active:scale-95 transition-all"
          >
            Join Nest
          </button>
        )}
      </div>
    </div>
  );
}

function NestDetailView({ nest, profile, onBack, onLeave, onDelete, rerender }: {
  nest: Nest; profile: PregnancyProfile; onBack: () => void; onLeave: () => void;
  onDelete?: () => void; rerender: () => void;
}) {
  const [newPost, setNewPost] = useState('');

  const userPosts = storage.getNestPosts(nest.id);
  const seedPosts = TEMPLATE_POSTS.filter(p => p.nestId === nest.id);
  const allPosts = [...userPosts, ...seedPosts].sort((a, b) => b.timestamp - a.timestamp);

  const handlePost = () => {
    const text = newPost.trim();
    if (!text) return;
    storage.addNestPost({
      id: crypto.randomUUID(),
      nestId: nest.id,
      authorName: profile.userName || 'You',
      content: text,
      likedByUser: false,
      likeCount: 0,
      timestamp: Date.now(),
      isTemplate: false,
    });
    setNewPost('');
    rerender();
  };

  const handleLike = (postId: string, isTemplate: boolean) => {
    if (isTemplate) return;
    storage.toggleNestPostLike(postId);
    rerender();
  };

  const handleDeletePost = (postId: string) => {
    storage.removeNestPost(postId);
    rerender();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-rose-900 text-white p-8 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <span className="text-8xl">{nest.emoji}</span>
        </div>
        <div className="relative z-10 space-y-4">
          <button onClick={onBack} className="p-2 -ml-2 text-rose-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-serif leading-tight">{nest.name}</h2>
          <p className="text-sm text-rose-100 opacity-80 max-w-xs">{nest.description}</p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">
              {nest.memberCount} members
            </span>
            <button
              onClick={onLeave}
              className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <LogOut size={12} /> Leave
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compose */}
      <div className="flex gap-3 px-1">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          placeholder="Share something with the nest..."
          className="flex-1 h-12 px-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 transition-colors"
        />
        <button
          onClick={handlePost}
          disabled={!newPost.trim()}
          className="w-12 h-12 bg-rose-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 hover:bg-rose-800 active:scale-95 transition-all"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-3 px-1">
        {allPosts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No posts yet. Be the first to share!
          </div>
        ) : (
          allPosts.map(post => (
            <div key={post.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-100 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-[10px] font-black text-rose-600">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700">{post.authorName}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{timeAgo(post.timestamp)}</span>
                  </div>
                </div>
                {!post.isTemplate && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{post.content}</p>
              <button
                onClick={() => handleLike(post.id, post.isTemplate)}
                className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${
                  post.likedByUser ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                } ${post.isTemplate ? 'cursor-default' : ''}`}
              >
                <Heart size={14} fill={post.likedByUser ? 'currentColor' : 'none'} />
                {post.likeCount}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CreateNestModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (nest: Nest) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NestCategory>('general');
  const [emoji, setEmoji] = useState('🌸');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category,
      emoji,
      memberCount: 1,
      isTemplate: false,
      createdAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md space-y-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif text-slate-800">Create a Nest</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nest Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yoga Moms"
              className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this nest about?"
              className="w-full h-20 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300 resize-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NestCategory)}
              className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-300"
            >
              <option value="general">General</option>
              <option value="trimester">Trimester</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="diet">Diet</option>
              <option value="support">Support</option>
              <option value="postpartum">Postpartum</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Choose an Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-rose-100 ring-2 ring-rose-400 scale-110' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-14 bg-rose-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-rose-800 active:scale-95 transition-all"
          >
            Create Nest
          </button>
        </form>
      </div>
    </div>
  );
}
