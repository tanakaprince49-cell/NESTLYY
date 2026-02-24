
import React from 'react';
import { storage } from '../services/storageService.ts';
import { Logo } from './Logo.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin') => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const isAdmin = storage.getAuthEmail() === 'tanakaprince49@gmail.com';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-screen bg-[#fffaf9]">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.08]">
        <div className="absolute top-[10%] left-[15%] text-6xl animate-float-teddy" style={{ animationDelay: '0s' }}>🧸</div>
        <div className="absolute top-[30%] right-[10%] text-7xl animate-float-teddy" style={{ animationDelay: '2.5s' }}>🧸</div>
        <div className="absolute bottom-[20%] left-[20%] text-5xl animate-float-teddy" style={{ animationDelay: '5s' }}>🧸</div>
        <div className="absolute top-[55%] left-[40%] text-4xl animate-float-teddy" style={{ animationDelay: '1.2s' }}>🧸</div>
        <div className="absolute bottom-[40%] right-[30%] text-8xl animate-float-teddy" style={{ animationDelay: '3.8s' }}>🧸</div>
      </div>

      {/* Header */}
      <header className="relative z-[110] px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#fffaf9]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <h1 className="text-2xl font-serif text-rose-900 tracking-tight">Nestly</h1>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-900 transition-colors"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </header>

      <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar pb-safe">
        <div className="animate-slide-up pb-32">
          {children}
        </div>
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-[calc(1rem + var(--safe-area-inset-bottom))]">
        <nav className="mx-auto w-full max-w-[440px] bg-white/30 backdrop-blur-3xl px-2 py-2 rounded-[2.5rem] flex justify-between items-center shadow-[0_20px_50px_rgba(126,22,49,0.06)] border border-white/20">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Nest" icon="🏠" />
          <NavItem active={activeTab === 'baby'} onClick={() => setActiveTab('baby')} label="Growth" icon="👶" />
          <NavItem active={activeTab === 'ava'} onClick={() => setActiveTab('ava')} label="Ava" icon="✨" isSpecial />
          <NavItem active={activeTab === 'education'} onClick={() => setActiveTab('education')} label="Academy" icon="📚" />
          <NavItem active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} label="Tools" icon="⚙️" />
          {isAdmin && (
            <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" icon="🛠️" />
          )}
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, label, icon, isSpecial }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center flex-1 py-2 transition-all duration-500 rounded-2xl relative ${active ? 'bg-white/40 shadow-sm' : ''}`}
  >
    <div className={`text-xl mb-0.5 ${isSpecial && !active ? 'animate-pulse' : ''}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-black uppercase tracking-[0.1em] ${active ? 'text-rose-900' : 'text-slate-500'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 w-1 h-1 bg-rose-900 rounded-full" />
    )}
  </button>
);
