
import React, { useState, useMemo } from 'react';
import { Trimester, Article as GlobalArticle } from '../types';
import { storage } from '../services/storageService';

interface LocalArticle {
  id: string;
  title: string;
  category: 'nutrition' | 'safety' | 'wellness' | 'faq';
  trimester: Trimester | 'General';
  content: string;
}

const educationalContent: LocalArticle[] = [
  {
    id: '1',
    title: 'Nausea Relief Guide',
    category: 'wellness',
    trimester: Trimester.FIRST,
    content: 'Morning sickness can be tough. Focus on small, frequent meals. Ginger tea, peppermint, and dry crackers can help. Stay hydrated even if you can only take small sips.'
  },
  {
    id: '2',
    title: 'The Power of Folate',
    category: 'nutrition',
    trimester: Trimester.FIRST,
    content: 'Folate (Vitamin B9) is crucial in the first weeks for the development of your baby’s neural tube. Leafy greens, citrus, and beans are excellent sources.'
  },
  {
    id: '3',
    title: 'Boosting Energy with Iron',
    category: 'nutrition',
    trimester: Trimester.SECOND,
    content: 'In the second trimester, your blood volume increases significantly. You need more iron to support this. Combine iron-rich foods with vitamin C (like an orange with your tofu) for better absorption.'
  },
  {
    id: '4',
    title: 'Heartburn Solutions',
    category: 'wellness',
    trimester: Trimester.THIRD,
    content: 'As baby grows, they can push on your stomach. Eat slowly, avoid lying down immediately after meals, and stick to less spicy or acidic foods if you experience heartburn.'
  },
  {
    id: '5',
    title: 'What foods should I avoid?',
    category: 'safety',
    trimester: 'General',
    content: 'Avoid raw or undercooked meat and fish (sushi), unpasteurized dairy (soft cheeses like brie), and deli meats unless heated until steaming. Wash all produce thoroughly.'
  },
  {
    id: '6',
    title: 'Is coffee safe?',
    category: 'faq',
    trimester: 'General',
    content: 'Most experts agree that limiting caffeine to 200mg per day (about one 12oz cup of coffee) is safe during pregnancy.'
  }
];

