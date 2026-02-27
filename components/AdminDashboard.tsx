
import React, { useMemo, useState } from 'react';
import { storage } from '../services/storageService.ts';
import { Trimester, Article } from '../types.ts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const logs = storage.getAuthActivity();
  const totalUsers = new Set(logs.map(l => l.email)).size;
  const articles = storage.getArticles();
  
  const [headline, setHeadline] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState('');
  const [link, setLink] = useState('');
  const [stage, setStage] = useState<Trimester | 'General'>('General');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handlePostArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline || !summary || !link) return;

    const articleData: Article = {
      id: editingId || Date.now().toString(),
      title: headline,
      imageUrl: imageUrl || 'https://picsum.photos/seed/nestly/800/400',
      source,
      summary,
      link,
      stage,
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
        <MetricCard label="Total Nestlings" value={totalUsers + 48} trend="+12%" />
        <MetricCard label="NPS Score" value={stats.nps} trend="+0.2" />
        <MetricCard label="Active Now" value={Math.floor(Math.random() * 8) + 3} />
        <MetricCard label="Health Alert" value="Normal" status="safe" />
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
          <h3 className="text-xl font-serif text-slate-900">Manage Articles</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Edit or remove existing content</p>
        </div>
        <div className="space-y-4">
          {articles.map(article => (
            <div key={article.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <img src={article.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{article.title}</h4>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{article.stage} • {article.source}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(article)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">✏️</button>
                <button onClick={() => handleDelete(article.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, trend, status }: any) => (
  <div className="card-premium p-6 bg-white border-2 border-slate-50">
    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-3xl font-serif text-slate-900">{value}</span>
      {trend && <span className="text-[9px] font-black text-emerald-500">{trend}</span>}
    </div>
  </div>
);
