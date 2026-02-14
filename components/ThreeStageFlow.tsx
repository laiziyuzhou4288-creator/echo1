
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, CheckCircle2, StopCircle, CalendarCheck, Share2, XCircle, ArrowRight, Lightbulb, Zap, RotateCcw, RefreshCw, ZoomIn, X } from 'lucide-react';
import { DayEntry, TarotCard, Message, MoonPhase } from '../types';
import { GeminiService } from '../services/geminiService';
import { getTodayStr, getYesterdayStr } from '../constants';
import { calculateComplexity, calculateMoonPhase } from '../utils/uiHelpers';
import RealisticMoon from './RealisticMoon';
import CardVisual from './CardVisual';
import TarotMessage from './TarotMessage';

interface Props {
  userData: DayEntry[];
  onUpdateData: (newData: DayEntry[]) => void;
  deck: TarotCard[];
}

// 3D Carousel Constants
const CARD_COUNT = 12; 
const RADIUS = 240; 
const CARD_WIDTH = 90; 
const CARD_HEIGHT = 150;

// Hardcoded Energy Seed Suggestions
const SEED_SUGGESTIONS_POOL = [
    "抬头数出3朵形状不同的云",
    "盯着夕阳消失的方向站3分钟",
    "闭眼分辨周围5种不同的声音",
    "感受第一口咖啡在舌尖的苦涩",
    "深呼吸闻闻雨后泥土的气息",
    "抚摸一片绿叶感受它的脉络",
    "洗澡时专注感受水流的温度",
    "提前一站下车步行回家",
    "去从未走过的小巷转转",
    "放下手机在长椅坐5分钟",
    "模仿猫咪做一个彻底的拉伸",
    "整理书桌上最乱的一个角落",
    "手写下今天让你微笑的瞬间",
    "关机30分钟享受绝对安静",
    "对为你服务的人说声谢谢",
    "给远方的朋友发一张风景照",
    "在睡前对自己说声辛苦了",
    "慢下来认真咀嚼每一口食物",
    "拍一张今天路边盛开的花",
    "盯着烛火或窗外光影发会儿呆"
];

// Helper to calculate next day string yyyy-mm-dd
const getNextDayStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
};

