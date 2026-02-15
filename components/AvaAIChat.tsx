import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, PregnancyProfile } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { getChatResponse } from '../services/geminiService.ts';
import { Logo } from './Logo.tsx';

export const AvaAIChat: React.FC<{ profile: PregnancyProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getChatHistory());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkingInterval = useRef<number | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    storage.saveChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  // Thinking timer logic
  useEffect(() => {
    if (loading) {
      setThinkingSeconds(0);
      thinkingInterval.current = window.setInterval(() => {
        setThinkingSeconds(prev => +(prev + 0.1).toFixed(1));
      }, 100);
    } else {
      if (thinkingInterval.current) {
        clearInterval(thinkingInterval.current);
        thinkingInterval.current = null;
      }
    }
    return () => {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current);
    };
  }, [loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: trimmedInput, 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const system = `You are Ava 💕 Nestly's AI Companion. 
    IDENTITY: Direct, empathetic, and professional.
    CORE DIRECTIVE: Be EXTREMELY concise. Maximum 1-2 sentences. 
    TONE: Human and safe. 
    EMOJIS: Use 🤍 or 🌸 sparingly.
    USER: ${profile.userName}.`;
    
    const history = [...messages, userMsg].map(m => ({ 
      role: m.role === 'user' ? 'user' : 'assistant', 
      content: m.text 
    }));
    
    try {
      const text = await getChatResponse(history, system);
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'model', 
        text, 
        timestamp: Date.now() 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'model', 
        text: "I'm having a quiet moment 🤍. Try again.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] animate-fade-in relative">
      {/* High-Contrast Integrated Header */}
      <header className="px-2 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <div>
            <h2 className="text-2xl font-serif text-slate-900 leading-none">Ava AI</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Always Listening</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { if(confirm("Clear conversation?")) setMessages([]); }} 
          className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </header>

      {/* Message Viewport */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-2 space-y-6 no-scrollbar pb-40"
      >
        {messages.length === 0 && (
          <div className="py-20 text-center px-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-5xl mb-6 border-2 border-rose-100 shadow-sm animate-float">🧸</div>
            <h3 className="text-3xl font-serif text-slate-900 mb-2">Bonjour, {profile.userName}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs">
              I'm Ava, your Nestly companion. How can I support you today? 🌸
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`max-w-[85%] px-6 py-4 rounded-[1.8rem] text-[15px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-rose-500 text-white rounded-br-none font-bold' 
                : 'bg-white text-slate-900 rounded-bl-none font-semibold border-2 border-slate-100'
            }`}>
              {m.text}
              <div className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border-2 border-slate-100 px-6 py-4 rounded-[1.8rem] rounded-bl-none flex items-center gap-4 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-rose-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 tabular-nums">
                Thinking... {thinkingSeconds.toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM INPUT: Anchored above the nav bar */}
      <div className="absolute bottom-4 left-0 right-0 px-2 pb-2">
        <form 
          onSubmit={handleSend} 
          className="flex gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-[2.2rem] border-2 border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        >
          <input 
            autoFocus
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Talk to Ava... 🤍" 
            className="flex-1 h-14 px-6 bg-slate-50 rounded-2xl text-base font-bold outline-none focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all text-slate-900 placeholder:text-slate-300 border-none" 
            disabled={loading} 
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading} 
            className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center disabled:bg-slate-200 transition-all hover:bg-rose-600 active:scale-90 shadow-lg shadow-rose-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};