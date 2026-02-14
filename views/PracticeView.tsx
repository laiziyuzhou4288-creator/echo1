
import React, { useState, useEffect } from 'react';
import { Eye, Ear, Wind, Fingerprint, Apple, Play, Pause, X, ChevronRight, Moon, Star, Orbit, Sparkles, Infinity, Loader2, ChevronLeft, Hexagon, ArrowRight, CheckCircle2, Zap, Save, Check, BookOpen, Quote, ScanLine } from 'lucide-react';
import { PracticeSession, SensoryLog } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
    onSaveSession?: (session: PracticeSession) => void;
    onSaveSensoryLog?: (log: SensoryLog) => void;
}

// --- COSMIC & TAROT THEMES ---

const WEEKLY_THEME = {
    title: "本周：愚人的坠落",
    sub: "The Fool's Leap",
    desc: "在塔罗中，愚人迈向悬崖并非为了毁灭，而是为了信任风的托举。这周，试着信任宇宙的引力。",
    task: "做一件你没有任何把握的小事，享受'失控'的轻盈感。",
    article: {
        intro: "在塔罗牌的序列中，愚人（The Fool）编号为 0。他既是开始，也是无限。但在画面中，最让人揪心的一幕往往是他正兴高采烈地迈向悬崖边缘。",
        sections: [
            {
                title: "悬崖并非尽头",
                content: "我们常以为悬崖代表着危险或错误的决定。但在愚人的原型中，悬崖是已知世界与未知潜能的交界线。愚人之所以昂首向上，不看脚下的深渊，是因为他拥有一种近乎神性的信任——他相信当脚踏空的那一刻，宇宙会接住他，或者他会长出翅膀。"
            },
            {
                title: "现实生活中的“坠落”",
                content: "本周，你是否面临着某种需要“纵身一跃”的时刻？也许是想要辞去一份不再滋养你的工作，也许是想要对某人表达真实的心意，或者是想要学习一项全新的笨拙的技能。这种对他人的眼光、对失败后果的恐惧，就是那个“悬崖”。"
            },
            {
                title: "像孩子一样归零",
                content: "愚人随身携带的包袱很小，里面装的是他的过往经验，但他没有被经验所累。这一周，试着放下“成年人”的架子和“必须正确”的执念。允许自己犯傻，允许自己不知道答案，允许自己成为一个初学者。"
            }
        ],
        closing: "当你不再试图控制坠落的方向，你就是在飞翔。去拥抱那个让你心跳加速的未知吧，你比你想象的更轻盈，也更自由。"
    }
};

const SENSES_GUIDE = [
    { id: 'visual', icon: Eye, title: '视觉', sub: 'Eye', task: '在阴影中寻找一个微小的反光点，想象那是遥远恒星传来的讯号。' },
    { id: 'audio', icon: Ear, title: '听觉', sub: 'Ear', task: '闭上眼，穿越所有的人造噪音，去倾听声音消失后的寂静。' },
    { id: 'smell', icon: Wind, title: '嗅觉', sub: 'Nose', task: '雨后或旧书的味道，其实是星尘落定后的气息。' },
    { id: 'touch', icon: Fingerprint, title: '触觉', sub: 'Skin', task: '触摸一个冰冷的物体，感受体温传递给它的过程。' },
    { id: 'taste', icon: Apple, title: '味觉', sub: 'Mouth', task: '喝水时，想象这是亿万年前撞击地球的冰彗星融化后的产物。' },
];

// Face Map Coordinates (Percentages for responsive layout)
const SENSE_POSITIONS: Record<string, { top: string, left: string, delay: string }> = {
    'visual': { top: '12%', left: '50%', delay: '0ms' },
    'audio':  { top: '38%', left: '18%', delay: '100ms' },
    'smell':  { top: '48%', left: '50%', delay: '200ms' },
    'touch':  { top: '38%', left: '82%', delay: '300ms' },
    'taste':  { top: '82%', left: '50%', delay: '400ms' },
};

