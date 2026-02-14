
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sparkles, Edit2, Check, X, MapPin, Send, Loader2, ArrowLeft, Star, Telescope, Signal, Zap, AlertCircle, Trash2, Clock, Hash, ChevronRight, BookOpen, Orbit, HelpCircle } from 'lucide-react';
import { MOON_PHASE_INFO } from '../constants';
import { MoonPhase, DayEntry, UserProfile } from '../types';
import { calculateMoonPhase } from '../utils/uiHelpers';
import RealisticMoon from '../components/RealisticMoon';

interface Props {
    data: DayEntry[];
    userProfile: UserProfile | null;
    onUpdateProfile: (profile: UserProfile) => void;
}

interface StarNote {
    id: string;
    text: string;
    author: string;
    name: string;
    x: number; 
    y: number; 
    size: number;
    delay: number;
    isMe?: boolean;
    likes: number; 
    isLiked: boolean; 
}

interface Meteor {
    id: number;
    left: number;
    top: number;
    duration: string;
    delay: string;
}

const STAR_NAMES = [
    "Sirius Alpha", "Vega", "Altair", "Nova-7", "Lyra", "Orion's Belt", "Echo-X", "Flux", 
    "Aether", "Chronos", "Lumen", "Polaris", "Antares", "Rigel", "Deneb", "Spica", 
    "Atlas", "Electra", "Maia", "Merope", "Kepler-22b", "Proxima", "Solstice", "Equinox",
    "Void Walker", "Nebula Heart", "Silent Dust", "Pale Blue", "Event Horizon", "Starlight"
];

const getRandomName = () => STAR_NAMES[Math.floor(Math.random() * STAR_NAMES.length)];

// Distributed stars across a wider percentage
const MOCK_STARS: StarNote[] = [
    { id: 's1', text: "今天意识到，接受不完美才是最大的完美。", author: "AstralWalker", name: "Sirius Alpha", x: 5, y: 30, size: 24, delay: 0, isMe: false, likes: 34, isLiked: false },
    { id: 's2', text: "月光很美，晚安世界。", author: "Luna", name: "Pale Blue", x: 45, y: 15, size: 16, delay: 1, isMe: false, likes: 12, isLiked: false },
    { id: 's3', text: "放下了执念，心里轻了很多。", author: "Echo_99", name: "Echo-X", x: 25, y: 60, size: 20, delay: 2, isMe: false, likes: 8, isLiked: false },
    { id: 's4', text: "像愚人一样勇敢跳跃吧。", author: "TarotReader", name: "The Fool Star", x: 80, y: 70, size: 28, delay: 0.5, isMe: false, likes: 156, isLiked: true },
    { id: 's5', text: "呼吸，只是呼吸。", author: "Zen", name: "Void Walker", x: 15, y: 50, size: 14, delay: 1.5, isMe: false, likes: 42, isLiked: false },
    { id: 's6', text: "宇宙的引力牵引着我们。", author: "Cosmos", name: "Gravity Well", x: 60, y: 40, size: 22, delay: 1.2, isMe: false, likes: 5, isLiked: false },
    { id: 's7', text: "爱是唯一的答案。", author: "Sophie", name: "Venus", x: 90, y: 25, size: 18, delay: 0.8, isMe: false, likes: 99, isLiked: false },
];