export const EducationHub: React.FC<{ trimester: Trimester }> = ({ trimester }) => {
  const [filter, setFilter] = useState<Trimester | 'General' | 'All'>('All');
  const [activeLocalArticle, setActiveLocalArticle] = useState<LocalArticle | null>(null);
  const [activeGlobalArticle, setActiveGlobalArticle] = useState<GlobalArticle | null>(null);

  const globalArticles = useMemo(() => storage.getArticles(), []);

  const filteredLocalArticles = educationalContent.filter(a => {
    if (filter === 'All') return true;
    return a.trimester === filter;
  });

  const filteredGlobalArticles = globalArticles.filter(a => {
    if (filter === 'All') return true;
    return a.stage === filter;
  });

  return (
    <div className="relative space-y-8 pb-12">
      {/* Decorative Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-20">
        <div className="absolute top-[5%] left-[10%] text-4xl animate-float-teddy" style={{ animationDelay: '0s' }}>🧑‍⚕️</div>
        <div className="absolute top-[25%] right-[15%] text-5xl animate-float-teddy" style={{ animationDelay: '2s' }}>🧑‍⚕️</div>
        <div className="absolute top-[45%] left-[20%] text-3xl animate-float-teddy" style={{ animationDelay: '4s' }}>🧑‍⚕️</div>
        <div className="absolute top-[65%] right-[10%] text-6xl animate-float-teddy" style={{ animationDelay: '1s' }}>🧑‍⚕️</div>
        <div className="absolute bottom-[10%] left-[5%] text-4xl animate-float-teddy" style={{ animationDelay: '3s' }}>🧑‍⚕️</div>
        <div className="absolute bottom-[25%] right-[25%] text-5xl animate-float-teddy" style={{ animationDelay: '5s' }}>🧑‍⚕️</div>
        <div className="absolute top-[15%] left-[60%] text-3xl animate-float-teddy" style={{ animationDelay: '1.5s' }}>🧑‍⚕️</div>
        <div className="absolute bottom-[40%] left-[30%] text-4xl animate-float-teddy" style={{ animationDelay: '2.5s' }}>🧑‍⚕️</div>
        <div className="absolute top-[80%] left-[70%] text-5xl animate-float-teddy" style={{ animationDelay: '4.5s' }}>🧑‍⚕️</div>
        <div className="absolute top-[40%] right-[40%] text-4xl animate-float-teddy" style={{ animationDelay: '0.5s' }}>🧑‍⚕️</div>
      </div>

      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl font-serif text-rose-800">Knowledge Center</h2>
        <p className="text-gray-500 text-sm mt-1">Guided information for every step of your journey</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6 px-4">
        {['All', Trimester.FIRST, Trimester.SECOND, Trimester.THIRD, 'General'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border uppercase tracking-wider ${
              filter === t 
                ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105' 
                : 'bg-white/60 backdrop-blur-sm text-gray-400 border-white hover:border-rose-200'
            }`}
          >
            {t.replace(' Trimester', '')}
          </button>
        ))}
      </div>

      {/* Global Expert Articles Section */}
      {filteredGlobalArticles.length > 0 && (
        <div className="space-y-6 px-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-rose-100" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Expert Insights</h3>
            <div className="h-[1px] flex-1 bg-rose-100" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {filteredGlobalArticles.map(article => (
              <div 
                key={article.id}
                onClick={() => setActiveGlobalArticle(article)}
                className="card-premium bg-white overflow-hidden border border-rose-50 hover:border-rose-200 transition-all cursor-pointer group flex flex-col md:flex-row"
              >
                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-rose-500 shadow-sm">
                    {article.stage.replace(' Trimester', '')}
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-center flex-1">
                  <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-2">From {article.source}</span>
                  <h4 className="text-xl font-serif text-rose-900 mb-3 leading-tight group-hover:text-rose-500 transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic mb-4">
                    {article.summary}
                  </p>
                  <div className="flex items-center text-[10px] font-bold text-rose-500 uppercase tracking-widest gap-2">
                    Read Expert Summary
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 px-4">
        <div className="flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-rose-100" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Quick Guides</h3>
          <div className="h-[1px] flex-1 bg-rose-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          {filteredLocalArticles.length > 0 ? (
            filteredLocalArticles.map(article => (
              <div 
                key={article.id}
                onClick={() => setActiveLocalArticle(article)}
                className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/60 shadow-sm hover:shadow-md hover:border-rose-100 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-50/50 text-rose-500 border border-rose-100`}>
                    {article.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {article.trimester.replace(' Trimester', '')}
                  </span>
                </div>
                <h3 className="text-xl font-serif text-rose-900 group-hover:text-rose-500 transition-colors mb-3">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">
                  {article.content}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 italic">
              No articles found for this filter.
            </div>
          )}
        </div>
      </div>

      {/* Local Article Modal */}
      {activeLocalArticle && (
        <div className="fixed inset-0 bg-rose-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white/90 backdrop-blur-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-[3rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 duration-300 border border-white">
            <div className="flex justify-between items-start mb-8">
              <div className="pr-8">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 px-4 py-1.5 rounded-full mb-4 inline-block border border-rose-100">
                  {activeLocalArticle.category}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-rose-900 leading-tight">
                  {activeLocalArticle.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveLocalArticle(null)}
                className="p-3 bg-white/60 rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all shadow-sm border border-white active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="prose prose-rose max-w-none text-gray-700 leading-relaxed text-base sm:text-lg italic">
              {activeLocalArticle.content.split('\n').map((para, i) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
            <div className="mt-12 pt-8 border-t border-rose-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">For: {activeLocalArticle.trimester}</span>
              <button 
                onClick={() => setActiveLocalArticle(null)}
                className="bg-rose-500 text-white font-bold px-10 py-4 rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 uppercase text-[10px] tracking-widest active:scale-95"
              >
                Got it, Mama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Article Modal */}
      {activeGlobalArticle && (
        <div className="fixed inset-0 bg-rose-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white/90 backdrop-blur-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-[3rem] shadow-2xl p-0 animate-in zoom-in-95 duration-300 border border-white">
            <div className="relative h-64 sm:h-80 w-full">
              <img 
                src={activeGlobalArticle.imageUrl} 
                alt={activeGlobalArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              <button 
                onClick={() => setActiveGlobalArticle(null)}
                className="absolute top-6 right-6 p-3 bg-white/60 backdrop-blur rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all shadow-sm border border-white active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-8 sm:p-12 -mt-12 relative z-10">
              <div className="mb-8">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 px-4 py-1.5 rounded-full mb-4 inline-block border border-rose-100">
                  Expert Insight from {activeGlobalArticle.source}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-rose-900 leading-tight">
                  {activeGlobalArticle.title}
                </h2>
              </div>
              <div className="prose prose-rose max-w-none text-gray-700 leading-relaxed text-base sm:text-lg italic">
                {activeGlobalArticle.summary.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
              <div className="mt-12 pt-8 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Source: {activeGlobalArticle.source}</span>
                  <a 
                    href={activeGlobalArticle.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-rose-500 font-bold text-xs underline underline-offset-4 hover:text-rose-600 transition-colors"
                  >
                    Read Full Original Article
                  </a>
                </div>
                <button 
                  onClick={() => setActiveGlobalArticle(null)}
                  className="w-full sm:w-auto bg-rose-500 text-white font-bold px-10 py-4 rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 uppercase text-[10px] tracking-widest active:scale-95"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
