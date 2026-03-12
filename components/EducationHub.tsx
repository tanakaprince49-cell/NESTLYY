
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Stethoscope, 
  ArrowRight, 
  X,
  HeartPulse,
  BookOpen,
  Video as VideoIcon,
  PlayCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Trimester, Article as GlobalArticle, LifecycleStage, Video } from '../types';
import { storage } from '../services/storageService';

interface LocalArticle {
  id: string;
  title: string;
  category: 'nutrition' | 'safety' | 'wellness' | 'faq' | 'development';
  trimester: Trimester | 'General' | 'Newborn';
  content: string;
}

const educationalContent: LocalArticle[] = [
  {
    id: '1',
    title: 'WHO: Nausea and Vomiting Management',
    category: 'wellness',
    trimester: Trimester.FIRST,
    content: 'According to WHO, dietary modifications such as eating small, frequent meals and avoiding fatty or spicy foods are recommended. Ginger, chamomile, vitamin B6 and/or acupuncture are also suggested for relief of nausea in early pregnancy.'
  },
  {
    id: '2',
    title: 'WHO: Iron and Folic Acid Supplementation',
    category: 'nutrition',
    trimester: Trimester.FIRST,
    content: 'WHO recommends daily oral iron and folic acid supplementation with 30 mg to 60 mg of elemental iron and 400 µg (0.4 mg) of folic acid for pregnant women to prevent maternal anaemia, puerperal sepsis, low birth weight, and preterm birth.'
  },
  {
    id: '3',
    title: 'WHO: Physical Activity Guidelines',
    category: 'wellness',
    trimester: Trimester.SECOND,
    content: 'WHO recommends that all pregnant women without contraindications should undertake regular physical activity. Aim for at least 150 minutes of moderate-intensity aerobic physical activity throughout the week for substantial health benefits.'
  },
  {
    id: '4',
    title: 'WHO: Calcium Supplementation',
    category: 'nutrition',
    trimester: Trimester.THIRD,
    content: 'In populations with low dietary calcium intake, daily calcium supplementation (1.5–2.0 g oral elemental calcium) is recommended for pregnant women to reduce the risk of pre-eclampsia.'
  },
  {
    id: '5',
    title: 'WHO: Healthy Eating during Pregnancy',
    category: 'nutrition',
    trimester: 'General',
    content: 'A healthy diet during pregnancy contains adequate energy, protein, vitamins and minerals, obtained through the consumption of a variety of foods, including green and orange vegetables, meat, fish, beans, nuts, whole grains and fruit.'
  },
  {
    id: '6',
    title: 'WHO: Antenatal Care Contacts',
    category: 'faq',
    trimester: 'General',
    content: 'WHO recommends a minimum of eight antenatal care contacts to reduce perinatal mortality and improve women’s experience of care. These contacts allow for regular monitoring and support throughout the pregnancy.'
  },
  {
    id: 'nb1',
    title: 'WHO: Exclusive Breastfeeding',
    category: 'nutrition',
    trimester: 'Newborn',
    content: 'WHO recommends that infants should be exclusively breastfed for the first six months of life to achieve optimal growth, development and health. Thereafter, they should receive nutritionally adequate and safe complementary foods while breastfeeding continues up to two years of age or beyond.'
  },
  {
    id: 'nb2',
    title: 'WHO: Early Initiation of Breastfeeding',
    category: 'nutrition',
    trimester: 'Newborn',
    content: 'WHO recommends that mothers should be supported to initiate breastfeeding within the first hour of birth. This "early initiation" ensures that the infant receives the colostrum, or "first milk", which is rich in protective factors.'
  },
  {
    id: 'nb3',
    title: 'WHO: Delayed Cord Clamping',
    category: 'development',
    trimester: 'Newborn',
    content: 'WHO recommends delayed umbilical cord clamping (not earlier than 1 min after birth) for improved maternal and infant health and nutrition outcomes. This increases iron stores in the infant for up to six months.'
  },
  {
    id: 'nb4',
    title: 'WHO: Skin-to-Skin Contact (KMC)',
    category: 'wellness',
    trimester: 'Newborn',
    content: 'WHO recommends early and continuous skin-to-skin contact between mothers and their newborns, especially for low-birth-weight infants (Kangaroo Mother Care), as it promotes thermal regulation, breastfeeding, and bonding.'
  }
];

