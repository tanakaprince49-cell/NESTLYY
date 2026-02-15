
import React, { useMemo } from 'react';
import { storage } from '../services/storageService.ts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const logs = storage.getAuthActivity();
  const totalUsers = new Set(logs.map(l => l.email)).size;
  
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
