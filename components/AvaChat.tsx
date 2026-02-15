import React, { useState, useEffect, useRef } from 'react';
import { getAvaResponse, speakAva } from '../services/geminiService.ts';
import { PregnancyProfile, ChatMessage, AvaMemoryFact } from '../types.ts';
import { storage } from '../services/storageService.ts';

export const AvaChat: React.FC<{ profile: PregnancyProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getAvaHistory());
  const [memoryBank] = useState<AvaMemoryFact[]>(() => storage.getAvaMemory());
  const [showVault, setShowVault] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avaImage, setAvaImage] = useState<string | null>(() => storage.getAvaImage());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storage.saveAvaHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const memoryStrings = memoryBank.map(m => m.content);
      
      // Map app ChatMessage role ('model') to service ChatMessage role ('assistant')
      const historyForApi = newMessages.map(m => ({
        role: (m.role === 'model' ? 'assistant' : 'user') as "user" | "assistant",
        text: m.text
      }));

      const response = await getAvaResponse(
        historyForApi,
        profile.userName,
        memoryStrings
      );

      const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: Date.now() };
      setMessages([...newMessages, modelMsg]);
      
      // Optionally speak the response
      if (isSpeaking) {
        speakAva(response);
      }
    } catch (err) {
      setMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: "I'm having a quiet moment 💕. Please try again.", timestamp: Date.now() }]);
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

  const clearChat = () => {
    if (confirm("Would you like to clear our conversation? I will still remember the things in my memory bank.")) {
      setMessages([]);
      storage.saveAvaHistory([]);
    }
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
    }
  };

  return (
    <div className="flex flex-col h-[75vh] px-5 animate-slide-up relative z-20">
      {/* Ava Header */}
      <div className="flex items-center justify-between py-6 px-4 mb-4 border-b border-rose-50/20 bg-white/40 backdrop-blur-xl rounded-t-[3rem]">
        <div className="flex items-center gap-4">
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
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />

          <div>
            <h2 className="text-xl font-serif text-slate-900 leading-none tracking-tight">Ava</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Nestly Companion</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleSpeech}
            className={`p-3 rounded-2xl bg-white border-2 transition-all active:scale-90 flex items-center justify-center ${isSpeaking ? 'border-rose-400 text-rose-500 shadow-md' : 'border-slate-100 text-slate-300'}`}
            title={isSpeaking ? "Mute Ava" : "Unmute Ava"}
          >
            {isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
          </button>
          <button 
            onClick={() => setShowVault(!showVault)}
            className={`p-3 rounded-2xl bg-white border-2 transition-all active:scale-90 flex items-center justify-center ${showVault ? 'border-rose-400 text-rose-500 shadow-md' : 'border-slate-100 text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 18h.01"/><path d="M10 18h.01"/></svg>
          </button>
          <button 
            onClick={clearChat} 
            className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-4 no-scrollbar pb-24 relative">
        {showVault && (
          <div className="absolute inset-0 z-50 bg-[#fffaf9]/95 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 overflow-y-auto rounded-b-[2rem]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-[#7e1631]">Ava's Memory Vault</h3>
              <button onClick={() => setShowVault(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-6">Stored journey facts</p>
            
            <div className="space-y-3">
              {memoryBank.length > 0 ? memoryBank.map(fact => (
                <div key={fact.id} className="p-4 bg-white border border-rose-50 rounded-2xl shadow-sm flex items-start gap-4">
                  <span className="text-xl">
                    {fact.category === 'preference' ? '🍓' : fact.category === 'symptom' ? '🩺' : fact.category === 'milestone' ? '🎉' : '📝'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 leading-tight">{fact.content}</p>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-2 block">
                      Saved {new Date(fact.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 italic">
                  No saved memories in the vault yet.
                </div>
              )}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center animate-in fade-in duration-1000">
            <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner border border-rose-100 animate-float">🤍</div>
            <p className="text-sm text-slate-500 italic max-w-xs leading-relaxed">"Bonjour {profile.userName}! I'm Ava. How can I support you today?"</p>
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