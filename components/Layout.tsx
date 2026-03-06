
import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  LayoutGrid, 
  User, 
  ShieldCheck,
  LogOut,
  ToyBrick
} from 'lucide-react';
import { storage } from '../services/storageService.ts';
import { Logo } from './Logo.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings') => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const isAdmin = storage.getAuthEmail() === 'tanakaprince49@gmail.com';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-screen bg-rose-50">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.08]">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] text-rose-900"
        >
          <ToyBrick size={64} />
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -8, 8, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] right-[10%] text-rose-900"
        >
          <ToyBrick size={72} />
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] left-[20%] text-rose-900"
        >
          <ToyBrick size={48} />
        </motion.div>
      </div>

      {/* Header */}
      <header className="relative z-[110] px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-rose-50/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <h1 className="text-2xl font-serif text-rose-900 tracking-tight">Nestly</h1>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-900 transition-colors"
          title="Logout"
        >
          <LogOut size={20} strokeWidth={2.5} />
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
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Nest" icon={Home} />
          <NavItem active={activeTab === 'baby'} onClick={() => setActiveTab('baby')} label="Growth" icon={TrendingUp} />
          <NavItem active={activeTab === 'ava'} onClick={() => setActiveTab('ava')} label="Ava" icon={Sparkles} isSpecial />
          <NavItem active={activeTab === 'education'} onClick={() => setActiveTab('education')} label="Academy" icon={BookOpen} />
          <NavItem active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} label="Tools" icon={LayoutGrid} />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" icon={User} />
          {isAdmin && (
            <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" icon={ShieldCheck} />
          )}
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, label, icon: Icon, isSpecial }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center flex-1 py-2 transition-all duration-300 rounded-2xl relative ${active ? 'bg-white/40 shadow-sm' : ''}`}
  >
    <motion.div 
      animate={active ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
      className={`mb-0.5 ${active ? 'text-rose-900' : 'text-slate-400'} ${isSpecial && !active ? 'animate-pulse' : ''}`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </motion.div>
    <span className={`text-[7px] font-black uppercase tracking-[0.1em] ${active ? 'text-rose-900' : 'text-slate-500'}`}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -bottom-1 w-1 h-1 bg-rose-900 rounded-full" 
      />
    )}
  </button>
);
