
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, Dot } from 'recharts';
import { DayEntry, MoonPhase, TarotCard } from '../types';
import { getTodayStr } from '../constants';
import { GeminiService } from '../services/geminiService';
import { Sparkles, Quote, Loader2, Activity, Feather, X, Calendar, Zap, Info, ChevronRight, ChevronLeft, ArrowRight, MessageSquare, Compass, Check, MessageCircle } from 'lucide-react';

interface Props {
  data: DayEntry[];
  deck: TarotCard[];
}

// Stats Modal Interface
interface StatDetail {
    type: 'streak' | 'depth';
    value: number;
    label: string;
    subLabel: string;
    icon: React.ElementType;
    color: string;
    message: string;
    analysis: string;
}

// Monthly Report Interface
interface MonthlyReport {
    overview: string;
    guidance: string;
}

const TrendView: React.FC<Props> = ({ data, deck }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Modal States
  const [activeStat, setActiveStat] = useState<StatDetail | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPage, setReportPage] = useState(0); // 0: Overview, 1: Highlights, 2: Guidance
  const [reportData, setReportData] = useState<MonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // New: History Review State within Trend View
  const [reviewEntry, setReviewEntry] = useState<DayEntry | null>(null);

  // --- DATA PROCESSING ---
  
  // 1. Sort data chronologically
  const sortedData = useMemo(() => {
      return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // 2. Filter for "Current Month" (Based on real time)
  // In a real app, this might be selectable. Defaulting to current system month.
  const currentMonthEntries = useMemo(() => {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return sortedData.filter(d => d.date.startsWith(currentMonthStr));
  }, [sortedData]);

  // 3. Extract Keywords for the month (Top 3)
  const topKeywords = useMemo(() => {
      const allKeywords = currentMonthEntries.flatMap(d => {
          if (!d.todayAwareness?.cardId) return [];
          const card = deck.find(c => c.id === d.todayAwareness!.cardId);
          return card ? card.keywords : [];
      });

      const counts: Record<string, number> = {};
      allKeywords.forEach(k => counts[k] = (counts[k] || 0) + 1);
      
      return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5) // Get top 5 for cloud
          .map(([k]) => k);
  }, [currentMonthEntries, deck]);

  // 4. Find Top Highlight (Deepest Conversation)
  const topHighlight = useMemo(() => {
      const highlights = [...currentMonthEntries]
          .filter(d => d.todayAwareness?.status === 'done' && (d.todayAwareness.chatHistory.length || 0) > 0)
          .sort((a, b) => (b.todayAwareness?.complexityScore || 0) - (a.todayAwareness?.complexityScore || 0));
      
      return highlights.length > 0 ? highlights[0] : null;
  }, [currentMonthEntries]);

  // 5. Total Days (Streak) - Total All Time
  const totalDays = data.length;

  // 6. Cumulative Awareness Depth (Total User Char Count) - Total All Time
  const totalUserChars = useMemo(() => {
      return data.reduce((acc, entry) => {
          const history = entry.todayAwareness?.chatHistory || [];
          return acc + history
              .filter(msg => msg.role === 'user')
              .reduce((sum, msg) => sum + msg.text.length, 0);
      }, 0);
  }, [data]);

  // --- INITIAL INSIGHT (Simple string for the card) ---
  useEffect(() => {
      // Load simple insight initially if report not generated
      if (topKeywords.length > 0 && !insight) {
          // Use a simple prompt logic or placeholder if we want to save tokens
          // For now, let's keep it empty or simple until user clicks
          setInsight("点击查看本月完整的能量回响报告...");
      } else if (topKeywords.length === 0) {
          setInsight("本月的数据如未写的诗篇，等待你去填充觉察的瞬间。");
      }
  }, [topKeywords]);


  // Prepare chart data - FILTER OUT FUTURE DATES
  const chartData = useMemo(() => {
      const todayStr = getTodayStr();
      return sortedData
        .filter(d => d.date <= todayStr) // Only show data up to today
        .map(d => ({
            date: d.date.split('-').slice(1).join('/'), // MM/DD
            score: d.todayAwareness?.complexityScore || 0,
            title: d.todayAwareness?.selectedTitle || '未记录',
            moonPhase: d.moonPhase
        }));
  }, [sortedData]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isBright = payload.moonPhase === MoonPhase.FULL || payload.moonPhase === MoonPhase.WAXING_GIBBOUS || payload.moonPhase === MoonPhase.WANING_GIBBOUS;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill={isBright ? "#818cf8" : "#6366f1"} fillOpacity={0.2} className="animate-pulse" />
        <circle cx={cx} cy={cy} r={3} fill="#fff" stroke="none" />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-indigo-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] backdrop-blur-md text-xs">
          <p className="text-indigo-200 font-bold mb-1">{label}</p>
          <p className="text-white text-sm mb-1">{payload[0].payload.title}</p>
          <div className="flex justify-between items-center text-slate-400 space-x-4">
              <span>灵魂潮汐值: {payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- HANDLERS ---

  const openStatModal = (type: 'streak' | 'depth') => {
      if (type === 'streak') {
          setActiveStat({
              type: 'streak',
              value: totalDays,
              label: '持续觉察天数',
              subLabel: 'CONSECUTIVE DAYS',
              icon: Activity,
              color: 'text-indigo-400',
              message: "时间的河流因你的驻足而闪光。坚持下去，你会看见完整的自己。",
              analysis: `你已经连续 ${totalDays} 天与自我对话。这种持续的能量正在为你构建一个稳定的内核。`
          });
      } else {
          setActiveStat({
              type: 'depth',
              value: totalUserChars,
              label: '累计觉察深度',
              subLabel: 'AWARENESS DEPTH (CHARS)',
              icon: Feather,
              color: 'text-pink-400',
              message: "每一个文字都是灵魂的碎片。你正在拼凑出一个更清晰的宇宙。",
              analysis: `本月你倾诉了 ${totalUserChars} 个字。每一个字都是通往潜意识深处的阶梯。`
          });
      }
  };

  const handleOpenReport = async () => {
      if (topKeywords.length === 0) return;
      
      setShowReportModal(true);
      setReportPage(0);

      // Generate if not exists
      if (!reportData) {
          setIsGeneratingReport(true);
          // Pass only top 3 for generation context
          const report = await GeminiService.generateMonthlyReport(topKeywords.slice(0,3));
          setReportData(report);
          setInsight(report.overview); // Update the card text too
          setIsGeneratingReport(false);
      }
  };

  const nextPage = () => {
      if (reportPage < 2) setReportPage(prev => prev + 1);
      else setShowReportModal(false);
  };

  const prevPage = () => {
      if (reportPage > 0) setReportPage(prev => prev - 1);
  };

  const handleReviewClick = (entry: DayEntry) => {
      setReviewEntry(entry);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 px-4 pt-4 font-serif relative">
      
      {/* 1. HEADER - Compacted */}
      <div className="mb-2 flex justify-between items-end">
        <div>
            <h2 className="text-xl text-white mb-0.5 tracking-wide">月度回顾</h2>
            <p className="text-slate-400 text-xs tracking-widest">观测你内心的引力场</p>
        </div>
      </div>

      {/* 2. STATS GRID - Compacted */}
      <section className="mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="grid grid-cols-2 gap-3 w-full">
            <button 
                onClick={() => openStatModal('streak')}
                className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col items-center backdrop-blur-sm hover:bg-slate-800/50 hover:scale-[1.02] transition-all active:scale-95 group"
            >
                <div className="p-1.5 rounded-full bg-indigo-500/10 mb-1 group-hover:bg-indigo-500/20 transition-colors">
                    <Activity className="text-indigo-400 opacity-80" size={16} />
                </div>
                <span className="text-xl font-bold text-white font-serif">{totalDays}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider group-hover:text-indigo-200 transition-colors">持续觉察 (天)</span>
            </button>
            
            <button 
                onClick={() => openStatModal('depth')}
                className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col items-center backdrop-blur-sm hover:bg-slate-800/50 hover:scale-[1.02] transition-all active:scale-95 group"
            >
                <div className="p-1.5 rounded-full bg-pink-500/10 mb-1 group-hover:bg-pink-500/20 transition-colors">
                    <Feather className="text-pink-400 opacity-80" size={16} />
                </div>
                <span className="text-xl font-bold text-white font-serif">{totalUserChars}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider group-hover:text-pink-200 transition-colors">累计觉察深度</span>
            </button>
        </div>
      </section>

      {/* 3. CHART SECTION - Compacted */}
      <section className="mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex flex-col mb-2">
            <div className="flex justify-between items-center">
                <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em] flex items-center">
                    <Sparkles size={12} className="mr-2 text-indigo-400" />
                    月度觉察趋势
                </h3>
            </div>
            {/* Added data explanation */}
            <p className="text-[9px] text-slate-500 mt-0.5 flex items-center">
                <Info size={10} className="mr-1 inline" />
                数据依据: 每日对话情绪密度与深度
            </p>
        </div>
        
        {/* Reduced Height to h-48 (192px) */}
        <div className="h-48 w-full bg-slate-900/50 rounded-2xl border border-white/5 p-4 relative shadow-lg backdrop-blur-sm">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={<CustomDot />} activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }} animationDuration={1500} />
                </AreaChart>
             </ResponsiveContainer>
        </div>
      </section>

      {/* 4. INSIGHT CARD - Clickable Trigger */}
      <section className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em] mb-2">月度回响 · Monthly Echo</h3>
          
          <button 
            onClick={handleOpenReport}
            className="w-full relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-slate-800/20 text-left hover:scale-[1.01] transition-transform active:scale-95 group"
          >
              <div className="relative bg-slate-900/90 rounded-xl p-4 border border-white/5 backdrop-blur-xl overflow-hidden min-h-[120px] flex flex-col justify-center group-hover:bg-slate-800/80 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Quote size={50} className="text-white" />
                  </div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-[40px]"></div>

                  <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-2">
                           {topKeywords.map((k, i) => (
                               <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/20 tracking-wider">
                                   #{k}
                               </span>
                           ))}
                      </div>

                      {loadingInsight ? (
                          <div className="flex items-center space-x-3 text-slate-500 py-2">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-xs tracking-widest">星辰正在编织寄语...</span>
                          </div>
                      ) : (
                          <p className="text-white/90 text-xs leading-5 font-serif italic tracking-wide">
                              "{insight}"
                          </p>
                      )}
                  </div>
                  
                  <div className="absolute bottom-3 right-4 flex items-center space-x-1 text-slate-500 group-hover:text-indigo-300 transition-colors">
                      <span className="text-[9px] tracking-[0.2em] uppercase">Tap to open</span>
                      <ChevronRight size={10} />
                  </div>
              </div>
          </button>
      </section>

      {/* --- STAT DETAILS MODAL --- */}
      {activeStat && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <button 
                      onClick={() => setActiveStat(null)}
                      className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-20"
                  >
                      <X size={18} />
                  </button>

                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent`}></div>
                  <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 ${activeStat.type === 'streak' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-white/10 ${activeStat.type === 'streak' ? 'bg-indigo-500/10' : 'bg-pink-500/10'}`}>
                          <activeStat.icon size={32} className={activeStat.color} />
                      </div>

                      <h3 className="text-white text-3xl font-serif mb-2">{activeStat.value}</h3>
                      <p className="text-slate-400 text-xs tracking-widest uppercase mb-8">{activeStat.subLabel}</p>

                      <div className="w-full bg-white/5 rounded-xl p-5 border border-white/5 mb-6 text-left relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                          <p className="text-indigo-200 font-serif text-sm leading-relaxed mb-3">
                              "{activeStat.message}"
                          </p>
                          <p className="text-slate-400 text-xs leading-relaxed font-sans">
                              {activeStat.analysis}
                          </p>
                      </div>

                      <button 
                          onClick={() => setActiveStat(null)}
                          className="w-full py-3 bg-white text-slate-900 rounded-full font-bold font-serif tracking-widest hover:scale-105 transition-transform"
                      >
                          保持觉察
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MONTHLY REPORT MODAL (PAGINATED) --- */}
      {showReportModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
              
              {/* Pagination Dots */}
              <div className="absolute top-8 flex space-x-2 z-30">
                  {[0, 1, 2].map(i => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${reportPage === i ? 'bg-white' : 'bg-slate-700'}`}></div>
                  ))}
              </div>

              <div className="w-full max-w-sm h-full flex flex-col relative pt-20 pb-24 px-6 overflow-y-auto no-scrollbar">
                  
                  {/* Close Button */}
                  <button onClick={() => setShowReportModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white z-50"><X size={20} /></button>

                  {/* LOADING STATE */}
                  {isGeneratingReport ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                          <div className="relative">
                              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={20} className="text-indigo-300 animate-pulse" /></div>
                          </div>
                          <p className="text-indigo-200 text-xs tracking-[0.2em] animate-pulse uppercase">Connecting to Stars...</p>
                      </div>
                  ) : (
                      <>
                          {/* PAGE 0: OVERVIEW & KEYWORDS */}
                          {reportPage === 0 && (
                              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                                  <div className="text-center mb-10">
                                      <h2 className="text-3xl font-serif text-white tracking-[0.2em] mb-2">本月能量</h2>
                                      <p className="text-slate-500 text-xs uppercase tracking-widest">Monthly Overview</p>
                                  </div>

                                  {/* Keyword Cloud */}
                                  <div className="flex flex-wrap justify-center gap-3 mb-10">
                                      {topKeywords.map((k, i) => (
                                          <span key={i} className={`px-4 py-2 rounded-full border text-sm font-serif tracking-wide ${i === 0 ? 'bg-indigo-500 text-white border-indigo-400 text-lg px-5 py-2.5' : 'bg-white/5 text-indigo-200 border-white/10'}`}>
                                              #{k}
                                          </span>
                                      ))}
                                  </div>

                                  {/* AI Overview Text */}
                                  <div className="bg-gradient-to-b from-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-white/10 relative overflow-hidden flex-1 flex items-center">
                                      <Quote size={80} className="absolute -top-4 -left-4 text-white/5" />
                                      <p className="text-indigo-100 font-serif text-lg leading-relaxed relative z-10 text-justify indent-2">
                                          {reportData?.overview}
                                      </p>
                                  </div>
                              </div>
                          )}

                          {/* PAGE 1: HIGHLIGHT (SINGLE DEEPEST HERO CARD) */}
                          {reportPage === 1 && (
                              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 justify-center">
                                  <div className="text-center mb-4">
                                      <h2 className="text-3xl font-serif text-white tracking-[0.2em] mb-2">深度回响</h2>
                                      <p className="text-slate-500 text-xs uppercase tracking-widest">Deepest Conversation</p>
                                  </div>

                                  {topHighlight ? (() => {
                                      const card = deck.find(c => c.id === topHighlight.todayAwareness?.cardId);
                                      // Find the last user message for snippet
                                      const lastUserMsg = [...(topHighlight.todayAwareness?.chatHistory || [])].reverse().find(m => m.role === 'user');
                                      
                                      return (
                                          <div className="relative group perspective-1000 flex flex-col items-center justify-center flex-1">
                                              {/* Ambient Glow */}
                                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse-slow -z-10"></div>

                                              {/* Hero Card - Smaller & Clean */}
                                              <button 
                                                onClick={() => handleReviewClick(topHighlight)}
                                                className="relative w-48 h-80 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.3)] border border-white/10 bg-slate-900 transition-transform duration-700 transform hover:scale-[1.02] mb-8 group z-10"
                                              >
                                                  <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                                  
                                                  <img src={card?.imageUrl} alt={card?.name} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                                                  {/* Subtle inner border */}
                                                  <div className="absolute inset-0 border border-indigo-200/20 rounded-xl pointer-events-none"></div>
                                              </button>

                                              {/* Text Info - Moved Below */}
                                              <div className="text-center z-10 space-y-4 max-w-xs">
                                                  {/* Title & Card Name */}
                                                  <div>
                                                      <h3 className="text-2xl font-serif text-white mb-1 drop-shadow-md tracking-wide">
                                                          {topHighlight.todayAwareness?.selectedTitle || card?.name}
                                                      </h3>
                                                      <p className="text-xs text-indigo-300/70 font-sans uppercase tracking-[0.15em]">
                                                          {card?.name}
                                                      </p>
                                                  </div>

                                                  {/* Depth Score */}
                                                  <div className="flex items-center justify-center space-x-3 py-2">
                                                       <div className="flex items-center space-x-1.5 text-amber-300">
                                                           <Zap size={16} fill="currentColor" />
                                                           <span className="text-xl font-serif font-bold">{topHighlight.todayAwareness?.complexityScore}</span>
                                                       </div>
                                                       <div className="w-px h-4 bg-white/10"></div>
                                                       <span className="text-xs text-slate-400 tracking-wider">深度指数</span>
                                                  </div>
                                                  
                                                  {/* Snippet */}
                                                  <div className="relative px-4 py-3 bg-white/5 rounded-lg border border-white/5">
                                                      <Quote size={12} className="absolute top-2 left-2 text-indigo-400/40" />
                                                      <p className="text-slate-300 text-sm font-serif italic leading-relaxed line-clamp-2 px-2">
                                                          "{lastUserMsg?.text || '...'}"
                                                      </p>
                                                  </div>

                                                  <div className="pt-2">
                                                      <button 
                                                          onClick={() => handleReviewClick(topHighlight)} 
                                                          className="text-[10px] text-slate-500 flex items-center justify-center space-x-1 hover:text-indigo-300 transition-colors"
                                                      >
                                                          <MessageCircle size={10} />
                                                          <span className="uppercase tracking-widest">点击卡牌回顾对话</span>
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })() : (
                                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                                          <div className="w-20 h-32 border border-dashed border-white/10 rounded-lg flex items-center justify-center">
                                              <Activity size={24} className="opacity-20" />
                                          </div>
                                          <p className="text-sm">本月暂无深度记录</p>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* PAGE 2: GUIDANCE */}
                          {reportPage === 2 && (
                              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                                  <div className="text-center mb-10">
                                      <h2 className="text-3xl font-serif text-white tracking-[0.2em] mb-2">前行指引</h2>
                                      <p className="text-slate-500 text-xs uppercase tracking-widest">Next Steps</p>
                                  </div>

                                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                                      {/* Parse guidance string into list if possible, or just display */}
                                      {reportData?.guidance.split(/\d+\./).filter(s => s.trim()).map((step, i) => (
                                          <div key={i} className="flex gap-4">
                                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-indigo-900/50">
                                                  {i + 1}
                                              </div>
                                              <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex-1">
                                                  <p className="text-indigo-100 font-serif leading-relaxed text-sm">
                                                      {step.trim().replace(/^\./, '')}
                                                  </p>
                                              </div>
                                          </div>
                                      ))}
                                      
                                      <div className="mt-8 text-center">
                                          <Compass size={32} className="mx-auto text-slate-600 mb-4 animate-pulse" />
                                          <p className="text-slate-500 text-xs font-serif italic">
                                              "跟随引力，但别忘了你也是一颗星辰。"
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </>
                  )}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="absolute bottom-10 w-full px-10 flex justify-between z-30">
                  <button 
                    onClick={prevPage} 
                    disabled={reportPage === 0 || isGeneratingReport}
                    className="p-3 rounded-full bg-slate-800 text-slate-400 disabled:opacity-0 transition-opacity hover:bg-slate-700"
                  >
                      <ChevronLeft size={20} />
                  </button>
                  
                  {reportPage < 2 ? (
                      <button 
                        onClick={nextPage}
                        disabled={isGeneratingReport}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
                      >
                          <span>继续</span>
                          <ArrowRight size={16} />
                      </button>
                  ) : (
                      <button 
                        onClick={() => setShowReportModal(false)}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30"
                      >
                          <span>完成回顾</span>
                          <Check size={16} className="ml-1" />
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* --- HISTORY REVIEW MODAL (Triggered from Report Hero Card) --- */}
      {reviewEntry && (() => {
          const card = deck.find(c => c.id === reviewEntry.todayAwareness?.cardId);
          return (
            <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-white/10 w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                    <button 
                        onClick={() => setReviewEntry(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 p-1 bg-black/20 rounded-full"
                    >
                        <X size={20} />
                    </button>
                    <div className="p-6 bg-gradient-to-b from-indigo-950 to-slate-900 flex flex-col items-center border-b border-white/5">
                        <img src={card?.imageUrl} alt={card?.name} className="w-20 h-32 object-cover rounded-lg shadow-lg mb-3" />
                        <h3 className="text-white font-serif text-xl">{reviewEntry.todayAwareness?.selectedTitle || card?.name}</h3>
                        <p className="text-indigo-200 text-sm mt-1">{reviewEntry.todayAwareness?.selectedTitle ? card?.name : ""}</p>
                        <p className="text-slate-500 text-xs mt-2 font-sans tracking-widest">{reviewEntry.date}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {reviewEntry.todayAwareness?.chatHistory.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed font-serif ${
                                    m.role === 'user' 
                                    ? 'bg-indigo-600/80 text-white rounded-tr-none' 
                                    : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div className="h-8"></div>
                    </div>
                </div>
            </div>
          );
      })()}

    </div>
  );
};

export default TrendView;