const SCENARIOS = [
    { 
        id: 'moon', 
        title: '月亮 · 潜意识', 
        desc: '面对恐惧与内在滋养', 
        icon: Moon,
        color: 'from-slate-800 to-indigo-950', 
        accent: 'text-indigo-200',
        duration: 300, // 5 mins
        guide: "想象你正躺在一片漆黑的荒原，头顶是巨大的满月。银白色的月光像液态的水银一样流淌下来，覆盖你的皮肤。它是冰凉的，却不寒冷。月光渗入你的毛孔，把你体内黑色的、沉重的焦虑一点点置换出来。你在发光，你变成了月亮在地面的倒影，纯净而圆满。"
    },
    { 
        id: 'star', 
        title: '星星 · 宇宙呼吸', 
        desc: '治愈与希望注入', 
        icon: Star,
        color: 'from-sky-900 to-slate-950', 
        accent: 'text-sky-200',
        duration: 180, // 3 mins
        guide: "每一次吸气，想象你吸入了天狼星清澈的蓝光。每一次呼气，想象你呼出了体内陈旧的灰烬。你的胸腔就是一颗搏动的恒星。吸气——光芒汇聚，核心变热。呼气——光芒爆发，向宇宙扩散。你不再是孤独的个体，你是银河系呼吸韵律的一部分。"
    },
    { 
        id: 'world', 
        title: '世界 · 轨道漂流', 
        desc: '完整性与宏观视角', 
        icon: Orbit,
        color: 'from-violet-950 to-slate-950', 
        accent: 'text-violet-300',
        duration: 300,
        guide: "重力消失了，你缓慢地飘浮起来，穿过屋顶，穿过大气层。地球在你脚下变成了一颗静谧的蓝宝石，而周围是永恒旋转的星体。在这里，你生活中的那些烦恼，比一粒尘埃还要小。你处于宇宙的中心，又处于宇宙的边缘。一切都已完成，一切都恰到好处。"
    },
    { 
        id: 'hermit', 
        title: '隐士 · 虚空提灯', 
        desc: '内省与独处智慧', 
        icon: Hexagon, 
        color: 'from-zinc-900 to-black', 
        accent: 'text-amber-100',
        duration: 300,
        guide: "想象你站在宇宙边缘的黑暗中，手里提着一盏微弱的灯。周围是绝对的虚空与寂静。不要害怕这种空无，这是你的圣殿。在这里，不需要扮演任何角色，不需要回应任何期待。你只需要看着那盏灯——那就是你唯一的念头，你永不熄灭的觉知。"
    }
];

// --- COMPONENTS ---

