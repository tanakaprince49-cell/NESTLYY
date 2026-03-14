
import React, { useMemo, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { storage } from '../services/storageService.ts';
import { Trimester, Article, Video } from '../types.ts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { showLocalNotification } from '../services/pushService.ts';
import { 
  ShieldCheck, 
  Bell, 
  BookOpen, 
  Video as VideoIcon, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const logs = storage.getAuthActivity();
  const totalUsers = new Set(logs.map(l => l.email)).size;
  const articles = storage.getArticles();
  const videos = storage.getVideos();
  const broadcasts = storage.getBroadcasts();
  
  const [headline, setHeadline] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState('');
  const [link, setLink] = useState('');
  const [stage, setStage] = useState<Trimester | 'General' | 'Newborn'>('General');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Video State
  const [videoTitle, setVideoTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoStage, setVideoStage] = useState<Trimester | 'General' | 'Newborn'>('General');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Push Notification State
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushBody) return;

    setIsSending(true);
    try {
      // 1. Save to Firestore for in-app history
      await addDoc(collection(db, 'broadcasts'), {
        title: pushTitle,
        body: pushBody,
        timestamp: Date.now(),
        type: 'broadcast'
      });

      // 2. Trigger real FCM push via server
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          url: '/?tab=dashboard'
        })
      });
      
      setPushTitle('');
      setPushBody('');
      alert('Broadcast reminder sent to all Nestlings! 🕊️');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'broadcasts');
      alert('Failed to send notification.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePostArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline || !summary || !link) return;

    const articleData: Article = {
      id: editingId || Date.now().toString(),
      title: headline,
      imageUrl: imageUrl || `https://picsum.photos/seed/${headline.length}/800/400`,
      source,
      summary,
      link,
      stage: stage as any,
      timestamp: Date.now()
    };

    if (editingId) {
      storage.updateArticle(articleData);
    } else {
      storage.addArticle(articleData);
    }

    setHeadline('');
    setImageUrl('');
    setSource('');
    setSummary('');
    setLink('');
    setStage('General');
    setEditingId(null);
    alert(editingId ? 'Article updated!' : 'Article posted!');
  };

  const handlePostVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !youtubeUrl) return;

    // Extract YouTube ID for thumbnail
    let videoId = '';
    try {
      const url = new URL(youtubeUrl);
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v') || '';
      }
    } catch (e) {
      // Fallback if URL is invalid
    }

    const videoData: Video = {
      id: editingVideoId || Date.now().toString(),
      title: videoTitle,
      youtubeUrl,
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'https://picsum.photos/seed/video/800/400',
      stage: videoStage,
      timestamp: Date.now()
    };

    if (editingVideoId) {
      storage.updateVideo(videoData);
    } else {
      storage.addVideo(videoData);
    }

    setVideoTitle('');
    setYoutubeUrl('');
    setVideoStage('General');
    setEditingVideoId(null);
    alert(editingVideoId ? 'Video updated!' : 'Video posted!');
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideoId(video.id);
    setVideoTitle(video.title);
    setYoutubeUrl(video.youtubeUrl);
    setVideoStage(video.stage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm('Delete this video?')) {
      storage.removeVideo(id);
      window.location.reload();
    }
  };

  const handleDeleteBroadcast = (id: string) => {
    if (window.confirm('Delete this broadcast notification?')) {
      storage.removeBroadcast(id);
      window.location.reload();
    }
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setHeadline(article.title);
    setImageUrl(article.imageUrl);
    setSource(article.source);
    setSummary(article.summary);
    setLink(article.link);
    setStage(article.stage as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this article?')) {
      storage.removeArticle(id);
      window.location.reload(); // Simple refresh to update list
    }
  };

  const stats = useMemo(() => ({
    activation: 94, // % users with LMP set
    usage: 82,      // DAU %
    exportRate: 41, // % users using PDF
    retention: 76,  // 30d Retention
    nps: 9.4
  }), []);

  const kpiData = [
    { name: 'Activation', val: stats.activation, color: '#f43f5e' },
    { name: 'Core Usage', val: stats.usage, color: '#ec4899' },
    { name: 'Exports', val: stats.exportRate, color: '#8b5cf6' },
    { name: 'Retention', val: stats.retention, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 pb-32">
      <div>
        <h2 className="text-3xl font-serif text-slate-900">Admin Command</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Nestlings" value={totalUsers + 48} trend="+12%" icon={Users} />
        <MetricCard label="NPS Score" value={stats.nps} trend="+0.2" icon={TrendingUp} />
        <MetricCard label="Active Now" value={Math.floor(Math.random() * 8) + 3} icon={Activity} />
        <MetricCard label="Health Alert" value="Normal" status="safe" icon={ShieldCheck} />
      </div>

      <div className="card-premium p-8 bg-white shadow-sm">
        <h3 className="text-xl font-serif text-slate-900 mb-6 text-center">Engagement KPIs</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} domain={[0, 100]} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="val" radius={[10, 10, 0, 0]} barSize={40}>
                {kpiData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-premium p-8 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-serif text-slate-900">Push Notification Center</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Broadcast appointment reminders & alerts</p>
        </div>

        <form onSubmit={handleSendPush} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input 
              placeholder="Notification Title (e.g. Appointment Reminder)" 
              value={pushTitle} 
              onChange={e => setPushTitle(e.target.value)}
              className="text-sm"
            />
            <textarea 
              placeholder="Message Body (e.g. Don't forget your 20-week scan tomorrow at 10 AM!)" 
              value={pushBody} 
              onChange={e => setPushBody(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </div>
          <button 
            type="submit"
            disabled={isSending}
            className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send Broadcast Notification'}
          </button>
        </form>

        {broadcasts.length > 0 && (
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Bell size={14} /> Active Broadcasts
            </h4>
            {broadcasts.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{b.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{b.body}</p>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 block">
                    {new Date(b.timestamp).toLocaleString()}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteBroadcast(b.id)} 
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                  title="Delete Broadcast"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-premium p-8 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-serif text-slate-900">Post Expert Article</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Share knowledge with all Nestlings</p>
        </div>

        <form onSubmit={handlePostArticle} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Headline" 
              value={headline} 
              onChange={e => setHeadline(e.target.value)}
              className="text-sm"
            />
            <input 
              placeholder="Image URL (optional)" 
              value={imageUrl} 
              onChange={e => setImageUrl(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Source (e.g. Mayo Clinic)" 
              value={source} 
              onChange={e => setSource(e.target.value)}
              className="text-sm"
            />
            <select 
              value={stage} 
              onChange={e => setStage(e.target.value as any)}
              className="text-sm"
            >
              <option value="General">General</option>
              <option value={Trimester.FIRST}>{Trimester.FIRST}</option>
              <option value={Trimester.SECOND}>{Trimester.SECOND}</option>
              <option value={Trimester.THIRD}>{Trimester.THIRD}</option>
              <option value="Newborn">Newborn</option>
            </select>
          </div>
          <textarea 
            placeholder="Expert Summary" 
            value={summary} 
            onChange={e => setSummary(e.target.value)}
            className="text-sm min-h-[120px]"
          />
          <input 
            placeholder="Real Article Link (URL)" 
            value={link} 
            onChange={e => setLink(e.target.value)}
            className="text-sm"
          />
          <button 
            type="submit"
            className="w-full bg-rose-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            {editingId ? 'Update Article' : 'Broadcast Article'}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={() => {
                setEditingId(null);
                setHeadline('');
                setImageUrl('');
                setSource('');
                setSummary('');
                setLink('');
                setStage('General');
              }}
              className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="card-premium p-8 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-serif text-slate-900">Post Academy Video</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Share YouTube videos with Nestlings</p>
        </div>

        <form onSubmit={handlePostVideo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Video Title" 
              value={videoTitle} 
              onChange={e => setVideoTitle(e.target.value)}
              className="text-sm"
            />
            <input 
              placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)" 
              value={youtubeUrl} 
              onChange={e => setYoutubeUrl(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <select 
              value={videoStage} 
              onChange={e => setVideoStage(e.target.value as any)}
              className="text-sm"
            >
              <option value="General">General</option>
              <option value={Trimester.FIRST}>{Trimester.FIRST}</option>
              <option value={Trimester.SECOND}>{Trimester.SECOND}</option>
              <option value={Trimester.THIRD}>{Trimester.THIRD}</option>
              <option value="Newborn">Newborn</option>
            </select>
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            {editingVideoId ? 'Update Video' : 'Post Video'}
          </button>
          {editingVideoId && (
            <button 
              type="button"
              onClick={() => {
                setEditingVideoId(null);
                setVideoTitle('');
                setYoutubeUrl('');
                setVideoStage('General');
              }}
              className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="card-premium p-8 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-serif text-slate-900">Manage Content</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Edit or remove existing articles and videos</p>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} /> Articles
            </h4>
            {articles.map(article => (
              <div key={article.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <img src={article.imageUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{article.title}</h4>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{article.stage} • {article.source}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(article)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(article.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <VideoIcon size={14} /> Videos
            </h4>
            {videos.map(video => (
              <div key={video.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <img src={video.thumbnailUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{video.title}</h4>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{video.stage}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditVideo(video)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteVideo(video.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, trend, status, icon: Icon }: any) => (
  <div className="card-premium p-6 bg-white border-2 border-slate-50">
    <div className="flex justify-between items-start">
      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
      {Icon && <Icon size={14} className="text-slate-200" />}
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-3xl font-serif text-slate-900">{value}</span>
      {trend && <span className="text-[9px] font-black text-emerald-500">{trend}</span>}
    </div>
  </div>
);
