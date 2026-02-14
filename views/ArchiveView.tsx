
import React, { useState, useMemo, useEffect } from 'react';
import { DayEntry, MoonPhase, TarotCard } from '../types';
import RealisticMoon from '../components/RealisticMoon';
import { MOON_PHASE_INFO, getTodayStr } from '../constants';
import { calculateMoonPhase, getLunarDetails } from '../utils/uiHelpers';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, MessageCircle, CheckCircle2, Circle, Flower2, Clock, Zap, Eye, Ear, Fingerprint, Wind, Apple, Info, Sparkles, MapPin } from 'lucide-react';

interface Props {
  data: DayEntry[];
  onUpdateData: (newData: DayEntry[]) => void;
  deck: TarotCard[];
}

const ArchiveView: React.FC<Props> = ({ data, onUpdateData, deck }) => {
  // --- STATE ---
  // Current focused date object (Standardizes time to midnight for consistency)
  const [currentDate, setCurrentDate] = useState(() => {
      const parts = getTodayStr().split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
  });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Derived String YYYY-MM-DD
  const dateStr = useMemo(() => {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Derived Display Data
  const entryForDate = data.find(d => d.date === dateStr);
  const lunarDetails = useMemo(() => getLunarDetails(currentDate), [currentDate]);
  const displayMoonPhase = entryForDate ? entryForDate.moonPhase : lunarDetails.phase;
  const moonInfo = MOON_PHASE_INFO[displayMoonPhase];

  // Component Data Extract
  const card = entryForDate?.todayAwareness?.cardId 
    ? deck.find(c => c.id === entryForDate.todayAwareness?.cardId)
    : null;
  const seedGoal = entryForDate?.tomorrowSeed;
  const practices = entryForDate?.practices || [];
  const sensoryLogs = entryForDate?.sensoryLogs || [];
  
  // Format Date for Header (e.g., "10月27日 周五")
  const headerDateStr = useMemo(() => {
      const m = currentDate.getMonth() + 1;
      const d = currentDate.getDate();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[currentDate.getDay()];
      return `${m}月${d}日 ${weekDay}`;
  }, [currentDate]);

  // --- HANDLERS ---

  const changeDay = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + offset);
      setCurrentDate(newDate);
  };

  const goToToday = () => {
      const parts = getTodayStr().split('-').map(Number);
      setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
      setIsCalendarOpen(false);
  };

  const toggleGoalCompletion = () => {
      if (!entryForDate || !entryForDate.tomorrowSeed) return;
      
      const newStatus = !entryForDate.tomorrowSeed.isCompleted;
      const updatedEntry: DayEntry = {
          ...entryForDate,
          tomorrowSeed: {
              ...entryForDate.tomorrowSeed,
              isCompleted: newStatus
          }
      };
      const newData = data.map(d => d.date === updatedEntry.date ? updatedEntry : d);
      onUpdateData(newData);
  };

  const getSenseIcon = (senseId: string) => {
      switch (senseId) {
          case 'visual': return Eye;
          case 'audio': return Ear;
          case 'touch': return Fingerprint;
          case 'smell': return Wind;
          case 'taste': return Apple;
          default: return Sparkles;
      }
  };

  // --- RENDER HELPERS ---

  const renderCalendarOverlay = () => {
      if (!isCalendarOpen) return null;

      // Calendar Logic
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon start
      const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
      const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

      const handleMonthChange = (offset: number) => {
          const newDate = new Date(currentDate);
          newDate.setDate(1);
          newDate.setMonth(newDate.getMonth() + offset);
          setCurrentDate(newDate);
      };

      return (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
              {/* Overlay Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h2 className="text-xl font-serif text-white tracking-widest">时光索引</h2>
                  <button onClick={() => setIsCalendarOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <X size={20} />
                  </button>
              </div>

              {/* Month Nav */}
              <div className="flex items-center justify-between px-8 py-6">
                  <button onClick={() => handleMonthChange(-1)} className="p-2 text-slate-400 hover:text-white"><ChevronLeft /></button>
                  <div className="text-center">
                      <h3 className="text-2xl font-serif text-white">{monthNames[month]}</h3>
                      <p className="text-xs text-slate-500 font-sans tracking-widest uppercase">{year}</p>
                  </div>
                  <button onClick={() => handleMonthChange(1)} className="p-2 text-slate-400 hover:text-white"><ChevronRight /></button>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 px-6 mb-2">
                  {weekDays.map(d => (
                      <div key={d} className="text-center text-xs text-slate-600 font-sans">{d}</div>
                  ))}
              </div>

              {/* Grid Body */}
              <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
                  <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                      {Array.from({ length: paddingDays }).map((_, i) => <div key={`pad-${i}`} />)}
                      
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = cellDateStr === dateStr;
                          const isToday = cellDateStr === getTodayStr();
                          const entry = data.find(d => d.date === cellDateStr);
                          
                          // Accurate Phase for Grid
                          const cellLunar = getLunarDetails(new Date(year, month, day));
                          
                          // Dots
                          const hasChat = entry?.todayAwareness?.status === 'done';
                          const hasPractice = (entry?.practices?.length || 0) > 0;

                          return (
                              <button
                                  key={day}
                                  onClick={() => {
                                      setCurrentDate(new Date(year, month, day));
                                      setIsCalendarOpen(false);
                                  }}
                                  className={`aspect-[4/5] rounded-xl flex flex-col items-center justify-center space-y-1 relative border transition-all ${
                                      isSelected 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                                  }`}
                              >
                                  {isToday && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                                  
                                  <div className={isSelected ? 'scale-110' : 'opacity-70'}>
                                      <RealisticMoon phase={cellLunar.phase} size={14} simple={true} brightness={isSelected ? 1 : 0.7} />
                                  </div>
                                  <span className="text-xs font-sans font-medium">{day}</span>
                                  
                                  <div className="flex space-x-0.5 h-1">
                                      {hasChat && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500/50'}`}></div>}
                                      {hasPractice && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400/50'}`}></div>}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
                  <button 
                    onClick={goToToday}
                    className="w-full py-3 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:bg-slate-200"
                  >
                      回到今天
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden font-serif bg-slate-950 text-slate-100">
      
      {/* 1. TOP HEADER: Navigation & Date - COMPACT */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 z-20 bg-gradient-to-b from-slate-950 to-transparent flex-shrink-0">
          <div className="flex items-center space-x-4">
              <button onClick={() => changeDay(-1)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors active:scale-90">
                  <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                  <h2 className="text-lg font-serif text-white tracking-widest">{headerDateStr}</h2>
                  <p className="text-[10px] text-slate-500 font-sans tracking-[0.2em] uppercase">{dateStr}</p>
              </div>
              <button onClick={() => changeDay(1)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors active:scale-90">
                  <ChevronRight size={18} />
              </button>
          </div>
          
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 hover:text-white hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
          >
              <CalendarIcon size={18} />
          </button>
      </div>

      {/* 2. SCROLLABLE CONTENT: Day Details - COMPACT */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10 px-5">
          
          {/* A. Moon Hero Section - COMPACT */}
          <div className="flex flex-col items-center justify-center py-2 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse-slow -z-10"></div>
              
              <div className="relative mb-3 animate-float">
                  <RealisticMoon phase={displayMoonPhase} size={120} brightness={1} />
              </div>
              
              <div className="text-center space-y-1">
                  <h1 className="text-2xl font-serif text-white tracking-wide">{moonInfo.cnName}</h1>
                  <div className="flex items-center justify-center space-x-3 text-xs text-indigo-200/60 font-sans tracking-wider">
                      <span>照明度 {lunarDetails.illumination}%</span>
                      <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                      <span>{moonInfo.keywords.split('·')[0]}</span>
                  </div>
                  <p className="text-slate-400 text-xs italic font-serif mt-1 max-w-xs mx-auto leading-relaxed">
                      "{moonInfo.blessing}"
                  </p>
              </div>
          </div>

          {/* B. Content Cards Grid - COMPACT */}
          <div className="space-y-3 mt-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Card 1: Tarot Awareness */}
              {card ? (
                  <div 
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex gap-3 cursor-pointer hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all shadow-lg"
                  >
                      <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover opacity-90" />
                      </div>
                      <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start">
                                  <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">今日觉察</h3>
                                  <MessageCircle size={14} className="text-indigo-400 opacity-60" />
                              </div>
                              <h4 className="text-white font-serif text-lg truncate">{entryForDate.todayAwareness?.selectedTitle || card.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                              <span>深度值 {entryForDate.todayAwareness?.complexityScore || 0}</span>
                              <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                              <span>点击回顾对话</span>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="border border-dashed border-white/10 rounded-2xl p-4 text-center text-slate-500 text-xs tracking-wider">
                      此日星图未显，暂无塔罗记录
                  </div>
              )}

              {/* Card 2: Energy Seed (Goal) */}
              {seedGoal && seedGoal.energySeed && (
                  <div 
                      onClick={toggleGoalCompletion}
                      className={`rounded-2xl p-3 border transition-all cursor-pointer flex items-center space-x-3 ${
                          seedGoal.isCompleted 
                          ? 'bg-amber-900/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                          : 'bg-slate-900/40 border-white/10 hover:bg-slate-800'
                      }`}
                  >
                      <div className={`p-1 rounded-full border-2 transition-colors ${seedGoal.isCompleted ? 'border-amber-400 text-amber-400' : 'border-slate-600 text-transparent'}`}>
                           <CheckCircle2 size={16} fill={seedGoal.isCompleted ? "currentColor" : "none"} className={seedGoal.isCompleted ? "opacity-100" : "opacity-0"} />
                      </div>
                      <div className="flex-1">
                          <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${seedGoal.isCompleted ? 'text-amber-200/70' : 'text-slate-400'}`}>能量小目标</h3>
                          <p className={`font-serif text-sm transition-colors ${seedGoal.isCompleted ? 'text-amber-100' : 'text-slate-200'}`}>
                              "{seedGoal.energySeed}"
                          </p>
                      </div>
                  </div>
              )}

              {/* Card 3: Practices List */}
              {practices.length > 0 && (
                  <div className="bg-indigo-900/10 border border-indigo-500/10 rounded-2xl p-3">
                      <div className="flex items-center space-x-2 mb-2">
                          <Flower2 size={14} className="text-indigo-400" />
                          <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider">正念修习</h3>
                      </div>
                      <div className="space-y-2">
                          {practices.map((p, i) => (
                              <div key={i} className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2.5 border border-white/5">
                                  <span className="text-sm text-slate-200 font-serif">{p.scenarioTitle}</span>
                                  <div className="flex items-center space-x-3 text-xs">
                                      <span className="text-slate-500 flex items-center"><Clock size={10} className="mr-1"/> {Math.ceil(p.durationSeconds/60)}m</span>
                                      <span className={`${p.completed ? 'text-green-400' : 'text-slate-500'} text-[10px] border border-current px-1.5 rounded`}>
                                          {p.completed ? '完成' : '中断'}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Card 4: Sensory Logs */}
              {sensoryLogs.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-3">
                      <div className="flex items-center space-x-2 mb-2">
                          <Eye size={14} className="text-slate-400" />
                          <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider">知觉校准</h3>
                      </div>
                      <div className="space-y-3">
                          {sensoryLogs.map((log, i) => {
                              const Icon = getSenseIcon(log.senseId);
                              return (
                                  <div key={i} className="pl-3 border-l-2 border-slate-700">
                                      <div className="flex items-center space-x-2 mb-1">
                                          <Icon size={12} className="text-indigo-400" />
                                          <span className="text-xs text-indigo-200">{log.senseTitle}</span>
                                      </div>
                                      <p className="text-sm text-slate-300 font-serif leading-relaxed italic">"{log.content}"</p>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {/* Empty State Footer */}
              {!card && !seedGoal && practices.length === 0 && sensoryLogs.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                      <p className="text-xs text-slate-500 font-serif tracking-widest">这天是一片静谧的虚空</p>
                  </div>
              )}
          </div>
      </div>

      {/* --- OVERLAYS --- */}
      {renderCalendarOverlay()}

      {/* History Modal (Same as before) */}
      {showHistoryModal && entryForDate?.todayAwareness && card && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 p-1 bg-black/20 rounded-full"
                >
                    <X size={20} />
                </button>
                <div className="p-6 bg-gradient-to-b from-indigo-950 to-slate-900 flex flex-col items-center border-b border-white/5">
                    <img src={card.imageUrl} alt={card.name} className="w-20 h-32 object-cover rounded-lg shadow-lg mb-3" />
                    <h3 className="text-white font-serif text-xl">{entryForDate.todayAwareness.selectedTitle || card.name}</h3>
                    <p className="text-indigo-200 text-sm mt-1">{entryForDate.todayAwareness.selectedTitle ? card.name : ""}</p>
                    <p className="text-slate-500 text-xs mt-2 font-sans tracking-widest">{entryForDate.date}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {entryForDate.todayAwareness.chatHistory.map((m, i) => (
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
      )}

    </div>
  );
};

export default ArchiveView;