const PracticeView: React.FC<Props> = ({ onSaveSession, onSaveSensoryLog }) => {
  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [sessionState, setSessionState] = useState<'intro' | 'timer' | 'summary'>('intro');
  const [introStep, setIntroStep] = useState(0);
  const [guideOpacity, setGuideOpacity] = useState(1); // Control fade transition
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionResult, setSessionResult] = useState<{completed: boolean, energyScore: number} | null>(null);

  // --- SENSORY CALIBRATION STATE ---
  const [activeSense, setActiveSense] = useState<typeof SENSES_GUIDE[0] | null>(null);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [senseTask, setSenseTask] = useState('');
  const [userObservation, setUserObservation] = useState('');
  
  // New: Success Feedback State
  const [showSenseSuccess, setShowSenseSuccess] = useState(false);

  // New: Weekly Article Modal State
  const [showWeeklyArticle, setShowWeeklyArticle] = useState(false);

  // Parse guide into sentences for the intro
  const guideSentences = activeScenario ? activeScenario.guide.split(/。/).filter(s => s.trim().length > 0) : [];

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
        interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
    } else if (timeLeft === 0 && sessionState === 'timer' && timerActive) {
        // Timer Finished naturally
        finishSession(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, sessionState]);

  const startScenario = (scenario: typeof SCENARIOS[0]) => {
      setActiveScenario(scenario);
      setSessionState('intro');
      setIntroStep(0);
      setTimeLeft(scenario.duration);
      setTimerActive(false);
      setShowExitConfirm(false);
      setGuideOpacity(1);
  };

  const nextIntroStep = () => {
      // Fade Out
      setGuideOpacity(0);
      
      // Wait for transition, then change text and Fade In
      setTimeout(() => {
          if (introStep < guideSentences.length - 1) {
              setIntroStep(prev => prev + 1);
              setGuideOpacity(1);
          } else {
              setSessionState('timer');
              setTimerActive(true);
              setGuideOpacity(1);
          }
      }, 500); // 500ms matches CSS duration
  };

  const finishSession = (isNaturalCompletion: boolean = true) => {
      if (!activeScenario) return;

      setTimerActive(false);
      setShowExitConfirm(false); // Close overlay if it was open
      
      const durationSeconds = activeScenario.duration - timeLeft;
      const totalDuration = activeScenario.duration;
      // Calculate Energy Score based on completion percentage
      // Minimum 10 points if started, 100 points if finished.
      const rawScore = Math.floor((durationSeconds / totalDuration) * 100);
      const energyScore = isNaturalCompletion ? 100 : Math.max(10, rawScore);

      setSessionResult({
          completed: isNaturalCompletion,
          energyScore
      });

      setSessionState('summary');
      
      if (onSaveSession) {
          onSaveSession({
              id: Date.now().toString(),
              scenarioId: activeScenario.id,
              scenarioTitle: activeScenario.title.split('·')[0],
              durationSeconds: durationSeconds,
              totalDuration: totalDuration,
              energyScore: energyScore,
              completed: isNaturalCompletion,
              timestamp: Date.now()
          });
      }
  };

  const requestExit = () => {
      setTimerActive(false);
      setShowExitConfirm(true);
  };

  const confirmExit = () => {
      // If user confirms exit, we treat it as an early completion and show summary
      // unless it was barely started (< 5 seconds), then we might just quit.
      const spent = activeScenario ? activeScenario.duration - timeLeft : 0;
      
      if (spent > 5) {
          finishSession(false);
      } else {
          setActiveScenario(null);
          setTimerActive(false);
          setShowExitConfirm(false);
      }
  };

  const cancelExit = () => {
      if (sessionState === 'timer') {
         setTimerActive(true);
      }
      setShowExitConfirm(false);
  };

  const closeSummary = () => {
      setActiveScenario(null);
      setSessionState('intro');
      setSessionResult(null);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- SENSORY HANDLERS ---
  const openSenseModal = async (sense: typeof SENSES_GUIDE[0]) => {
      setActiveSense(sense);
      setIsGeneratingTask(true);
      setSenseTask('');
      setUserObservation('');
      setShowSenseSuccess(false);
      
      // Generate Task
      const task = await GeminiService.generateSensoryTask(sense.id);
      setSenseTask(task);
      setIsGeneratingTask(false);
  };

  const closeSenseModal = () => {
      setActiveSense(null);
  };

  const saveObservation = () => {
      if (!activeSense || !userObservation.trim() || !onSaveSensoryLog) return;
      
      onSaveSensoryLog({
          id: Date.now().toString(),
          senseId: activeSense.id,
          senseTitle: activeSense.title.split('·')[0].trim(),
          prompt: senseTask,
          content: userObservation,
          timestamp: Date.now()
      });
      
      // Close Input Modal, Show Success Modal
      setActiveSense(null);
      setShowSenseSuccess(true);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 px-4 pt-4 font-serif relative">
       {/* Header */}
       <div className="mb-2 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
           <div>
               <h2 className="text-xl text-white mb-0.5">感知恢复</h2>
               <p className="text-slate-400 text-xs tracking-widest">重连感官，回归当下</p>
           </div>
           <Sparkles className="text-slate-600 opacity-50" size={20} />
       </div>

       {/* 1. Weekly Theme Card (COMPACTED) */}
       <section className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div 
               onClick={() => setShowWeeklyArticle(true)}
               className="bg-gradient-to-br from-indigo-900/40 to-slate-950 border border-indigo-500/20 rounded-2xl p-3 relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all hover:scale-[1.01]"
            >
               <div className="absolute -right-10 -top-10 w-24 h-24 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-400/30 transition-colors"></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
               
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-1.5">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] text-indigo-200 tracking-wider backdrop-blur-sm border border-white/5 flex items-center">
                            <BookOpen size={9} className="mr-1.5" />
                            本周指引
                        </span>
                        <ChevronRight className="text-indigo-300 opacity-50 group-hover:translate-x-1 transition-transform" size={14} />
                   </div>
                   <h3 className="text-sm text-white font-medium mb-1 group-hover:text-indigo-200 transition-colors">{WEEKLY_THEME.title}</h3>
                   <p className="text-indigo-200/70 text-[10px] leading-relaxed mb-2 line-clamp-1">{WEEKLY_THEME.desc}</p>
                   <div className="w-full h-px bg-white/5 my-1.5"></div>
                   <div className="flex items-center text-[10px] text-slate-400">
                       <span className="bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300 mr-2 shrink-0">行动</span>
                       <span className="line-clamp-1 italic opacity-80">{WEEKLY_THEME.task}</span>
                   </div>
               </div>
           </div>
       </section>

       {/* 2. Senses FACE MAP (COMPACTED) */}
       <section className="mb-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 relative">
           <div className="flex items-baseline gap-2 mb-1 px-1">
                <h3 className="text-white text-xs tracking-[0.2em] font-bold flex items-center gap-1.5">
                    <ScanLine size={12} className="text-indigo-400" />
                    五感校准
                </h3>
           </div>
           
           {/* FACE CONTAINER REDUCED TO 180px */}
           <div className="relative w-full h-[180px] mt-1 group">
               
               {/* Background Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 rounded-3xl"></div>
               
               {/* Connecting Lines (SVG) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40" style={{ stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 1 }}>
                   <line x1="50%" y1="18%" x2="18%" y2="38%" />
                   <line x1="50%" y1="18%" x2="82%" y2="38%" />
                   <line x1="50%" y1="18%" x2="50%" y2="50%" />
                   <line x1="18%" y1="38%" x2="50%" y2="50%" />
                   <line x1="82%" y1="38%" x2="50%" y2="50%" />
                   <line x1="50%" y1="50%" x2="50%" y2="82%" />
                   <line x1="18%" y1="38%" x2="50%" y2="82%" />
                   <line x1="82%" y1="38%" x2="50%" y2="82%" />
               </svg>

               {/* The Sense Nodes - Reduced size */}
               {SENSES_GUIDE.map((sense) => {
                   const pos = SENSE_POSITIONS[sense.id];
                   return (
                       <button
                           key={sense.id}
                           onClick={() => openSenseModal(sense)}
                           className="absolute w-14 h-14 -ml-7 -mt-7 rounded-full bg-slate-900 border border-indigo-500/30 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:border-indigo-400 hover:bg-slate-800 shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] group/node z-10"
                           style={{ 
                               top: pos.top, 
                               left: pos.left,
                               animation: `fade-in-up 0.8s ease-out forwards ${pos.delay}`
                           }}
                       >
                           {/* Slightly Smaller Icon & Text */}
                           <sense.icon size={18} className="text-slate-300 group-hover/node:text-indigo-300 transition-colors mb-0.5" />
                           <span className="text-[8px] text-slate-500 font-sans tracking-widest font-bold group-hover/node:text-white transition-colors">{sense.title}</span>
                           
                           {/* Active Ring */}
                           <div className="absolute inset-0 rounded-full border border-indigo-500/0 group-hover/node:border-indigo-500/50 group-hover/node:scale-110 transition-all duration-500"></div>
                       </button>
                   );
               })}
           </div>
       </section>

       {/* 3. Meditation Practice */}
       <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
           <div className="flex items-baseline gap-2 mb-2 pl-1">
                <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em]">冥想练习 · Practice</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
               {SCENARIOS.map((s) => (
                   <button 
                        key={s.id} 
                        onClick={() => startScenario(s)}
                        className="relative h-24 rounded-2xl overflow-hidden border border-white/10 group text-left p-3 flex flex-col justify-between hover:border-indigo-500/30 transition-all hover:scale-[1.02]"
                   >
                       <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                       
                       <div className="relative z-10 flex justify-between w-full">
                           <s.icon className={`${s.accent} opacity-80`} size={16} />
                           <span className="text-[9px] text-slate-300 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/5">{Math.floor(s.duration / 60)} min</span>
                       </div>
                       
                       <div className="relative z-10">
                           <h4 className="text-white text-xs font-medium tracking-wide">{s.title.split('·')[0]}</h4>
                           <p className="text-[9px] text-slate-400 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">点击开始引导</p>
                       </div>
                   </button>
               ))}
           </div>
       </section>

       {/* --- WEEKLY ARTICLE MODAL --- */}
       {showWeeklyArticle && (
           <div className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-full h-full max-w-md bg-slate-900 border-x border-white/5 flex flex-col relative shadow-2xl">
                    
                    {/* Sticky Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                        <button 
                            onClick={() => setShowWeeklyArticle(false)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <span className="text-xs text-indigo-200 tracking-widest uppercase font-sans">本周智慧</span>
                        <div className="w-9"></div> {/* Spacer for alignment */}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 pt-24 pb-12 no-scrollbar">
                        <div className="mb-8 text-center">
                            <span className="inline-block px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] text-indigo-300 tracking-widest uppercase mb-4 border border-indigo-500/20">The Fool</span>
                            <h2 className="text-3xl font-serif text-white mb-2">{WEEKLY_THEME.title.split('：')[1]}</h2>
                            <p className="text-slate-400 text-sm font-serif italic">{WEEKLY_THEME.sub}</p>
                        </div>

                        <div className="space-y-8">
                            {/* Intro */}
                            <div className="relative p-6 bg-white/5 rounded-2xl border border-white/5">
                                <Quote className="absolute top-4 left-4 text-indigo-500/20" size={24} />
                                <p className="text-slate-200 font-serif leading-relaxed indent-2 relative z-10">
                                    {WEEKLY_THEME.article.intro}
                                </p>
                            </div>

                            {/* Sections */}
                            {WEEKLY_THEME.article.sections.map((section, idx) => (
                                <div key={idx} className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <h3 className="flex items-center text-indigo-200 text-sm font-bold mb-3 uppercase tracking-wider">
                                        <Sparkles size={12} className="mr-2 text-indigo-400" />
                                        {section.title}
                                    </h3>
                                    <p className="text-slate-300 font-serif leading-7 text-base border-l-2 border-indigo-500/20 pl-4">
                                        {section.content}
                                    </p>
                                </div>
                            ))}

                            {/* Closing Encouragement */}
                            <div className="mt-12 p-8 bg-gradient-to-b from-indigo-900/20 to-slate-900 rounded-3xl border border-indigo-500/30 text-center animate-in zoom-in-95 duration-700 delay-300">
                                <Star className="mx-auto text-amber-200 mb-4 animate-pulse" size={24} />
                                <p className="text-white font-serif text-lg leading-relaxed italic">
                                    "{WEEKLY_THEME.article.closing}"
                                </p>
                            </div>
                        </div>

                        <div className="h-12"></div>
                    </div>
                </div>
           </div>
       )}

       {/* --- SENSORY SUCCESS MODAL --- */}
       {showSenseSuccess && (
           <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                   {/* Background Decor */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                   <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-[40px]"></div>
                   
                   <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                       <Check size={32} className="text-green-400" />
                   </div>

                   <h3 className="text-xl font-serif text-white mb-2">感知已记录</h3>
                   <p className="text-xs text-slate-400 tracking-widest uppercase mb-6">Observation Saved</p>
                   
                   <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/5">
                       <p className="text-indigo-200 font-serif italic text-sm leading-relaxed">
                           "你的观察让这一刻变得具体而真实。请继续保持这份对自我与宇宙的通感力。"
                       </p>
                   </div>

                   <button 
                       onClick={() => setShowSenseSuccess(false)}
                       className="w-full py-3 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:bg-slate-200 transition-colors"
                   >
                       继续探索
                   </button>
               </div>
           </div>
       )}

       {/* --- SENSORY INPUT MODAL --- */}
       {activeSense && (
           <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-xl flex justify-center animate-in fade-in duration-300">
               <div className="w-full max-w-md h-full relative flex flex-col items-center justify-center p-6">
                   <button 
                       onClick={closeSenseModal}
                       className="absolute top-8 left-6 text-slate-500 hover:text-white p-2 bg-white/5 rounded-full z-10 transition-colors"
                   >
                       <X size={20} />
                   </button>

                   <div className="w-full max-w-sm text-center">
                       <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                           <activeSense.icon size={32} className="text-indigo-300" />
                       </div>
                       
                       <h2 className="text-2xl font-serif text-white mb-2">{activeSense.title}校准</h2>
                       <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-8">Sensory Calibration</p>

                       {isGeneratingTask ? (
                           <div className="flex flex-col items-center py-10 space-y-4">
                               <Loader2 size={32} className="text-indigo-400 animate-spin" />
                               <p className="text-sm text-slate-500 font-serif animate-pulse">正在聆听环境频率...</p>
                           </div>
                       ) : (
                           <div className="animate-in slide-in-from-bottom-4 duration-500">
                               <div className="mb-8 p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-lg relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                                   <Sparkles className="mx-auto text-amber-200 mb-4 opacity-80" size={20} />
                                   <p className="text-lg md:text-xl font-serif text-white leading-relaxed">
                                       "{senseTask}"
                                   </p>
                               </div>

                               <div className="relative">
                                   <textarea
                                       value={userObservation}
                                       onChange={(e) => setUserObservation(e.target.value)}
                                       placeholder="记录下你观察到的事物..."
                                       className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 font-serif text-sm focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                                   />
                                   <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 pointer-events-none">
                                       {userObservation.length > 0 ? '已记录' : '等待记录...'}
                                   </div>
                               </div>
                               
                               <button
                                   onClick={saveObservation}
                                   disabled={!userObservation.trim()}
                                   className="w-full mt-6 py-4 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                               >
                                   <Save size={18} />
                                   <span>保存至今日轨迹</span>
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* --- FULL SCREEN MODAL FOR MEDITATION (Existing) --- */}
       {activeScenario && (
           <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in zoom-in-95 duration-500 w-full max-w-md mx-auto left-0 right-0">
               {/* Dynamic Background */}
               <div className={`absolute inset-0 bg-gradient-to-b ${activeScenario.color} opacity-40 transition-opacity duration-1000`}></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse-slow"></div>

               {/* VISIBLE EXIT BUTTON (Hide in summary view) */}
               {sessionState !== 'summary' && (
                   <button 
                       onClick={requestExit} 
                       className="absolute top-8 left-6 flex items-center space-x-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/10 z-[60] backdrop-blur-md transition-all active:scale-95 group"
                   >
                       <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                       <span className="text-xs font-serif tracking-widest">结束</span>
                   </button>
               )}

               {/* -- FLOW A: INTRO SEQUENCE -- */}
               {sessionState === 'intro' && (
                   <div 
                        className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center cursor-pointer h-full w-full"
                        onClick={nextIntroStep}
                    >
                        {/* Icon Small Top */}
                        <div className="mb-12 opacity-50 animate-pulse-slow">
                            <activeScenario.icon size={32} className={`${activeScenario.accent}`} />
                        </div>

                        {/* Sentence Display with Smooth Transition */}
                        <div className="h-40 flex items-center justify-center w-full max-w-xs">
                            <p 
                                key={introStep} 
                                className="text-2xl md:text-3xl font-serif text-white leading-relaxed transition-opacity duration-500 ease-in-out"
                                style={{ opacity: guideOpacity }}
                            >
                                "{guideSentences[introStep]}。"
                            </p>
                        </div>

                        {/* Progress Indicators */}
                        <div className="flex space-x-2 mt-16 mb-8 transition-opacity duration-500" style={{ opacity: guideOpacity }}>
                            {guideSentences.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === introStep ? 'w-8 bg-indigo-400' : 'w-2 bg-slate-700'}`}></div>
                            ))}
                        </div>
                        
                        <div className="absolute bottom-20 flex flex-col items-center animate-bounce opacity-50">
                            <span className="text-[10px] text-slate-400 tracking-[0.3em] uppercase mb-2">
                                {introStep < guideSentences.length - 1 ? "Tap to continue" : "Begin Meditation"}
                            </span>
                            {introStep === guideSentences.length - 1 && <ChevronRight className="text-white" />}
                        </div>
                   </div>
               )}

               {/* -- FLOW B: TIMER ACTIVE -- */}
               {sessionState === 'timer' && (
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
                        
                        {/* Icon Animation */}
                        <div className="mb-10 relative">
                            <div className={`absolute inset-0 ${activeScenario.accent} blur-[60px] opacity-20 animate-pulse-slow`}></div>
                            <div className="relative">
                                    <activeScenario.icon size={56} className={`${activeScenario.accent} opacity-90 animate-float`} strokeWidth={1} />
                                    {timerActive && (
                                        <div className="absolute inset-0 border border-white/20 rounded-full w-full h-full animate-ping opacity-20"></div>
                                    )}
                            </div>
                        </div>

                        <h2 className="text-3xl font-serif text-white mb-2 tracking-[0.2em] shadow-lg">{activeScenario.title.split('·')[0]}</h2>
                        <p className="text-xs text-indigo-200/60 uppercase tracking-[0.3em] mb-16">{activeScenario.title.split('·')[1]}</p>

                        {/* Timer */}
                        <div className="text-7xl font-light text-white/90 font-sans tracking-widest mb-16 tabular-nums drop-shadow-2xl">
                            {formatTime(timeLeft)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-6">
                            <button 
                                    onClick={() => setTimerActive(!timerActive)}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center text-slate-900 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-105 transition-all duration-500 ${timerActive ? 'bg-indigo-100' : 'bg-white'}`}
                            >
                                {timerActive ? <Pause size={28} fill="currentColor" className="opacity-80" /> : <Play size={28} fill="currentColor" className="ml-1 opacity-80" />}
                            </button>
                        </div>
                        
                        {/* Manual Finish */}
                        <button onClick={() => finishSession(false)} className="mt-12 text-slate-500 text-xs tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-white/20 pb-1">
                            提前完成修习
                        </button>
                    </div>
               )}

               {/* -- FLOW C: SUMMARY CARD (NEW & IMPROVED) -- */}
               {sessionState === 'summary' && sessionResult && (
                   <div className="relative z-10 flex-1 flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
                       <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
                           {/* Decor */}
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                           <div className={`absolute -right-10 -bottom-10 w-40 h-40 blur-[50px] rounded-full ${sessionResult.completed ? 'bg-indigo-500/10' : 'bg-slate-500/10'}`}></div>

                           <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 animate-in slide-in-from-bottom-4 duration-700">
                               <activeScenario.icon size={32} className={sessionResult.completed ? "text-indigo-300" : "text-slate-400"} />
                           </div>

                           <h2 className="text-2xl font-serif text-white mb-2 tracking-wide">
                               {sessionResult.completed ? "能量整合完成" : "修习中止"}
                           </h2>
                           <p className="text-slate-400 text-xs tracking-widest uppercase mb-8">
                               {sessionResult.completed ? "Session Complete" : "Partial Session"}
                           </p>

                           {/* Stats Grid */}
                           <div className="grid grid-cols-2 gap-4 w-full mb-8">
                               <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                                   <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">能量聚集</span>
                                   <div className="flex items-center space-x-1">
                                       <span className={`font-serif text-lg ${sessionResult.energyScore > 80 ? 'text-amber-200' : 'text-white'}`}>{sessionResult.energyScore}</span>
                                       <Zap size={12} className={sessionResult.energyScore > 80 ? 'text-amber-200' : 'text-slate-500'} fill="currentColor" />
                                   </div>
                               </div>
                               <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                                   <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">专注时长</span>
                                   <span className="text-white font-serif text-lg">
                                       {Math.floor((activeScenario.duration - timeLeft) / 60)}<span className="text-xs text-slate-500 ml-0.5">m</span>
                                       {(activeScenario.duration - timeLeft) % 60}<span className="text-xs text-slate-500 ml-0.5">s</span>
                                   </span>
                               </div>
                           </div>

                           <div className="text-center mb-8">
                               <p className="text-indigo-200/80 font-serif italic text-sm leading-relaxed">
                                   {sessionResult.completed 
                                     ? "你刚刚为自己创造了一片神圣的真空，\n让宇宙的能量得以重新校准。" 
                                     : "每一次暂停也是一种觉察。\n能量已记录，期待下次圆满。"
                                   }
                               </p>
                           </div>

                           <button 
                                onClick={closeSummary}
                                className={`w-full py-4 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-2 ${
                                    sessionResult.completed 
                                    ? 'bg-white text-slate-900 hover:bg-indigo-50' 
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                }`}
                           >
                               <CheckCircle2 size={18} />
                               <span>收入日历</span>
                           </button>
                       </div>
                   </div>
               )}

               {/* --- EXIT CONFIRMATION OVERLAY (Only for Early Exit Prompt) --- */}
               {showExitConfirm && (
                   <div className="absolute inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
                       <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 relative overflow-hidden">
                           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                           
                           <div className="flex justify-center mb-5 text-indigo-400">
                               <Loader2 size={32} className="animate-spin" />
                           </div>
                           <h3 className="text-xl text-white font-serif text-center mb-3 tracking-wide">能量场正在构建</h3>
                           <p className="text-slate-300 text-sm text-center leading-relaxed mb-8 font-serif opacity-80">
                               你正在与{activeScenario.title.split('·')[0]}的原型能量共振。<br/>
                               此刻中断将生成<span className="text-amber-200">不完整</span>的能量记录。
                           </p>
                           <div className="grid grid-cols-2 gap-4">
                               <button 
                                    onClick={confirmExit}
                                    className="py-3 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 hover:text-white transition-colors"
                               >
                                   结算离开
                               </button>
                               <button 
                                    onClick={cancelExit}
                                    className="py-3 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-medium tracking-wide"
                               >
                                   继续沉浸
                               </button>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       )}

    </div>
  );
};

export default PracticeView;