export const EducationHub: React.FC<{ trimester: Trimester, isPostpartum: boolean }> = ({ trimester, isPostpartum }) => {
  const [filter, setFilter] = useState<Trimester | 'General' | 'Newborn' | 'All'>(isPostpartum ? 'Newborn' : 'All');
  const [activeLocalArticle, setActiveLocalArticle] = useState<LocalArticle | null>(null);
  const [activeGlobalArticle, setActiveGlobalArticle] = useState<GlobalArticle | null>(null);

  // Sync filter when isPostpartum changes
  useEffect(() => {
    if (isPostpartum) {
      setFilter('Newborn');
    } else {
      setFilter('All');
    }
  }, [isPostpartum]);

  const globalArticles = useMemo(() => storage.getArticles(), []);
  const videos = useMemo(() => storage.getVideos(), []);

  const filteredLocalArticles = educationalContent.filter(a => {
    if (filter === 'All') return true;
    return a.trimester === filter;
  });

  const filteredGlobalArticles = globalArticles.filter(a => {
    if (filter === 'All') return true;
    return a.stage === filter;
  });

  const filteredVideos = videos.filter(v => {
    if (filter === 'All') return true;
    return v.stage === filter;
  });

  return (
    <div className="relative space-y-8 pb-12">
      {/* Decorative Floating Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-10">
        <div className="absolute top-[5%] left-[10%] text-rose-300 animate-float-teddy" style={{ animationDelay: '0s' }}><Stethoscope size={40} /></div>
        <div className="absolute top-[25%] right-[15%] text-rose-300 animate-float-teddy" style={{ animationDelay: '2s' }}><HeartPulse size={50} /></div>
        <div className="absolute top-[45%] left-[20%] text-rose-300 animate-float-teddy" style={{ animationDelay: '4s' }}><Stethoscope size={30} /></div>
        <div className="absolute top-[65%] right-[10%] text-rose-300 animate-float-teddy" style={{ animationDelay: '1s' }}><HeartPulse size={60} /></div>
        <div className="absolute bottom-[10%] left-[5%] text-rose-300 animate-float-teddy" style={{ animationDelay: '3s' }}><Stethoscope size={40} /></div>
        <div className="absolute bottom-[25%] right-[25%] text-rose-300 animate-float-teddy" style={{ animationDelay: '5s' }}><HeartPulse size={50} /></div>
        <div className="absolute top-[15%] left-[60%] text-rose-300 animate-float-teddy" style={{ animationDelay: '1.5s' }}><Stethoscope size={30} /></div>
        <div className="absolute bottom-[40%] left-[30%] text-rose-300 animate-float-teddy" style={{ animationDelay: '2.5s' }}><HeartPulse size={40} /></div>
        <div className="absolute top-[80%] left-[70%] text-rose-300 animate-float-teddy" style={{ animationDelay: '4.5s' }}><Stethoscope size={50} /></div>
        <div className="absolute top-[40%] right-[40%] text-rose-300 animate-float-teddy" style={{ animationDelay: '0.5s' }}><HeartPulse size={40} /></div>
      </div>

      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl font-serif text-rose-800">Knowledge Center</h2>
        <p className="text-gray-500 text-sm mt-1">Guided information for every step of your journey</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6 px-4">
        {(isPostpartum 
          ? ['All', 'Newborn', 'General'] 
          : ['All', Trimester.FIRST, Trimester.SECOND, Trimester.THIRD, 'General']
        ).map(t => (
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

      {/* WHO Guidelines Section */}
      {filter === 'All' && (
        <div className="px-4 mb-8">
          <div className="bg-gradient-to-br from-rose-50 to-white rounded-[2rem] p-6 border-2 border-rose-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-500 border border-rose-50">
                <Stethoscope size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-rose-900">WHO Guidelines</h3>
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">For {isPostpartum ? 'Newborns' : `${trimester} Trimester`}</p>
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              {educationalContent
                .filter(a => isPostpartum ? a.trimester === 'Newborn' : (a.trimester === trimester || a.trimester === 'General'))
                .slice(0, 3)
                .map(article => (
                <button 
                  key={article.id}
                  onClick={() => setActiveLocalArticle(article)}
                  className="w-full text-left p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-50 hover:border-rose-200 hover:shadow-md transition-all flex justify-between items-center group"
                >
                  <span className="font-bold text-slate-700 text-sm group-hover:text-rose-700 transition-colors">{article.title}</span>
                  <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors transform group-hover:translate-x-1" />
                </button>
              ))}
              <a 
                href={isPostpartum ? "https://www.who.int/health-topics/newborn-health" : "https://www.who.int/publications/i/item/9789241549912"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left p-4 bg-rose-100/50 backdrop-blur-sm rounded-2xl border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all flex justify-between items-center group mt-4"
              >
                <span className="font-bold text-rose-800 text-sm group-hover:text-rose-900 transition-colors">Read Full WHO Guidelines Online</span>
                <ExternalLink size={18} className="text-rose-500 group-hover:text-rose-700 transition-colors transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Expert Videos Section */}
      {filteredVideos.length > 0 && (
        <div className="space-y-6 px-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-rose-100" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Expert Videos</h3>
            <div className="h-[1px] flex-1 bg-rose-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredVideos.map(video => (
              <a 
                key={video.id} 
                href={video.youtubeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-rose-50 shadow-sm hover:shadow-md hover:border-rose-200 transition-all active:scale-[0.98]"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                      <PlayCircle className="text-rose-500 w-10 h-10" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-base font-serif text-rose-900 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">{video.stage.replace(' Trimester', '')}</span>
                    <ExternalLink size={12} className="text-rose-200" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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
                    <ArrowRight size={12} strokeWidth={3} />
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
                <X size={24} strokeWidth={3} />
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
                <X size={24} strokeWidth={3} />
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
