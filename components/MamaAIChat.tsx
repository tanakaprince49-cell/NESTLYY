import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, PregnancyProfile } from '../types.ts';
import { storage } from '../services/storageService.ts';
import { getChatResponse } from '../services/geminiService.ts';

export const MamaAIChat: React.FC<{ profile: PregnancyProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getChatHistory());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.saveChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const system = `You are "Mama AI", an expert pregnancy companion. Your tone is refined, professional, and empathetic. Provide scientifically backed advice for pregnancy nutrition and wellness. If red flag symptoms are mentioned, clearly state that you are an AI and they must contact their medical professional immediately. The user's name is ${profile.userName}.`;
    const history = [...messages, userMsg].map(m => ({ 
      role: m.role === 'user' ? 'user' : 'assistant', 
      content: m.text 
    }));
    
    const text = await getChatResponse(history, system);
    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text, timestamp: Date.now() }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[78vh] card-premium overflow-hidden mt-2 bg-white animate-in zoom-in-95 duration-500">
      {/* Concierge Header */}
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-rose-100 animate-float">🧘‍♀️</div>
          <div>
            <h3 className="text-xl font-serif text-slate-900 leading-none">Mama AI</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nesting Concierge</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { if(confirm("Refresh conversation?")) setMessages([]); }} 
          className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/20">
        {messages.length === 0 && (
          <div className="text-center py-24 px-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center text-5xl mb-8 shadow-xl border border-rose-50">👩‍🍼</div>
            <h4 className="text-2xl font-serif text-slate-900 mb-2 text-balance">Hello, {profile.userName}</h4>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs text-balance opacity-80">
              How can I assist you on your journey today? Ask me about nutrition, symptoms, or baby's growth.
            </p>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
            <div className={`max-w-[85%] px-7 py-5 rounded-[2.5rem] text-sm leading-relaxed shadow-sm font-medium ${
              m.role === 'user' 
                ? 'bg-rose-500 text-white rounded-br-none shadow-rose-200' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
            }`}>
              {m.text}
              <div className={`text-[8px] mt-3 font-black uppercase tracking-widest ${m.role === 'user' ? 'text-white/50 text-right' : 'text-slate-300'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 px-8 py-6 rounded-[2.5rem] rounded-bl-none flex gap-2.5 items-center shadow-sm">
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-rose-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Modern Soft Input */}
      <div className="p-8 bg-white border-t border-slate-50">
        <form onSubmit={handleSend} className="relative">
          <input 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            placeholder="Type your question..." 
            className="w-full h-16 pl-8 pr-24 bg-slate-50 rounded-[2rem] text-sm font-semibold outline-none border-2 border-transparent focus:border-rose-100 focus:bg-white transition-all shadow-inner" 
            disabled={loading} 
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading} 
            className="absolute right-3 top-3 bottom-3 w-14 bg-rose-500 text-white rounded-[1.5rem] flex items-center justify-center disabled:opacity-30 transition-all hover:bg-rose-600 active:scale-90 shadow-lg shadow-rose-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};