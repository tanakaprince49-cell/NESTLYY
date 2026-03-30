import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Database, 
  Trash2, 
  X, 
  Apple, 
  Stethoscope, 
  PartyPopper, 
  FileText, 
  Heart,
  Send,
  User,
  Mic
} from 'lucide-react';
import { getAvaResponse, speak, listen } from '../services/geminiService.ts';
import { PregnancyProfile, ChatMessage, AvaMemoryFact } from '../types.ts';
import { storage } from '../services/storageService.ts';

export const AvaChat: React.FC<{ profile: PregnancyProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getAvaHistory());
  const [memoryBank] = useState<AvaMemoryFact[]>(() => storage.getAvaMemory());
  const [showVault, setShowVault] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avaImage, setAvaImage] = useState<string | null>(() => storage.getAvaImage());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const memoryStrings = (memoryBank || []).map(m => m.content);
      
      // Map local 'model' role to service expected 'assistant' role
      const historyForApi = (newMessages || []).map(m => ({
        role: (m.role === 'model' ? 'assistant' : 'user') as "user" | "assistant",
        text: m.text
      }));

      const response = await getAvaResponse(userText);

      const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: response, timestamp: Date.now() };
      setMessages([...newMessages, modelMsg]);
      
      if (isSpeaking) {
        speak(response);
      }
    } catch (err) {
      setMessages([...newMessages, { id: crypto.randomUUID(), role: 'model', text: "Ava is taking a quiet moment 💕", timestamp: Date.now() }]);
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
    setMessages([]);
    storage.saveAvaHistory([]);
    setShowClearConfirm(false);
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
    }
  };

  const handleListen = () => {
    setIsListening(true);
    listen((text) => {
      setIsListening(false);
      setInput(text);
    });
  };

  return (
    <div className="flex flex-col h-[75vh] px-5 animate-slide-up relative z-20">
      {/* Ava Header */}
      <div className="flex items-center justify-between py-6 px-4 mb-4 border-b border-rose-50/20 bg-white/40 backdrop-blur-xl rounded-t-[3rem]">
        <div className="flex items-center gap-4">
          <div 
            onClick={handleImageClick}
            className="w-12 h-12 bg-rose-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white cursor-pointer group relative shrink-0 transition-transform active:scale-95"
          >
            {avaImage ? (
              <img src={avaImage} alt="Ava" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <span className="text-rose-200"><Sparkles size={24} /></span>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] text-white font-black uppercase tracking-tighter">Edit</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />

          <div>
            <h2 className="text-xl font-serif text-slate-900 leading-none tracking-tight">Ava</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">WHO-Verified Companion</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleSpeech}
            className={`p-3 rounded-2xl bg-white border-2 transition-all active:scale-90 flex items-center justify-center ${isSpeaking ? 'border-rose-400 text-rose-500 shadow-md' : 'border-slate-100 text-slate-300'}`}
          >
            {isSpeaking ? (
              <Volume2 size={20} strokeWidth={3} />
            ) : (
              <VolumeX size={20} strokeWidth={3} />
            )}
          </button>
          <button 
            onClick={() => setShowVault(!showVault)}
            className={`p-3 rounded-2xl bg-white border-2 transition-all active:scale-90 flex items-center justify-center ${showVault ? 'border-rose-400 text-rose-500 shadow-md' : 'border-slate-100 text-slate-300'}`}
          >
            <Database size={20} strokeWidth={3} />
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)} 
            className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
          >
            <Trash2 size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-4 no-scrollbar pb-24 relative">
        {showClearConfirm && (
          <div className="absolute inset-0 z-[60] bg-[#fffaf9]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 rounded-b-[2rem]">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-serif text-slate-900 mb-2">Clear Conversation?</h3>
            <p className="text-xs text-slate-500 mb-8 max-w-[200px]">This will delete our chat history, but I'll still remember your journey facts.</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={clearChat} className="w-full py-4 bg-rose-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Yes, Clear Chat</button>
              <button onClick={() => setShowClearConfirm(false)} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}

        {showVault && (
          <div className="absolute inset-0 z-50 bg-[#fffaf9]/95 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 overflow-y-auto rounded-b-[2rem]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-rose-900">Ava's Memory Vault</h3>
              <button onClick={() => setShowVault(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-6">Stored journey facts</p>
            
            <div className="space-y-3">
              {memoryBank?.length > 0 ? memoryBank.map(fact => (
                <div key={fact.id} className="p-4 bg-white border border-rose-50 rounded-2xl shadow-sm flex items-start gap-4">
                  <span className="text-rose-400">
                    {fact.category === 'preference' ? <Apple size={20} /> : fact.category === 'symptom' ? <Stethoscope size={20} /> : fact.category === 'milestone' ? <PartyPopper size={20} /> : <FileText size={20} />}
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
            <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-300 mb-6 shadow-inner border border-rose-100 animate-float">
              <Heart size={40} fill="currentColor" />
            </div>
            <p className="text-sm text-slate-500 italic max-w-xs leading-relaxed">"Bonjour {profile.userName}! I'm Ava. How can I support you today?"</p>
          </div>
        )}
        {messages?.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 animate-slide-up`}>
            {m.role === 'model' && (
              <div className="w-8 h-8 rounded-xl bg-rose-900 flex items-center justify-center shrink-0 overflow-hidden border border-white shadow-sm">
                {avaImage ? (
                  <img src={avaImage} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles size={14} className="text-rose-200" />
                )}
              </div>
            )}
            <div className={`max-w-[75%] px-6 py-4 rounded-[1.8rem] text-[15px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-rose-900 text-white rounded-br-none shadow-rose-900/20 font-medium' 
                : 'bg-white/90 border border-slate-50 text-slate-800 rounded-bl-none font-medium'
            }`}>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-white shadow-sm">
                {profile.profileImage ? (
                  <img src={profile.profileImage} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-slate-300" />
                )}
              </div>
            )}
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

      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
        <div className="bg-white/30 backdrop-blur-2xl p-3 rounded-[2.2rem] border border-white/60 shadow-xl">
          <form onSubmit={handleSend} className="relative">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Talk to Ava..."
              className="w-full h-14 pl-6 pr-32 bg-white border-none rounded-[2rem] shadow-inner text-base font-medium outline-none focus:ring-4 focus:ring-rose-900/5 transition-all"
            />
            <div className="absolute right-2 top-2 bottom-2 flex gap-2">
              <button 
                type="button"
                onClick={handleListen}
                className={`px-4 rounded-[1.5rem] transition-all active:scale-95 flex items-center justify-center ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}
              >
                <Mic size={20} />
              </button>
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 bg-rose-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-40 transition-all"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};