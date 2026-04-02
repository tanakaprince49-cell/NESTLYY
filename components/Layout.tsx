
import React, { useState, useEffect } from 'react';
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
  ToyBrick,
  Menu,
  X,
  Users
} from 'lucide-react';
import { storage } from '../services/storageService.ts';
import { Logo } from './Logo.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings' | 'village';
  setActiveTab: (tab: 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings' | 'village') => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim()).filter(Boolean);
  const isAdmin = adminEmails.includes(storage.getAuthEmail() || '');
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard' as const, label: 'Nest', icon: Home },
    { id: 'baby' as const, label: 'Growth', icon: TrendingUp },
    { id: 'ava' as const, label: 'Ava', icon: Sparkles, isSpecial: true },
    { id: 'education' as const, label: 'Articles', icon: BookOpen },
    { id: 'tools' as const, label: 'Tools', icon: LayoutGrid },
    { id: 'village' as const, label: 'Village', icon: Users },
    { id: 'settings' as const, label: 'Settings', icon: User },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-screen bg-rose-50">
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

      {/* ===== DESKTOP SIDEBAR (lg+) ===== */}
      {isDesktop && (
        <aside 
          className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-[120] bg-white/60 backdrop-blur-xl border-r border-rose-100/50 transition-all duration-300 ${
            sidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
          }`}
        >
          {/* Sidebar Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <Logo className="w-10 h-10 shrink-0" />
              {!sidebarCollapsed && (
                <h1 className="text-xl font-serif text-rose-900 tracking-tight">Nestly</h1>
              )}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-rose-900 transition-colors rounded-lg hover:bg-rose-50"
            >
              {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
          </div>

          {/* Profile Card */}
          {!sidebarCollapsed && storage.getProfile()?.profileImage && (
            <div className="mx-4 mb-4 p-3 bg-rose-50/60 rounded-2xl flex items-center gap-3">
              <img 
                src={storage.getProfile()?.profileImage!} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
              />
              <div className="truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{storage.getProfile()?.userName || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{storage.getAuthEmail()}</p>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <SidebarNavItem 
                key={item.id}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                label={item.label}
                icon={item.icon}
                isSpecial={item.isSpecial}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-rose-100/50">
            <button 
              onClick={onLogout}
              className={`flex items-center gap-3 w-full p-3 rounded-2xl text-slate-400 hover:text-rose-900 hover:bg-rose-50 transition-all ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut size={20} strokeWidth={2} />
              {!sidebarCollapsed && (
                <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header (mobile & tablet only) */}
        <header className="lg:hidden relative z-[110] px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-rose-50/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-serif text-rose-900 tracking-tight">Nestly</h1>
          </div>
          <div className="flex items-center gap-4">
            {storage.getProfile()?.profileImage && (
              <img 
                src={storage.getProfile()?.profileImage!} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" 
              />
            )}
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-900 transition-colors"
              title="Logout"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* Desktop Top Bar */}
        {isDesktop && (
          <header className="hidden lg:flex relative z-[110] px-8 pt-6 pb-4 items-center justify-between shrink-0 bg-rose-50/40 backdrop-blur-sm border-b border-rose-100/30">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                {activeTab === 'dashboard' ? 'Home' : activeTab === 'baby' ? 'Baby Growth' : activeTab === 'ava' ? 'AI Assistant' : activeTab === 'education' ? 'Education' : activeTab === 'tools' ? 'Tools Hub' : activeTab === 'village' ? 'Village Hub' : activeTab === 'settings' ? 'Settings' : 'Admin'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {storage.getProfile()?.profileImage && (
                <img 
                  src={storage.getProfile()?.profileImage!} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" 
                />
              )}
            </div>
          </header>
        )}

        <main id="main-scroll" className="flex-1 relative z-10 overflow-y-auto no-scrollbar pb-safe">
          <div className="animate-slide-up pb-32 lg:pb-12">
            {children}
            
            <div className="px-6 py-12 mt-8 border-t border-rose-100/50 text-center space-y-4">
              <div className="flex justify-center items-center gap-2 text-rose-900/40">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinically Supported</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] md:max-w-[400px] mx-auto font-medium">
                Nestly provides health information supported by clinical guidelines from the <span className="text-rose-900/60 font-bold">World Health Organization (WHO)</span>.
              </p>
              <div className="pt-4 opacity-20">
                <Logo className="w-6 h-6 mx-auto grayscale" />
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation (mobile & tablet only) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-[calc(1rem + var(--safe-area-inset-bottom))]">
          <nav className="mx-auto w-full max-w-[600px] bg-white/30 backdrop-blur-3xl px-2 py-2 rounded-[2.5rem] flex justify-between items-center shadow-[0_20px_50px_rgba(126,22,49,0.06)] border border-white/20">
            {navItems.map(item => (
              <NavItem 
                key={item.id}
                active={activeTab === item.id} 
                onClick={() => setActiveTab(item.id)} 
                label={item.label} 
                icon={item.icon} 
                isSpecial={item.isSpecial} 
              />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

/* ===== Desktop Sidebar Nav Item ===== */
const SidebarNavItem = ({ active, onClick, label, icon: Icon, isSpecial, collapsed }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
      active 
        ? 'bg-rose-50 text-rose-900 shadow-sm' 
        : 'text-slate-500 hover:bg-rose-50/50 hover:text-rose-800'
    } ${collapsed ? 'justify-center px-2' : ''}`}
  >
    <div className={`shrink-0 ${isSpecial && !active ? 'animate-pulse' : ''}`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    {!collapsed && (
      <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${active ? 'text-rose-900' : ''}`}>
        {label}
      </span>
    )}
    {active && (
      <motion.div 
        layoutId="sidebar-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-900 rounded-r-full" 
      />
    )}
  </button>
);

/* ===== Mobile Bottom Nav Item ===== */
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