const ThreeStageFlow: React.FC<Props> = ({ userData, onUpdateData, deck }) => {
  // Main View State
  const [viewMode, setViewMode] = useState<'hub' | 'energy_input' | 'carousel' | 'chat' | 'seed_input'>('hub');
  
  // Chat / Today's Awareness State
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isEndingSession, setIsEndingSession] = useState(false); 
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  
  // New: Custom Title State
  const [customTitle, setCustomTitle] = useState('');
  const [isHeaderCardZoomed, setIsHeaderCardZoomed] = useState(false); // Zoom State for Mini Card
  
  // New: Topic Turn Counter
  const [topicTurnCount, setTopicTurnCount] = useState(0);

  // Tomorrow Seed State
  const [isPickingTomorrow, setIsPickingTomorrow] = useState(false);
  const [tomorrowCard, setTomorrowCard] = useState<TarotCard | null>(null);
  const [seedSuggestions, setSeedSuggestions] = useState<string[]>([]);
  const [seedInput, setSeedInput] = useState('');
  
  // Energy Input State
  const [energyLevel, setEnergyLevel] = useState(50); // 0-100

  // Yesterday Card State
  const [isYesterdayFlipped, setIsYesterdayFlipped] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Card Reveal Animation State
  // 'hidden': Initial state
  // 'flipping': Card appears center back-face
  // 'revealed': Card flips to front-face center
  // 'docked': Card moves to top-left corner
  const [cardRevealState, setCardRevealState] = useState<'hidden' | 'flipping' | 'revealed' | 'docked'>('hidden');

  // Carousel State
  const [carouselState, setCarouselState] = useState<'idle' | 'spinning' | 'stopping' | 'selection'>('idle');
  const [rotationAngle, setRotationAngle] = useState(0);
  const rotationSpeedRef = useRef(0.05); 
  const snapTargetRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [candidateCards, setCandidateCards] = useState<number[]>([]); 
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null); 
  
  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Data Helpers
  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();
  const todayEntry = userData.find(d => d.date === todayStr);
  const yesterdayEntry = userData.find(d => d.date === yesterdayStr);

  const displayCardEntry = todayEntry || yesterdayEntry; // Fallback
  const displayCardId = viewMode === 'seed_input' 
      ? tomorrowCard?.id 
      : todayEntry?.todayAwareness?.cardId;
  
  const activeCard = deck.find(c => c.id === displayCardId);

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (viewMode === 'chat') {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  }, [messages, loading, suggestedTitles, viewMode, isEndingSession, cardRevealState]);


  // --- 1. CAROUSEL ANIMATION LOGIC ---

  useEffect(() => {
    if (viewMode !== 'carousel') {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return;
    }

    const animate = () => {
      if (carouselState === 'idle') {
           setRotationAngle(prev => prev + 0.15); 
      } 
      else if (carouselState === 'spinning') {
          setRotationAngle(prev => prev + rotationSpeedRef.current);
      } 
      else if (carouselState === 'stopping') {
          rotationSpeedRef.current *= 0.96; 
          if (rotationSpeedRef.current < 1.5) {
              const step = 360 / CARD_COUNT;
              if (snapTargetRef.current === null) {
                  const current = rotationAngle;
                  const target = Math.round(current / step) * step;
                  snapTargetRef.current = target;
              }
              setRotationAngle(prev => {
                  const dist = snapTargetRef.current! - prev;
                  if (Math.abs(dist) < 0.1) {
                       rotationSpeedRef.current = 0;
                       setCarouselState('selection');
                       return snapTargetRef.current!;
                  }
                  return prev + dist * 0.1;
              });
          } else {
               setRotationAngle(prev => prev + rotationSpeedRef.current);
          }
      }

      if (viewMode === 'carousel') {
          animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [viewMode, carouselState]);

  // Handle Selection Calculation
  useEffect(() => {
    if (carouselState === 'selection') {
        const step = 360 / CARD_COUNT;
        const normalizedRotation = ((rotationAngle % 360) + 360) % 360;
        let centerIndex = Math.round((360 - normalizedRotation) / step) % CARD_COUNT;
        const leftIndex = (centerIndex - 1 + CARD_COUNT) % CARD_COUNT;
        const rightIndex = (centerIndex + 1 + CARD_COUNT) % CARD_COUNT;
        setCandidateCards([leftIndex, centerIndex, rightIndex]);
    } else {
        setCandidateCards([]);
    }
  }, [carouselState, rotationAngle]);


  const startShuffle = () => {
    setCarouselState('spinning');
    rotationSpeedRef.current = 25; 
    snapTargetRef.current = null;
    setSelectedCardIndex(null);
  };

  const stopShuffle = () => {
    setCarouselState('stopping');
  };

  // --- 2. FLOW LOGIC ---

  const confirmEnergy = () => {
      setViewMode('carousel');
      setCarouselState('idle');
      setRotationAngle(0);
      snapTargetRef.current = null;
  };

  const handleCardSelect = async (index: number) => {
    setSelectedCardIndex(index);
    
    // --- RANDOM DRAW LOGIC (Enhanced) ---
    // Ensure equal probability for all cards in the deck
    const getRandomIndex = (max: number) => {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] % max;
        }
        return Math.floor(Math.random() * max);
    };

    const randomCardIndex = getRandomIndex(deck.length);
    const randomCard = deck[randomCardIndex] || deck[0];
    
    // Prepare for reveal
    setCardRevealState('flipping');

    // BRANCH: Picking Tomorrow's Energy Seed
    if (isPickingTomorrow) {
        setTimeout(async () => {
            setTomorrowCard(randomCard);
            const shuffled = [...SEED_SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
            const suggestions = shuffled.slice(0, 3);
            
            setSeedSuggestions(suggestions);
            setViewMode('seed_input');
            setSelectedCardIndex(null);
            
            // Trigger Flip
            setTimeout(() => setCardRevealState('revealed'), 100);
        }, 1500);
        return;
    }

    // BRANCH: Normal Daily Divination
    const newEntry: DayEntry = {
        date: todayStr,
        moonPhase: 'Waxing Gibbous' as any, 
        todayAwareness: { 
            status: 'pending', 
            cardId: randomCard.id, 
            chatHistory: [], 
            complexityScore: 0,
            energyLevel: energyLevel
        }
    };
    
    setTimeout(async () => {
        const newData = userData.filter(d => d.date !== todayStr);
        onUpdateData([...newData, newEntry]);
        
        setViewMode('chat');
        setLoading(true);
        setIsEndingSession(false);
        setSuggestedTitles([]);
        setCustomTitle(''); // Reset custom title
        setShowCompletionScreen(false);
        setTopicTurnCount(0); // Reset topic count
        
        // Trigger Flip
        setTimeout(() => setCardRevealState('revealed'), 100);

        const opening = await GeminiService.startCardReflection(randomCard);
        const newMsg: Message = { role: 'model', text: opening, timestamp: Date.now() };
        
        setMessages([newMsg]);
        updateTodayChat([newMsg], newEntry);
        setLoading(false);
        setSelectedCardIndex(null);
    }, 1500); 
  };

  const updateTodayChat = (newHistory: Message[], entryOverride?: DayEntry) => {
    const complexity = calculateComplexity(newHistory);
    const targetEntry = entryOverride || todayEntry;
    
    if (!targetEntry) return;

    const updatedEntry: DayEntry = {
        ...targetEntry,
        todayAwareness: {
            ...targetEntry.todayAwareness!,
            chatHistory: newHistory,
            complexityScore: complexity,
            status: 'pending'
        }
    };

    const otherEntries = userData.filter(d => d.date !== todayStr);
    onUpdateData([...otherEntries, updatedEntry]);
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;
    
    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setChatInput('');
    setLoading(true);
    
    // Increment topic turn count if it's a normal message
    // If it's a topic change (textOverride used for this), reset count
    if (textOverride === "我想换个话题聊聊") {
        setTopicTurnCount(0);
    } else {
        setTopicTurnCount(prev => prev + 1);
    }
    
    const reply = await GeminiService.chatReply(messages, textToSend);
    const aiMsg: Message = { role: 'model', text: reply, timestamp: Date.now() };
    const finalMsgs = [...updatedMsgs, aiMsg];
    setMessages(finalMsgs);
    updateTodayChat(finalMsgs);
    setLoading(false);
  };

  const handleChangeTopic = () => {
      sendMessage("我想换个话题聊聊");
  };

  const handleEndSession = async () => {
      setIsEndingSession(true);
      setLoading(true);
      const titles = await GeminiService.generateTitles(messages);
      setSuggestedTitles(titles);
      setLoading(false);
  };

  const selectTitle = (title: string) => {
    if (!todayEntry) return;
    
    // 1. Update Data
    const updatedEntry: DayEntry = {
        ...todayEntry,
        todayAwareness: {
            ...todayEntry.todayAwareness!,
            selectedTitle: title,
            status: 'done'
        }
    };
    const otherEntries = userData.filter(d => d.date !== todayStr);
    onUpdateData([...otherEntries, updatedEntry]);

    // 2. Show Completion Screen (Modal Overlay)
    setShowCompletionScreen(true);
  };

  const startTomorrowRitual = () => {
      setShowCompletionScreen(false);
      setIsPickingTomorrow(true);
      setCarouselState('idle');
      setRotationAngle(0);
      snapTargetRef.current = null;
      setViewMode('carousel');
  };

  const handleSaveTomorrowSeed = (skipGoal: boolean = false) => {
      if (!todayEntry || !tomorrowCard) return;

      const nextDayStr = getNextDayStr(todayStr);
      const existingNextDayEntry = userData.find(d => d.date === nextDayStr);

      // 1. Save the goal to TOMORROW'S entry
      const nextDayEntry: DayEntry = {
          date: nextDayStr,
          moonPhase: existingNextDayEntry ? existingNextDayEntry.moonPhase : calculateMoonPhase(new Date(nextDayStr)),
          ...existingNextDayEntry,
          tomorrowSeed: {
              cardId: tomorrowCard.id,
              energySeed: skipGoal ? '' : seedInput,
              blessingCompleted: true,
              aiSuggestion: '',
              status: 'done'
          }
      };

      // 2. Mark TODAY'S entry as done, but HIDE the energySeed text
      // This ensures the ArchiveView (Calendar) doesn't show "Today's Goal" for today
      const updatedTodayEntry: DayEntry = {
          ...todayEntry,
          tomorrowSeed: {
              cardId: tomorrowCard.id, // Keep ID for reference
              energySeed: '', // Clear text so it doesn't appear in today's calendar
              blessingCompleted: true,
              aiSuggestion: '',
              status: 'done'
          }
      };
      
      const otherEntries = userData.filter(d => d.date !== todayStr && d.date !== nextDayStr);
      onUpdateData([...otherEntries, updatedTodayEntry, nextDayEntry]);
      
      setViewMode('hub');
      setIsPickingTomorrow(false);
      setSeedInput('');
      setTomorrowCard(null);
  };

  const closeCompletionScreen = () => {
      setShowCompletionScreen(false);
      setViewMode('hub');
  };

  const handleYesterdayReview = async (completed: boolean) => {
      if (!yesterdayEntry || !yesterdayEntry.tomorrowSeed) return;
      
      setReviewLoading(true);
      const goal = yesterdayEntry.tomorrowSeed.energySeed;
      const feedback = await GeminiService.reviewYesterday(goal, completed);
      
      const updatedYesterday: DayEntry = {
          ...yesterdayEntry,
          tomorrowSeed: {
              ...yesterdayEntry.tomorrowSeed,
              isCompleted: completed,
              completionMessage: feedback,
              status: 'done'
          }
      };

      const otherEntries = userData.filter(d => d.date !== yesterdayStr);
      onUpdateData([...otherEntries, updatedYesterday]);
      setReviewLoading(false);
  };

  useEffect(() => {
      if (todayEntry?.todayAwareness?.status === 'done' || (todayEntry?.todayAwareness?.chatHistory.length || 0) > 0) {
          if (todayEntry?.todayAwareness?.chatHistory) {
             setMessages(todayEntry.todayAwareness.chatHistory);
             if (todayEntry.todayAwareness.selectedTitle) {
                 setSuggestedTitles([]); 
             }
          }
      }
  }, [todayEntry]);

  const enterToday = () => {
      if (todayEntry) {
          // Returning to existing chat
          setCardRevealState('docked'); // Already revealed
          setViewMode('chat');
      } else {
          setIsPickingTomorrow(false);
          setEnergyLevel(50);
          setViewMode('energy_input');
      }
  };


  // --- RENDERING ---

  // MODAL: COMPLETION SCREEN OVERLAY
  const renderCompletionModal = () => {
      if (!showCompletionScreen || !todayEntry) return null;
      const card = deck.find(c => c.id === todayEntry.todayAwareness?.cardId);

      return (
          <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
              
              {/* Background Ambient */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>

              <div className="relative w-full max-w-sm flex flex-col items-center z-10">
                  <div className="mb-6 text-center animate-in slide-in-from-bottom-8 duration-700">
                      <h2 className="text-2xl font-serif text-white tracking-[0.2em] mb-1">今日归档</h2>
                      <div className="w-12 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto"></div>
                  </div>

                  {/* The Card Presentation */}
                  <div className="relative group perspective-1000 mb-8 animate-in zoom-in-95 duration-1000 delay-100">
                      <div className="relative w-64 h-[22rem] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(129,140,248,0.25)] border border-white/10 bg-slate-900 transition-transform duration-700 transform hover:scale-[1.02]">
                          {/* Image */}
                          <div className="h-[65%] w-full relative overflow-hidden">
                                <img src={card?.imageUrl} alt={card?.name} className="w-full h-full object-cover opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
                          </div>
                          
                          {/* Text Content */}
                          <div className="absolute bottom-0 w-full h-[35%] p-6 flex flex-col items-center justify-center text-center bg-slate-900/40 backdrop-blur-md">
                                <h3 className="text-xl font-serif text-white mb-2">{todayEntry.todayAwareness?.selectedTitle}</h3>
                                <p className="text-indigo-200 text-xs tracking-widest uppercase font-sans mb-1">{card?.name}</p>
                                <p className="text-slate-500 text-[10px] tracking-widest font-sans">{todayEntry.date}</p>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                      {!todayEntry.tomorrowSeed?.status || todayEntry.tomorrowSeed.status !== 'done' ? (
                          <>
                             <button 
                                onClick={startTomorrowRitual}
                                className="w-full py-4 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center justify-center space-x-2"
                             >
                                 <Sparkles size={18} fill="currentColor" className="text-slate-900" />
                                 <span>抽取明日指引</span>
                             </button>
                             <button 
                                onClick={closeCompletionScreen}
                                className="w-full py-3 text-slate-400 text-sm hover:text-white transition-colors tracking-widest font-serif"
                             >
                                 稍后再抽
                             </button>
                          </>
                      ) : (
                          <button 
                            onClick={closeCompletionScreen}
                            className="w-full py-4 bg-slate-800 text-white rounded-full font-serif tracking-widest hover:bg-slate-700 transition-colors border border-white/10"
                          >
                             返回首页
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  // VIEW: ENERGY INPUT RITUAL
  if (viewMode === 'energy_input') {
      const getEnergyLabel = (level: number) => {
          if (level < 20) return "低潮";
          if (level < 40) return "蓄力";
          if (level < 60) return "平稳";
          if (level < 80) return "活跃";
          return "充盈";
      };

      // Adjusted brightness calculation: 0.35 + ... (Floored higher)
      const brightness = 0.35 + (energyLevel / 100) * 0.65;

      return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden animate-in fade-in duration-700">
             <button onClick={() => setViewMode('hub')} className="absolute top-6 left-6 text-slate-500 hover:text-white z-50"><ArrowLeft /></button>
             
             <div className="absolute top-12 w-full text-center z-40 px-6">
                <h2 className="text-2xl font-serif text-white mb-2">能量校准</h2>
                <p className="text-xs text-slate-400 tracking-widest uppercase">感受当下的频率</p>
             </div>

             <div className="relative mb-12 animate-float">
                 <RealisticMoon 
                    phase={MoonPhase.WAXING_GIBBOUS} 
                    size={160} 
                    brightness={brightness} 
                />
             </div>

             <div className="w-full max-w-xs space-y-6 z-20">
                 <div className="text-center space-y-1">
                     <span className="text-3xl font-serif text-white transition-all duration-300" style={{ textShadow: `0 0 ${energyLevel/2}px rgba(129,140,248,0.8)` }}>
                         {energyLevel}%
                     </span>
                     <p className="text-indigo-300 text-sm font-serif tracking-widest">{getEnergyLabel(energyLevel)}</p>
                 </div>

                 <div className="relative w-full h-12 flex items-center">
                     <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none relative z-10"
                        style={{
                            backgroundImage: `linear-gradient(to right, #4f46e5 0%, #818cf8 ${energyLevel}%, #1e293b ${energyLevel}%, #1e293b 100%)`
                        }}
                     />
                 </div>
                 
                 <button 
                    onClick={confirmEnergy}
                    className="w-full py-4 mt-8 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center space-x-2"
                 >
                     <Zap size={18} fill="currentColor" />
                     <span>开启今日抽牌</span>
                 </button>
             </div>
        </div>
      );
  }

  // VIEW 1: HUB
  if (viewMode === 'hub') {
    const hasToday = !!todayEntry;
    const hasNewTomorrowSeed = todayEntry?.tomorrowSeed?.status === 'done';
    
    // FETCH LOGIC:
    // If today's flow is done (hasNewTomorrowSeed), we actually want to show the NEXT DAY'S data
    // because that's where we stored the goal.
    const nextDayStr = getNextDayStr(todayStr);
    const nextDayEntry = userData.find(d => d.date === nextDayStr);
    
    const displayCardEntry = hasNewTomorrowSeed ? nextDayEntry : yesterdayEntry;
    
    const displayCardId = hasNewTomorrowSeed 
        ? nextDayEntry?.tomorrowSeed?.cardId 
        : yesterdayEntry?.tomorrowSeed?.cardId;
        
    const displayCard = deck.find(c => c.id === displayCardId) || deck[0];
    
    const isInteractiveReview = !hasNewTomorrowSeed && !!yesterdayEntry?.tomorrowSeed;
    
    // Note: displayCardEntry might be undefined if we just saved but userData update hasn't propagated fully 
    // or if nextDayEntry logic failed, but state update should trigger re-render.
    const seedText = displayCardEntry?.tomorrowSeed?.energySeed || "未设定目标";
    const hasReview = !!displayCardEntry?.tomorrowSeed?.completionMessage;
    const isCompleted = displayCardEntry?.tomorrowSeed?.isCompleted;

    const topTitle = hasNewTomorrowSeed ? "明日指引" : "昨日回顾";
    const topDate = hasNewTomorrowSeed ? "Tomorrow" : (yesterdayEntry ? yesterdayStr : 'Void');
    
    return (
      <div className="flex flex-col items-center h-full pt-4 px-6 pb-24 overflow-hidden relative">
        <div className="flex-1 w-full flex flex-col items-center justify-center space-y-4 z-10 perspective-1000">
             <div className="text-center space-y-1 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
                 <h2 className="text-slate-400 text-xs uppercase tracking-[0.3em]">{topDate}</h2>
                 <p className="text-white font-serif text-lg opacity-80">{topTitle}</p>
             </div>

             <div 
                className="relative w-64 h-[380px] cursor-pointer group"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    setIsYesterdayFlipped(!isYesterdayFlipped);
                }}
             >
                 <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isYesterdayFlipped ? 'rotate-y-180' : ''}`}>
                     {/* FRONT */}
                     <div className={`absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-slate-800 backface-hidden transition-all duration-700 ${isCompleted && isInteractiveReview ? 'shadow-[0_0_50px_rgba(255,215,0,0.4)] border-amber-500/30' : 'shadow-2xl'}`}>
                         <img src={displayCard.imageUrl} className="w-full h-full object-cover opacity-90" alt="Card" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                         <div className="absolute bottom-8 left-0 w-full flex flex-col items-center px-4">
                             <h3 className="text-2xl font-serif text-white mb-4 drop-shadow-md">{displayCard.name}</h3>
                             {hasNewTomorrowSeed ? (
                                 <p className="text-xs text-indigo-200 font-sans tracking-widest uppercase drop-shadow">明日能量指引</p>
                             ) : (
                                 <div className="flex items-center space-x-2 bg-slate-900/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] animate-pulse">
                                     <RotateCcw size={14} className="text-indigo-300" />
                                     <span className="text-xs text-white font-sans tracking-widest uppercase font-bold">点击翻转 · 回顾昨日</span>
                                 </div>
                             )}
                         </div>
                     </div>
                     {/* BACK */}
                     <div className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center transition-all duration-700`}>
                         {/* Logic for Back content omitted for brevity, keeping existing structure implicitly */}
                         {hasNewTomorrowSeed ? (
                             <div className="flex flex-col items-center justify-center h-full animate-in fade-in">
                                 <Sparkles className="text-indigo-400 mb-4 mx-auto animate-pulse" />
                                 <h3 className="text-lg font-serif text-white mb-2">明日小目标</h3>
                                 <div className="h-px w-12 bg-white/20 mx-auto mb-6"></div>
                                 <p className="text-indigo-200 font-serif text-xl leading-relaxed">"{seedText}"</p>
                             </div>
                         ) : (
                             !hasReview ? (
                                 <div className="flex flex-col items-center justify-between h-full py-4 animate-in fade-in">
                                     <div>
                                         <Sparkles className="text-moon-accent mb-4 mx-auto" />
                                         <h3 className="text-lg font-serif text-white mb-2">昨日小目标</h3>
                                         <div className="h-px w-12 bg-white/20 mx-auto mb-6"></div>
                                         <p className="text-white font-serif text-xl leading-relaxed">"{seedText}"</p>
                                     </div>
                                     <div className="w-full space-y-3 mt-6">
                                         {reviewLoading ? (
                                             <p className="text-slate-400 text-xs animate-pulse">星辰正在回应...</p>
                                         ) : (
                                             <>
                                                 <button onClick={() => handleYesterdayReview(true)} className="w-full py-3 rounded-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center space-x-2 text-sm"><CheckCircle2 size={16} /><span>完成了</span></button>
                                                 <button onClick={() => handleYesterdayReview(false)} className="w-full py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center space-x-2 text-sm"><XCircle size={16} /><span>没完成</span></button>
                                             </>
                                         )}
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-700">
                                     {isCompleted ? <div className="text-amber-300 mb-4 animate-pulse"><Sparkles size={32} /></div> : <div className="text-slate-400 mb-4 opacity-70"><StopCircle size={32} /></div>}
                                     <h3 className={`text-lg font-serif mb-6 ${isCompleted ? 'text-amber-100' : 'text-slate-300'}`}>{isCompleted ? "能量已锚定" : "温柔的接纳"}</h3>
                                     <p className={`font-serif text-lg leading-relaxed italic ${isCompleted ? 'text-white' : 'text-slate-300'}`}>"{displayCardEntry?.tomorrowSeed?.completionMessage}"</p>
                                 </div>
                             )
                         )}
                     </div>
                 </div>
             </div>
        </div>

        {/* --- MYSTERIOUS BUTTON REDESIGN (UPDATED: More bottom margin) --- */}
        <div className="w-full max-w-xs z-20 mb-32">
            <button 
                onClick={enterToday}
                className="group relative w-full overflow-hidden rounded-full p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30"
            >
                <div className="relative flex items-center justify-between bg-slate-950/90 rounded-full px-8 py-5">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Sparkles size={18} className="text-indigo-300 relative z-10" />
                            <div className="absolute inset-0 bg-indigo-400 blur-lg opacity-30"></div>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-white font-serif text-lg tracking-widest leading-none">{hasToday ? "继续今日对话" : "开始今日抽牌"}</span>
                            <span className="text-[9px] text-indigo-300/60 uppercase tracking-[0.2em] mt-1.5 leading-none">Unlock your inner cosmos</span>
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-600" />
                </div>
            </button>
        </div>
      </div>
    );
  }

  // VIEW 2: 3D CAROUSEL (UPDATED MOON)
  if (viewMode === 'carousel') {
    const brightness = 0.35 + (energyLevel / 100) * 0.65;

    return (
        <div className="h-full w-full relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
            <button onClick={() => setViewMode('hub')} className="absolute top-6 left-6 text-slate-500 hover:text-white z-50"><ArrowLeft /></button>
            
            {/* LARGE PERSISTENT MOON - ADJUSTED TO DOME (Bottom Half Visible) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-90 w-full flex justify-center">
                <RealisticMoon 
                    phase={MoonPhase.WAXING_GIBBOUS} 
                    size={380} // Approx Screen Width
                    brightness={brightness}
                />
            </div>

            <div className="absolute top-28 w-full text-center z-40 px-6">
                <h2 className="text-2xl font-serif text-white mb-2 shadow-black drop-shadow-md">
                    {carouselState === 'selection' ? (isPickingTomorrow ? "明日指引" : "直觉抽牌") : (isPickingTomorrow ? "连接未来能量" : "连接宇宙意识")}
                </h2>
                <p className="text-xs text-indigo-200 tracking-widest uppercase font-medium opacity-90">
                    {carouselState === 'selection' ? "感受感召最强烈的一张牌" : "深呼吸，在心中默念你的问题"}
                </p>
            </div>

            <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000 overflow-hidden mt-16">
                <div 
                    className="relative w-0 h-0 preserve-3d transition-transform duration-0 ease-linear"
                    style={{ transform: `rotateY(${rotationAngle}deg)` }}
                >
                    {Array.from({ length: CARD_COUNT }).map((_, i) => {
                        const angle = i * (360 / CARD_COUNT);
                        const isCandidate = carouselState === 'selection' && candidateCards.includes(i);
                        const isSelected = selectedCardIndex === i;
                        
                        return (
                            <div
                                key={i}
                                className={`absolute left-0 top-0 backface-hidden transition-all duration-700 ${
                                    isCandidate ? 'opacity-100 z-50' : 'opacity-60'
                                }`}
                                style={{
                                    width: `${CARD_WIDTH}px`,
                                    height: `${CARD_HEIGHT}px`,
                                    marginTop: `-${CARD_HEIGHT / 2}px`,
                                    marginLeft: `-${CARD_WIDTH / 2}px`,
                                    transform: `
                                        rotateY(${angle}deg) 
                                        translateZ(${RADIUS}px)
                                        ${isSelected ? 'scale(2.5) rotateY(180deg) translateY(-50px) z-50' : isCandidate ? 'scale(1.2) translateY(-20px)' : 'scale(1)'}
                                    `
                                }}
                                onClick={() => isCandidate && handleCardSelect(i)}
                            >
                                <div className={`w-full h-full relative preserve-3d`}>
                                    <div className={`absolute inset-0 rounded-lg border border-indigo-200/40 bg-gradient-to-br from-indigo-900 via-slate-700 to-indigo-950 flex items-center justify-center overflow-hidden cursor-pointer backface-hidden ${isCandidate ? 'shadow-[0_0_30px_rgba(165,180,252,0.5)] ring-2 ring-indigo-300' : 'shadow-lg'}`}>
                                        <div className="absolute inset-1.5 border border-indigo-300/30 rounded-sm"></div>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                                        <Sparkles className="text-amber-200 w-8 h-8 animate-pulse" />
                                        {isCandidate && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                    </div>
                                    <div className="absolute inset-0 rounded-lg bg-indigo-500 backface-hidden rotate-y-180 flex items-center justify-center shadow-2xl border border-white/20">
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden rounded-lg">
                                            <Sparkles className="text-white w-10 h-10 animate-spin-slow" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* UPGRADED POSITION: MOVED UP TO BOTTOM-48 TO CLEAR NAV BAR */}
            <div className="absolute bottom-48 w-full flex justify-center z-50 pointer-events-auto">
                {carouselState === 'idle' && (
                    <button onClick={startShuffle} className="px-10 py-4 bg-white text-slate-900 rounded-full font-serif font-bold tracking-[0.2em] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        开始洗牌
                    </button>
                )}
                {carouselState === 'spinning' && (
                    <button onClick={stopShuffle} className="px-10 py-4 bg-indigo-600 text-white rounded-full font-serif font-bold tracking-[0.2em] hover:bg-indigo-500 transition-colors shadow-[0_0_40px_rgba(79,70,229,0.5)] animate-pulse">
                        抽牌
                    </button>
                )}
                 {carouselState === 'stopping' && (
                    <button disabled className="px-8 py-3 bg-slate-800/50 text-slate-400 rounded-full font-serif tracking-widest cursor-wait backdrop-blur-md">
                        命运显化中...
                    </button>
                )}
                 {carouselState === 'selection' && !selectedCardIndex && (
                    <div className="flex space-x-2 items-center text-indigo-100 text-sm animate-bounce font-serif tracking-widest bg-slate-900/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
                        <Sparkles size={14} />
                        <span>请凭直觉选取一张</span>
                        <Sparkles size={14} />
                    </div>
                )}
                {selectedCardIndex !== null && (
                    <div className="text-white text-sm opacity-80 font-serif tracking-widest">
                        正在揭示...
                    </div>
                )}
            </div>
        </div>
    );
  }

  // SHARED: OVERLAY CARD ANIMATION COMPONENT
  const renderCardOverlay = () => {
      // Only show if not docked yet
      if (cardRevealState === 'docked' || cardRevealState === 'hidden') return null;
      
      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-500">
              <div 
                className="flex flex-col items-center justify-center"
              >
                  {/* Card Flipper */}
                  <CardVisual 
                    imageUrl={activeCard?.imageUrl}
                    isRevealed={cardRevealState === 'revealed'}
                    className="mb-8"
                    glowing={cardRevealState === 'revealed'}
                    onClick={() => {
                        if (cardRevealState === 'revealed') setCardRevealState('docked');
                    }}
                  />

                  <div 
                    className={`text-center space-y-2 transition-opacity duration-700 ${cardRevealState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}
                  >
                      {/* Hidden Card Name to allow intuition first */}
                      <p className="text-indigo-200 text-xs uppercase tracking-[0.3em] animate-pulse">
                          点击卡牌开启对话
                      </p>
                  </div>
              </div>
          </div>
      );
  };

  // HEADER CARD ZOOM OVERLAY
  const renderZoomedHeaderCard = () => {
      if (!isHeaderCardZoomed) return null;
      return (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300"
            onClick={() => setIsHeaderCardZoomed(false)}
          >
              <button className="absolute top-6 right-6 text-slate-400 p-2 bg-white/5 rounded-full">
                  <X size={24} />
              </button>
              <div className="relative w-64 h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                   <img src={activeCard?.imageUrl} className="w-full h-full object-cover" alt="Full Card" />
                   <div className="absolute bottom-0 w-full bg-slate-900/60 backdrop-blur p-4 text-center">
                       <h3 className="text-white font-serif text-xl">{activeCard?.name}</h3>
                   </div>
              </div>
              <p className="absolute bottom-12 text-slate-500 text-xs tracking-widest">再次点击关闭</p>
          </div>
      );
  }

  // SHARED: TOP HEADER (Docked State)
  const renderChatHeader = () => {
     if (cardRevealState !== 'docked') return null;

     return (
         <div className="absolute top-0 left-0 w-full z-40 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent pt-4 pb-4 px-6 flex items-start space-x-4 animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-none">
             {/* Small Card Icon - CLICK TO ZOOM */}
             <div 
                className="w-28 h-48 rounded-xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0 relative group cursor-pointer hover:scale-105 transition-transform pointer-events-auto" 
                onClick={() => setIsHeaderCardZoomed(true)}
             >
                 <img src={activeCard?.imageUrl} className="w-full h-full object-cover opacity-90" alt="mini" />
                 <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <ZoomIn size={24} className="text-white drop-shadow-md" />
                 </div>
             </div>
         </div>
     );
  };

  // VIEW 3: CHAT
  if (viewMode === 'chat' || viewMode === 'seed_input') {
      const isDone = !!todayEntry?.todayAwareness?.selectedTitle;

      if (viewMode === 'seed_input') {
          // ... Seed Input View (Wrapped with animation logic) ...
        return (
            <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
                {/* 1. Global Overlay Card Animation */}
                {renderCardOverlay()}
                
                {/* 2. Top Bar (Always there, but behind overlay initially) */}
                <button onClick={() => setViewMode('hub')} className="absolute top-4 left-6 text-slate-500 hover:text-white z-50"><ArrowLeft /></button>

                {/* 3. Main Content (Visible only when docked) */}
                <div className={`w-full h-full flex flex-col pt-32 px-6 transition-opacity duration-700 ${cardRevealState === 'docked' ? 'opacity-100' : 'opacity-0'}`}>
                    {renderChatHeader()}
                    
                    {/* Input Area */}
                    <div className="w-full max-w-sm mx-auto flex-1 flex flex-col items-center justify-center animate-in slide-in-from-bottom-8 delay-300">
                        <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center space-x-2 mb-4 text-amber-200">
                                <Lightbulb size={18} />
                                <span className="text-sm font-serif">为明日点亮一座灯塔...</span>
                            </div>
                            {!loading && seedSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {seedSuggestions.map((s, i) => (
                                        <button key={i} onClick={() => setSeedInput(s)} className="px-3 py-1.5 bg-indigo-900/40 border border-indigo-500/30 rounded-full text-xs text-indigo-200 hover:bg-indigo-500/20 hover:text-white transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} placeholder="输入一个小小的行动目标..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 mb-6 font-serif" />
                            <div className="space-y-3">
                                <button onClick={() => handleSaveTomorrowSeed(false)} disabled={!seedInput.trim()} className="w-full py-3 bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-serif tracking-widest hover:bg-indigo-500 transition-colors shadow-lg">确认点亮</button>
                                <button onClick={() => handleSaveTomorrowSeed(true)} className="w-full py-2 text-slate-500 text-xs hover:text-slate-300 transition-colors">暂不设定，仅保存卡牌</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
      }

      return (
        <div className="flex flex-col h-full pt-6 relative overflow-hidden">
             {/* 1. Global Overlay Card Animation */}
             {renderCardOverlay()}
             {renderZoomedHeaderCard()}

             <button onClick={() => setViewMode('hub')} className="absolute top-4 left-6 text-slate-400 z-50 hover:text-white"><ArrowLeft /></button>
             
             {/* RENDER THE MODAL IF ACTIVE */}
             {showCompletionScreen && renderCompletionModal()}

             {/* Main Chat Content (Fades in after dock) */}
             <div className={`flex-1 overflow-y-auto px-4 space-y-6 pt-48 no-scrollbar min-h-0 transition-opacity duration-700 pb-4 ${cardRevealState === 'docked' ? 'opacity-100' : 'opacity-0'}`}>
                 
                 {/* Docked Header Area */}
                 {renderChatHeader()}

                 {messages.map((m, i) => (
                     <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <TarotMessage text={m.text} role={m.role} />
                     </div>
                 ))}
                 {loading && <div className="text-center text-xs text-slate-500 animate-pulse font-serif italic">星辰正在低语...</div>}
                 
                 {/* Title Selection */}
                 {suggestedTitles.length > 0 && !isDone && (
                     <div className="space-y-3 mt-8 p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30 animate-in slide-in-from-bottom-8">
                         <p className="text-center text-indigo-200 text-sm font-serif mb-4">本次对话的结语...</p>
                         
                         {/* AI Suggestions */}
                         {suggestedTitles.map((t, i) => (
                             <button key={i} onClick={() => selectTitle(t)} className="w-full p-4 bg-slate-900/80 border border-white/10 rounded-xl text-white hover:bg-indigo-900/50 hover:border-indigo-400/50 transition-all text-sm font-serif tracking-wide shadow-lg">{t}</button>
                         ))}

                         {/* Custom Title Input */}
                         <div className="pt-2 border-t border-white/10 mt-2">
                             <p className="text-xs text-slate-500 mb-2 text-center">或自定义标题：</p>
                             <div className="flex space-x-2">
                                 <input 
                                    type="text" 
                                    value={customTitle} 
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="输入你的感悟..."
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                 />
                                 <button 
                                    onClick={() => selectTitle(customTitle)}
                                    disabled={!customTitle.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs disabled:opacity-50 disabled:bg-slate-700"
                                 >
                                     确认
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Completed State (Text only, Modal handles actions) */}
                 {isDone && !showCompletionScreen && (
                     <div className="text-center p-6 mt-8 bg-white/5 rounded-xl border border-white/5 animate-in fade-in">
                         <Sparkles className="mx-auto text-moon-accent mb-2" size={20} />
                         <p className="text-slate-300 font-serif">觉察已完成</p>
                         <p className="text-indigo-300 text-lg mt-1">"{todayEntry?.todayAwareness?.selectedTitle}"</p>
                         <button onClick={() => setShowCompletionScreen(true)} className="mt-4 text-xs text-slate-500 underline">查看卡片</button>
                     </div>
                 )}
                 <div ref={messagesEndRef} />
             </div>
             
             {/* Bottom Input Area - REDESIGNED: Static at bottom of flex container, no absolute */}
             {!isDone && cardRevealState === 'docked' && (
                <div className="w-full flex-shrink-0 px-4 pt-2 pb-28 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center space-y-2">
                    {/* OPTION: CHANGE TOPIC (Appears after 5 turns) */}
                    {!loading && topicTurnCount >= 5 && !suggestedTitles.length && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in">
                            <button 
                                onClick={handleChangeTopic}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-xs text-indigo-200 hover:bg-indigo-500/40 hover:text-white transition-all backdrop-blur-md shadow-lg"
                            >
                                <RefreshCw size={12} />
                                <span>换一个话题聊聊</span>
                            </button>
                        </div>
                    )}

                    {/* End Session Button */}
                    {messages.length > 2 && !suggestedTitles.length && !loading && topicTurnCount < 5 && (
                        <div className="flex justify-center">
                            <button onClick={handleEndSession} className="flex items-center space-x-2 px-4 py-1.5 bg-slate-800/80 rounded-full border border-slate-600/50 text-xs text-slate-400 hover:text-white hover:border-slate-400 transition-colors backdrop-blur-sm">
                                <StopCircle size={12} /><span>结束对话并生成结语</span>
                            </button>
                        </div>
                    )}
                    
                    <div className="relative w-full">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="与潜意识对话..." className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full py-4 px-6 text-slate-200 focus:outline-none focus:border-indigo-500 pr-12 font-serif placeholder:text-slate-600 shadow-lg" disabled={loading || isEndingSession} />
                        <button onClick={() => sendMessage()} disabled={loading || !chatInput || isEndingSession} className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-full text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"><Send size={18} /></button>
                    </div>
                </div>
             )}
        </div>
      );
  }

  return null;
};

export default ThreeStageFlow;
