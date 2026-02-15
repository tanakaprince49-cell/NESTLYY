
import React, { useState, useEffect, useRef } from 'react';
import { getAvaResponse } from '../services/geminiService.ts';
import { PregnancyProfile } from '../types.ts';
import { storage } from '../services/storageService.ts';

export const AvaChat: React.FC<{ profile: PregnancyProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<{role: "user" | "model", text: string}[]>(() => {
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [avaImage, setAvaImage] = useState<string | null>(() => storage.getAvaImage());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await getAvaResponse(newMessages.map(m => ({
        role: m.role,
        text: m.text
      })), profile.userName);
      setMessages([...newMessages, { role: "model" as const, text: response }]);
    } catch (err) {
      setMessages([...newMessages, { role: "model" as const, text: "I'm having a quiet moment 💕. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvaImage(dataUrl);
        storage.saveAvaImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] px-5 animate-slide-up relative z-20">
      {/* Ava Header */}
      <div className="flex items-center gap-4 py-6 px-4 mb-4 border-b border-rose-50/20 bg-white/40 backdrop-blur-xl rounded-t-[3rem]">
        {/* Interactive Profile Picture */}
        <div 
          onClick={handleImageClick}
          className="w-12 h-12 bg-[#7e1631] rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white cursor-pointer group relative shrink-0 transition-transform active:scale-95"
        >
          {avaImage ? (
            <img src={avaImage} alt="Ava" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          ) : (
            <span className="text-2xl">✨</span>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[8px] text-white font-black uppercase tracking-tighter">Edit</span>
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />

        <div>
          <h2 className="text-xl font-serif text-slate-900 leading-none tracking-tight">Ava</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Nestly Companion</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-4 no-scrollbar pb-24">
        {messages.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center animate-in fade-in duration-1000">
            <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner border border-rose-100 animate-float">🤍</div>
            <p className="text-sm text-slate-500 italic max-w-xs leading-relaxed">"Bonjour {profile.userName}! I'm Ava. How can I assist your wellness today?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-[1.8rem] text-[15px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-[#7e1631] text-white rounded-br-none shadow-[#7e1631]/20 font-medium' 
                : 'bg-white/90 border border-slate-50 text-slate-800 rounded-bl-none font-medium'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/40 px-6 py-4 rounded-[1.8rem] rounded-bl-none shadow-sm flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Ava Input Area */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/30 backdrop-blur-2xl p-3 rounded-[2.2rem] border border-white/60 shadow-xl">
        <form onSubmit={handleSend} className="relative">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Talk to Ava... 🧸"
            className="w-full h-14 pl-6 pr-20 bg-white border-none rounded-[2rem] shadow-inner text-base font-medium outline-none focus:ring-4 focus:ring-[#7e1631]/5 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-[#7e1631] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-40 transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
