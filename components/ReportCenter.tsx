import React, { useState } from 'react';
import { storage } from '../services/storageService.ts';
import { generateDailyReport, generateLaborReport } from '../services/reportService.ts';

export const ReportCenter: React.FC = () => {
  const availableDates = storage.getAvailableReportDates();
  const [selectedDate, setSelectedDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0]);

  const handleDownloadDaily = () => {
    generateDailyReport(new Date(selectedDate));
  };

  const handleDownloadLabor = () => {
    generateLaborReport(new Date(selectedDate));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white shadow-sm space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-serif text-rose-900">Report Center</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Archive and export your journey</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
            <div className="relative">
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-rose-100"
              >
                {availableDates.length > 0 ? (
                  availableDates.map(date => (
                    <option key={date} value={date}>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</option>
                  ))
                ) : (
                  <option value={new Date().toISOString().split('T')[0]}>Today (No entries found)</option>
                )}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="grid gap-4 pt-4">
            <button 
              onClick={handleDownloadDaily}
              className="w-full py-5 bg-rose-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Daily Progress PDF
            </button>

            <button 
              onClick={handleDownloadLabor}
              className="w-full py-5 bg-white border-2 border-rose-100 text-rose-500 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Labor Summary PDF
            </button>
          </div>
        </div>

        <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100/50">
          <p className="text-[11px] text-rose-800 font-medium italic leading-relaxed text-center">
            "Your reports are generated locally and securely. Perfect for sharing with your healthcare provider or keeping in your physical baby book."
          </p>
        </div>
      </div>
    </div>
  );
};