const SoulView: React.FC<Props> = ({ data, userProfile, onUpdateProfile }) => {
  // Use profile from props or fallback to empty default
  const defaultProfile = useMemo(() => userProfile || { birthDate: '2000-01-01', birthTime: '00:00', birthLocation: 'Unknown' }, [userProfile]);

  const [isEditing, setIsEditing] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false); // Modal State
  const [showSkyHelp, setShowSkyHelp] = useState(false); // Sky Help Modal State
  
  // Temp Edit States
  const [editDate, setEditDate] = useState(defaultProfile.birthDate);
  const [editTime, setEditTime] = useState(defaultProfile.birthTime);
  const [editLocation, setEditLocation] = useState(defaultProfile.birthLocation);

  // Sync temp state when prop changes (e.g. if loaded late)
  useEffect(() => {
      setEditDate(defaultProfile.birthDate);
      setEditTime(defaultProfile.birthTime);
      setEditLocation(defaultProfile.birthLocation);
  }, [defaultProfile]);

  // Star Sky State
  const [isSkyOpen, setIsSkyOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); 
  const [isSending, setIsSending] = useState(false); 
  const [myNote, setMyNote] = useState('');
  const [allStars, setAllStars] = useState<StarNote[]>(MOCK_STARS);
  const [focusedStar, setFocusedStar] = useState<StarNote | null>(null);
  
  // Dynamic Meteors
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate Decoration Stars (Background Twinkling)
  const bgStars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1, // Small size 1-3px
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1 // Low opacity for background
    }));
  }, []);

  // --- DYNAMIC METEOR GENERATOR ---
  useEffect(() => {
    if (!isSkyOpen) {
        setMeteors([]); // Clear meteors when closed
        return;
    }

    const spawnMeteor = () => {
        const id = Date.now();
        // Randomize Start Position
        const startLeft = Math.random() * 120 - 10; 
        const startTop = Math.random() * 60 - 20;
        
        // Randomize Speed (Duration) between 1.5s and 3.5s
        const duration = `${(Math.random() * 2 + 1.5).toFixed(1)}s`;

        setMeteors(prev => [...prev, { id, left: startLeft, top: startTop, duration, delay: '0s' }]);

        // Cleanup
        setTimeout(() => {
            setMeteors(prev => prev.filter(m => m.id !== id));
        }, 4000); // Max duration

        // Schedule next meteor (Random interval between 0.8s to 4s)
        const nextDelay = Math.random() * 3200 + 800;
        spawnTimerRef.current = setTimeout(spawnMeteor, nextDelay);
    };

    // Initial Start
    const spawnTimerRef: { current: any } = { current: null };
    spawnTimerRef.current = setTimeout(spawnMeteor, 1000);

    return () => clearTimeout(spawnTimerRef.current);
  }, [isSkyOpen]);

  // --- DERIVED DATA ---
  
  // 1. Dynamic Natal Info Calculation
  const natalPhase = useMemo(() => {
      const dateParts = defaultProfile.birthDate.split('-').map(Number);
      if (dateParts.length === 3) {
          const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          return calculateMoonPhase(date);
      }
      return MoonPhase.NEW;
  }, [defaultProfile.birthDate]);
  
  const natalInfo = MOON_PHASE_INFO[natalPhase];

  const getSoulAdvice = (phase: MoonPhase) => {
      switch (phase) {
          case MoonPhase.NEW: return "你拥有像种子一样破土而出的原始力量。你的灵魂课题是相信直觉，在未知中勇敢开启新的篇章，不要害怕混乱，那是你创造力的源泉。";
          case MoonPhase.WAXING_CRESCENT: return "你是一个天生的探索者。你的灵魂渴望收集信息与体验，保持好奇心是你活力的来源。试着在行动前多一份确信，你的光芒会逐渐显现。";
          case MoonPhase.FIRST_QUARTER: return "你拥有在张力中成长的天赋。你的灵魂善于在危机中寻找突破口，是个天生的战士。学会平衡内在的冲突，将其转化为建设性的行动力。";
          case MoonPhase.WAXING_GIBBOUS: return "你是一个追求完美的分析者。你的灵魂渴望在此刻做到最好，不仅为了自己，也为了他人。学会接纳过程中的不完美，你的能量会更加流畅。";
          case MoonPhase.FULL: return "你拥有照亮他人的天赋，情感充沛且具有感染力。你的灵魂课题是在关系中看见真实的自己，而非迷失在外界的投射中。保持内在的客观与清明。";
          case MoonPhase.WANING_GIBBOUS: return "你是一个智慧的传播者。你的灵魂倾向于回馈与分享，你拥有将个人经验转化为普世智慧的能力。去教导，去分享，这是你能量循环的关键。";
          case MoonPhase.LAST_QUARTER: return "你拥有断舍离的决绝与勇气。你的灵魂擅长清理不再服务于生命的事物，为新周期腾出空间。不要执着于旧有的形式，你的力量在于重塑。";
          case MoonPhase.WANING_CRESCENT: return "你是一个连接虚空的隐士。你的灵魂倾向于内省、灵性与深度的休息。在这个喧嚣的世界，保护好你的独处时间，那是你智慧的摇篮。";
          default: return "倾听你内在的声音，宇宙的引力自会指引方向。";
      }
  };
  
  const soulAdvice = getSoulAdvice(natalPhase);

  // 2. Dynamic Energy Color based on Latest Entry
  const latestEntry = data[data.length - 1];
  const todayEntry = data.find(d => {
      const todayStr = new Date().toISOString().split('T')[0];
      return d.date === todayStr;
  });
  const currentEnergy = todayEntry?.todayAwareness?.energyLevel ?? 50;

  const getMoodColor = (level: number) => {
      if (level >= 80) return { glow: 'bg-amber-500', text: 'text-amber-400', filter: 'hue-rotate(30deg)', label: '金色 · 辉煌' }; 
      if (level >= 60) return { glow: 'bg-rose-500', text: 'text-rose-400', filter: 'hue-rotate(0deg) saturate(1.5)', label: '绯红 · 热情' }; 
      if (level >= 40) return { glow: 'bg-indigo-500', text: 'text-indigo-400', filter: 'none', label: '靛蓝 · 沉静' }; 
      if (level >= 20) return { glow: 'bg-cyan-600', text: 'text-cyan-400', filter: 'hue-rotate(180deg)', label: '青蓝 · 清晰' }; 
      return { glow: 'bg-slate-500', text: 'text-slate-400', filter: 'grayscale(100%)', label: '银灰 · 虚空' }; 
  };

  const moodStyle = getMoodColor(currentEnergy);

  // --- HANDLERS ---
  const saveProfile = () => {
      onUpdateProfile({
          birthDate: editDate,
          birthTime: editTime,
          birthLocation: editLocation,
          isSkipped: false // Once edited, it's no longer skipped
      });
      setIsEditing(false);
  };

  const cancelEdit = () => {
      setEditDate(defaultProfile.birthDate);
      setEditTime(defaultProfile.birthTime);
      setEditLocation(defaultProfile.birthLocation);
      setIsEditing(false);
  };

  const openSky = () => {
      setIsSkyOpen(true);
      setIsClosing(false);
      setTimeout(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 50);
  };

  const closeSky = () => {
      setIsClosing(true);
      setTimeout(() => {
          setIsSkyOpen(false);
          setIsClosing(false);
      }, 700);
  };

  const handleSendToSky = () => {
      if (!myNote.trim()) return;
      setIsSending(true);
      setTimeout(() => {
          const newStar: StarNote = {
              id: Date.now().toString(),
              text: myNote,
              author: "我",
              name: getRandomName(),
              x: Math.random() * 20 + 5, 
              y: Math.random() * 70 + 15,
              size: Math.random() * 10 + 20, 
              delay: 0,
              isMe: true,
              likes: 0,
              isLiked: false
          };
          setAllStars(prev => [...prev, newStar]);
          setMyNote('');
          setIsSending(false);
          if (!isSkyOpen) {
              openSky();
          }
      }, 1200);
  };

  const handleDeleteStar = (starId: string) => {
      setAllStars(prev => prev.filter(s => s.id !== starId));
      setFocusedStar(null);
  };

  const toggleResonance = (starId: string) => {
      setAllStars(prevStars => prevStars.map(star => {
          if (star.id === starId) {
              const isNowLiked = !star.isLiked;
              const newLikes = isNowLiked ? star.likes + 1 : star.likes - 1;
              if (focusedStar && focusedStar.id === starId) {
                  setFocusedStar({ ...star, isLiked: isNowLiked, likes: newLikes });
              }
              return { ...star, isLiked: isNowLiked, likes: newLikes };
          }
          return star;
      }));
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 pt-2 text-center space-y-3 animate-in fade-in duration-700 overflow-y-auto no-scrollbar pb-24">
        
        {/* SECTION 1: CENTRAL NATAL MOON & IDENTITY (Redesigned) */}
        <div className="w-full flex flex-col items-center justify-center relative mt-2 mb-1">
             
             {/* Decorative Orbit Rings */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-indigo-500/10 rounded-full animate-spin-slow pointer-events-none"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-white/5 rounded-full pointer-events-none"></div>

             {/* Main Moon Avatar */}
             <div className="relative w-32 h-32 flex items-center justify-center group z-10">
                 {/* Glow */}
                 <div className={`absolute inset-0 blur-[35px] opacity-40 animate-pulse-slow transition-colors duration-1000 ${moodStyle.glow}`}></div>
                 
                 <div className="relative w-full h-full flex items-center justify-center animate-float" style={{ filter: moodStyle.filter, transition: 'filter 1s ease' }}>
                    <RealisticMoon phase={natalPhase} size={110} />
                 </div>
             </div>

             {/* User Info */}
             <div className="mt-4 flex flex-col items-center z-10">
                 <h2 className="text-xl font-serif text-white tracking-widest mb-1">
                    {defaultProfile.isSkipped ? "访客" : natalInfo.cnName}
                 </h2>
                 <p className="text-indigo-200/60 text-[10px] uppercase tracking-[0.2em] mb-2">
                     {defaultProfile.isSkipped ? "GUEST ASTRONAUT" : "NATAL PHASE"}
                 </p>
                 
                 {/* Location / Edit Trigger */}
                 {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        {defaultProfile.isSkipped ? (
                             <>
                                <AlertCircle size={10} className="text-indigo-400" />
                                <span className="text-[10px] text-indigo-300 tracking-wider">点击校准星图</span>
                             </>
                        ) : (
                             <>
                                <MapPin size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400 tracking-wide">{defaultProfile.birthLocation}</span>
                                <div className="w-px h-2 bg-slate-600 mx-1"></div>
                                <Edit2 size={10} className="text-slate-500" />
                             </>
                        )}
                    </button>
                 )}
             </div>
        </div>

        {/* SECTION 2: EDITING FORM (Expands) */}
        {isEditing && (
            <div className="w-full bg-slate-900/90 border border-indigo-500/50 rounded-xl p-4 space-y-3 animate-in zoom-in-95 shadow-2xl relative z-20 backdrop-blur-xl">
                <div className="flex flex-col space-y-1 text-left">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest">Date</label>
                    <input 
                        type="date" 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors font-serif"
                    />
                </div>
                <div className="flex space-x-2">
                    <div className="flex flex-col space-y-1 text-left flex-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest">Time</label>
                        <input 
                            type="time" 
                            value={editTime} 
                            onChange={(e) => setEditTime(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors font-serif"
                        />
                    </div>
                    <div className="flex flex-col space-y-1 text-left flex-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest">Location</label>
                        <input 
                            type="text" 
                            value={editLocation} 
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors font-serif"
                        />
                    </div>
                </div>
                <div className="flex space-x-2 pt-2">
                    <button onClick={saveProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors shadow-lg">
                        <Check size={12} /> <span>保存</span>
                    </button>
                    <button onClick={cancelEdit} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors">
                        <X size={12} /> <span>取消</span>
                    </button>
                </div>
            </div>
        )}

        {/* SECTION 3: SOUL MESSAGE (Interactive & Educational) */}
        <button 
            onClick={() => !defaultProfile.isSkipped && setShowKnowledge(true)}
            className="w-full bg-gradient-to-br from-white/5 to-slate-900/50 rounded-2xl p-4 border border-white/10 text-left shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-700 delay-100 relative overflow-hidden group hover:bg-white/10 transition-all active:scale-[0.99]"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
            
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline">
                    <h3 className="flex items-center text-indigo-200 text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={12} className="mr-2 text-indigo-400" />
                        灵魂寄语
                    </h3>
                    <span className="text-[10px] text-slate-500 ml-2 font-serif italic tracking-wide">/ 你的本命月亮</span>
                </div>
                {!defaultProfile.isSkipped && (
                    <div className="flex items-center text-[10px] text-indigo-300/70 group-hover:text-indigo-200 transition-colors">
                        <span>查看解读</span>
                        <ChevronRight size={10} className="ml-0.5" />
                    </div>
                )}
            </div>
            
            {/* Conditional Content */}
            {defaultProfile.isSkipped ? (
                <div className="text-center py-2">
                    <p className="text-slate-400 text-sm leading-relaxed font-serif italic">
                        "星空正在等待你的坐标。"
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-between mt-1">
                    <div className="flex-1">
                        <p className="text-slate-300 text-sm font-serif mb-1">
                            作为<span className="text-indigo-200 mx-1 font-bold">{natalInfo.cnName}</span>，你拥有{natalInfo.blessing}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {natalInfo.keywords?.split('·').map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/10 rounded-md text-[10px] text-indigo-200 tracking-wider">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </button>

        {/* SECTION 4: GALAXY NOTE INPUT */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="flex justify-between items-center mb-2 px-1">
             <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                 <Telescope size={12} />
                 星空随笔 · Galaxy Note
             </h3>
             <button onClick={openSky} className="text-[10px] text-indigo-300 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                 进入全屏星空 <ArrowLeft className="rotate-180" size={8} />
             </button>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-1 border border-white/10 backdrop-blur-sm group focus-within:border-indigo-500/30 transition-colors">
              <div className="bg-slate-950/50 rounded-xl p-3">
                <textarea 
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="写下你此刻的感悟，将它发射到宇宙星空..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 font-serif resize-none outline-none min-h-[50px]"
                />
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-600">{myNote.length}/100</span>
                    <button 
                        onClick={handleSendToSky}
                        disabled={!myNote.trim() || isSending}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[10px] px-3 py-1.5 rounded-full transition-all shadow-lg active:scale-95"
                    >
                        {isSending ? (
                            <><span>发射中...</span><Loader2 size={10} className="animate-spin" /></>
                        ) : (
                            <><span>发射信号</span><Send size={10} /></>
                        )}
                    </button>
                </div>
              </div>
          </div>
        </div>

      {/* --- MOON KNOWLEDGE MODAL --- */}
      {showKnowledge && (
          <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
               <div className="w-full h-full max-w-md bg-slate-900 border-x border-white/5 flex flex-col relative shadow-2xl">
                    
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                        <button 
                            onClick={() => setShowKnowledge(false)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <span className="text-xs text-indigo-200 tracking-widest uppercase font-sans">本命月相解读</span>
                        <div className="w-9"></div> 
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-24 pb-12 no-scrollbar">
                        {/* 1. Visual Header */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-6">
                                <RealisticMoon phase={natalPhase} size={140} brightness={1.1} />
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] -z-10 rounded-full"></div>
                            </div>
                            <h2 className="text-3xl font-serif text-white tracking-wide mb-2">{natalInfo.cnName}</h2>
                            <p className="text-slate-400 text-sm font-serif italic">"{natalInfo.blessing}"</p>
                        </div>

                        {/* 2. Physics Section */}
                        <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                             <h3 className="flex items-center text-indigo-200 text-sm font-bold mb-3 uppercase tracking-wider">
                                <Orbit size={14} className="mr-2 text-indigo-400" />
                                天文学视角
                            </h3>
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <p className="text-slate-300 font-serif leading-7 text-sm text-justify">
                                    {natalInfo.physics}
                                </p>
                            </div>
                        </div>

                        {/* 3. Archetype Section */}
                        <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                             <h3 className="flex items-center text-amber-200 text-sm font-bold mb-3 uppercase tracking-wider">
                                <Sparkles size={14} className="mr-2 text-amber-400" />
                                能量原型
                            </h3>
                            <div className="p-5 bg-gradient-to-br from-indigo-900/20 to-slate-900 rounded-xl border border-indigo-500/20">
                                <p className="text-white font-serif leading-7 text-sm text-justify">
                                    {natalInfo.archetype}
                                </p>
                            </div>
                        </div>

                        {/* 4. Soul Advice Section */}
                        <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                             <h3 className="flex items-center text-indigo-200 text-sm font-bold mb-3 uppercase tracking-wider">
                                <BookOpen size={14} className="mr-2 text-indigo-400" />
                                灵魂建议
                            </h3>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-indigo-100 font-serif leading-7 text-sm italic">
                                    "{soulAdvice}"
                                </p>
                            </div>
                        </div>
                    </div>
               </div>
          </div>
      )}

      {/* --- SKY HELP MODAL --- */}
      {showSkyHelp && (
          <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs relative text-center shadow-2xl animate-in zoom-in-95">
                   <button onClick={() => setShowSkyHelp(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={18} /></button>
                   <h3 className="text-xl font-serif text-white mb-6 tracking-wide">星空漫游指南</h3>
                   
                   <div className="space-y-6">
                       <div className="flex items-start space-x-4 text-left">
                           <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-300">
                               <Star size={18} />
                           </div>
                           <div>
                               <h4 className="text-white text-sm font-bold mb-1">聆听回响</h4>
                               <p className="text-slate-400 text-xs leading-relaxed">点击星空中闪烁的星辰，阅读来自其他时空的灵魂随笔。</p>
                           </div>
                       </div>
                       
                       <div className="flex items-start space-x-4 text-left">
                           <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-300">
                               <Zap size={18} />
                           </div>
                           <div>
                               <h4 className="text-white text-sm font-bold mb-1">能量共振</h4>
                               <p className="text-slate-400 text-xs leading-relaxed">遇到触动心弦的讯号，点击“感应能量”为其点亮光芒。</p>
                           </div>
                       </div>

                       <div className="flex items-start space-x-4 text-left">
                           <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-300">
                               <Send size={18} />
                           </div>
                           <div>
                               <h4 className="text-white text-sm font-bold mb-1">发射讯号</h4>
                               <p className="text-slate-400 text-xs leading-relaxed">在底部输入框写下当下的感悟，将其化作流星发射到宇宙。</p>
                           </div>
                       </div>
                   </div>

                   <button 
                      onClick={() => setShowSkyHelp(false)}
                      className="w-full mt-8 py-3 bg-white text-slate-900 rounded-full font-bold text-xs tracking-widest hover:bg-slate-200"
                   >
                       开始探索
                   </button>
               </div>
          </div>
      )}

      {/* --- SKY OVERLAY --- */}
      {isSkyOpen && (
          <div 
            className={`fixed top-0 bottom-0 left-0 right-0 mx-auto w-full max-w-md z-[100] bg-slate-950 flex flex-col overflow-hidden shadow-2xl transition-all duration-700 ease-in-out
                ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                animate-in fade-in zoom-in-95
            `}
          >
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-900/30 rounded-full blur-[100px] opacity-60"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-violet-900/30 rounded-full blur-[100px] opacity-60"></div>
                  <div className="absolute top-[40%] left-[20%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[80px] opacity-40"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 opacity-80"></div>
                  {bgStars.map((star) => (
                      <div
                          key={star.id}
                          className="absolute bg-indigo-200 rounded-full animate-twinkle"
                          style={{
                              left: `${star.x}%`,
                              top: `${star.y}%`,
                              width: `${star.size}px`,
                              height: `${star.size}px`,
                              opacity: star.opacity,
                              animationDelay: `${star.delay}s`
                          }}
                      />
                  ))}
                  {meteors.map((m) => (
                       <div 
                            key={m.id}
                            className="meteor-effect animate-meteor"
                            style={{ 
                                left: `${m.left}%`, 
                                top: `${m.top}%`,
                                animationDuration: m.duration,
                                animationDelay: m.delay
                            }}
                       />
                  ))}
              </div>

              {/* Sky Header */}
              <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent h-28 pointer-events-none">
                  <button 
                    onClick={closeSky}
                    className="pointer-events-auto flex items-center space-x-2 text-slate-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg"
                  >
                      <ArrowLeft size={16} />
                      <span className="text-xs font-serif tracking-widest">返回</span>
                  </button>
                  <div className="flex items-center space-x-3 pointer-events-auto">
                        <button 
                            onClick={() => setShowSkyHelp(true)}
                            className="p-2 bg-white/5 rounded-full text-indigo-300 hover:text-white border border-white/5 backdrop-blur-md"
                        >
                            <HelpCircle size={16} />
                        </button>
                        <div className="text-right pointer-events-auto">
                            <h2 className="text-lg font-serif text-white tracking-[0.2em] text-shadow-md">众星回响</h2>
                            <div className="flex items-center justify-end space-x-1">
                                <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                                <p className="text-[10px] text-indigo-300 tracking-widest uppercase">Live Signal</p>
                            </div>
                        </div>
                  </div>
              </div>

              {/* Star Container - Adjusted bottom padding for input bar */}
              <div 
                ref={scrollContainerRef}
                className="absolute inset-0 overflow-x-auto overflow-y-hidden no-scrollbar z-10 pb-20"
              >
                  <div className="relative h-full w-[300%]">
                      <div className="absolute top-28 bottom-20 left-0 right-0">
                          {allStars.map((star) => (
                              <button
                                  key={star.id}
                                  onClick={() => setFocusedStar(star)}
                                  className="absolute group focus:outline-none p-4 -ml-4 -mt-4 transition-transform active:scale-90"
                                  style={{
                                      left: `${star.x}%`,
                                      top: `${star.y}%`, 
                                      animation: star.isMe 
                                        ? `pulse 3s infinite ease-in-out`
                                        : (star.isLiked ? 'none' : `pulse-fast 1.5s infinite ease-in-out ${star.delay}s`)
                                  }}
                              >
                                  {star.isLiked && !star.isMe && (
                                    <>
                                        <div className="absolute inset-0 bg-white/30 blur-xl rounded-full"></div>
                                        <div className="absolute inset-0 border border-white/50 rounded-full opacity-40"></div>
                                    </>
                                  )}
                                  {star.isMe && (
                                      <>
                                        <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full"></div>
                                      </>
                                  )}
                                  <Star 
                                      fill="currentColor" 
                                      className={`transition-all duration-700 relative z-10
                                        ${star.isMe 
                                            ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.9)] scale-150 hover:scale-150' 
                                            : star.isLiked
                                                ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] scale-125 opacity-100 hover:scale-150' 
                                                : 'text-indigo-200 opacity-85 hover:opacity-100 hover:scale-125 hover:text-white drop-shadow-md'
                                        } 
                                        ${focusedStar?.id === star.id ? 'scale-150 text-white opacity-100' : ''}
                                      `}
                                      size={star.size}
                                      strokeWidth={0}
                                  />
                                  {star.isMe && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-amber-200 opacity-60 font-sans tracking-widest whitespace-nowrap">ME</span>}
                              </button>
                          ))}
                           <div className="absolute left-[30%] top-1/2 -translate-y-1/2 text-white/10 text-4xl animate-pulse select-none pointer-events-none">›</div>
                      </div>
                  </div>
              </div>
              
              {/* Sky Input Bar */}
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-40 pb-8 pointer-events-auto">
                    <div className="flex items-center space-x-2 max-w-md mx-auto">
                        <div className="flex-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center px-4 py-2">
                            <input 
                                value={myNote}
                                onChange={(e) => setMyNote(e.target.value)}
                                placeholder="在此刻发射讯号..."
                                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-slate-500 font-serif"
                                onKeyDown={(e) => e.key === 'Enter' && handleSendToSky()}
                            />
                        </div>
                        <button 
                            onClick={handleSendToSky}
                            disabled={!myNote.trim() || isSending}
                            className="p-3 bg-indigo-600 rounded-full text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
              </div>

              {focusedStar && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setFocusedStar(null)}>
                      <div 
                        className={`bg-slate-900 border p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center relative animate-in zoom-in-95 duration-300 
                            ${focusedStar.isMe 
                                ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                                : focusedStar.isLiked 
                                    ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.15)]' 
                                    : 'border-indigo-500/30'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                          <button onClick={() => setFocusedStar(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X size={18} /></button>
                          <div className="mb-4">
                              <Sparkles size={24} className={`mx-auto mb-2 animate-pulse ${focusedStar.isMe ? 'text-amber-400' : focusedStar.isLiked ? 'text-white' : 'text-indigo-400'}`} />
                              <div className="flex items-center justify-center space-x-1 text-xs text-slate-400 uppercase tracking-widest font-sans opacity-60">
                                  <Telescope size={10} /><span>Signal Detected</span>
                              </div>
                          </div>
                          <div className="mb-6">
                             <h3 className={`text-xl font-serif tracking-[0.1em] ${focusedStar.isMe ? 'text-amber-200' : focusedStar.isLiked ? 'text-white' : 'text-indigo-100'}`}>{focusedStar.name}</h3>
                             <div className={`h-px w-8 mx-auto mt-2 ${focusedStar.isMe ? 'bg-amber-500/50' : focusedStar.isLiked ? 'bg-white/50' : 'bg-indigo-500/50'}`}></div>
                          </div>
                          <p className="text-white font-serif text-lg leading-relaxed mb-8">"{focusedStar.text}"</p>
                          <div className="mb-6 flex justify-center w-full">
                              {focusedStar.isMe ? (
                                  <div className="flex flex-col space-y-4 w-full">
                                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-full px-5 py-2 flex items-center justify-center space-x-3 text-amber-200">
                                        <div className="relative"><Signal size={16} className="animate-pulse" /><div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-20 animate-ping"></div></div>
                                        <span className="text-xs font-serif tracking-widest">能量共振: <span className="text-lg font-bold ml-1">{focusedStar.likes}</span></span>
                                    </div>
                                    <button onClick={() => handleDeleteStar(focusedStar.id)} className="text-xs text-slate-500 hover:text-red-400 flex items-center justify-center space-x-1 transition-colors"><Trash2 size={12} /> <span>删除此随笔</span></button>
                                  </div>
                              ) : (
                                  <button onClick={() => toggleResonance(focusedStar.id)} className={`group relative px-6 py-3 rounded-full flex items-center space-x-2 transition-all duration-500 overflow-hidden ${focusedStar.isLiked ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-105' : 'bg-indigo-600/20 hover:bg-indigo-500/40 text-indigo-100 border border-indigo-500/40'}`}>
                                      {focusedStar.isLiked && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_1s_infinite]"></div>}
                                      <Zap size={16} className={focusedStar.isLiked ? 'fill-slate-900' : 'fill-none'} />
                                      <span className="text-xs font-serif tracking-widest font-bold">{focusedStar.isLiked ? "已建立感应" : "感应能量"}</span>
                                  </button>
                              )}
                          </div>
                          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 tracking-widest uppercase border-t border-white/5 pt-4"><span>来自</span><span className={`${focusedStar.isMe ? 'text-amber-300' : focusedStar.isLiked ? 'text-white' : 'text-indigo-300'} font-bold`}>{focusedStar.author}</span></div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default SoulView;
