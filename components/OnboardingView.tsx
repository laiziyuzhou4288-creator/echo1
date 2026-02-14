
import React, { useState, useMemo } from 'react';
import { ArrowRight, Sparkles, MapPin, Clock, Calendar, X } from 'lucide-react';
import { calculateMoonPhase } from '../utils/uiHelpers';
import { MOON_PHASE_INFO } from '../constants';
import RealisticMoon from './RealisticMoon';
import { UserProfile, MoonPhase } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingView: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<'form' | 'reveal'>('form');
  
  // Form State
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Derived Natal Phase
  const natalPhase = useMemo(() => {
    if (!birthDate) return MoonPhase.NEW;
    const parts = birthDate.split('-').map(Number);
    // Simple constructor handles local time, sufficient for phase visual
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return calculateMoonPhase(date);
  }, [birthDate]);

  const natalInfo = MOON_PHASE_INFO[natalPhase];

  const handleGenerate = () => {
    if (!birthDate || !birthLocation) return;
    
    setIsCalculating(true);
    // Simulate calculation delay for dramatic effect
    setTimeout(() => {
      setIsCalculating(false);
      setStep('reveal');
    }, 2000);
  };

  const handleEnter = () => {
      onComplete({
          birthDate,
          birthTime: birthTime || '00:00',
          birthLocation
      });
  };

  const handleSkip = () => {
      // Create a default profile marked as skipped
      onComplete({
          birthDate: '2000-01-01', // Default placeholder
          birthTime: '00:00',
          birthLocation: 'Unknown',
          isSkipped: true
      });
  };

  if (step === 'form') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center animate-in fade-in duration-1000">
        {/* Background Ambience - Full Screen */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow"></div>

        {/* Constrained Container for Mobile Layout */}
        <div className="relative w-full max-w-md h-full flex flex-col px-8 py-12">
            
            {/* Skip Button - Positioned absolute relative to the mobile container */}
            <button 
                onClick={handleSkip}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-xs tracking-widest uppercase z-50 px-3 py-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/5"
            >
                暂不设置
            </button>

            <div className="flex-1 flex flex-col justify-center w-full relative z-10">
                <div className="mb-10 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-4 animate-float" />
                    <h1 className="text-3xl font-serif text-white tracking-wide">星图校准</h1>
                    <p className="text-slate-400 text-xs tracking-[0.2em] font-serif leading-relaxed">
                        请输入你的诞生信息<br/>我们将为你计算灵魂的本命月相
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="flex items-center text-[10px] text-indigo-200 uppercase tracking-widest pl-1">
                            <Calendar size={10} className="mr-1.5" />
                            诞生日期
                        </label>
                        <input 
                            type="date" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-serif"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center text-[10px] text-indigo-200 uppercase tracking-widest pl-1">
                            <Clock size={10} className="mr-1.5" />
                            诞生时间 <span className="text-slate-500 normal-case ml-1 tracking-normal">(可选)</span>
                        </label>
                        <input 
                            type="time" 
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-serif"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center text-[10px] text-indigo-200 uppercase tracking-widest pl-1">
                            <MapPin size={10} className="mr-1.5" />
                            诞生地点
                        </label>
                        <input 
                            type="text" 
                            value={birthLocation}
                            onChange={(e) => setBirthLocation(e.target.value)}
                            placeholder="例如：上海, 中国"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-serif"
                        />
                    </div>
                </div>

                <div className="mt-12">
                    <button 
                        onClick={handleGenerate}
                        disabled={!birthDate || !birthLocation || isCalculating}
                        className="w-full py-4 bg-indigo-600 text-white rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-2 group"
                    >
                        {isCalculating ? (
                            <span className="animate-pulse">正在连接星空...</span>
                        ) : (
                            <>
                                <span>生成本命月相</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // REVEAL STEP
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 animate-in fade-in duration-1000">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse-slow pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
            <div className="mb-2 text-indigo-300 text-xs font-serif tracking-[0.3em] uppercase animate-in slide-in-from-top-4 duration-1000 delay-300">
                Natal Moon
            </div>
            
            <div className="relative mb-8 animate-in zoom-in-50 duration-1000 ease-out">
                {/* Glow behind moon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px]"></div>
                <RealisticMoon phase={natalPhase} size={200} brightness={1.1} />
            </div>

            <h2 className="text-4xl font-serif text-white mb-4 animate-in slide-in-from-bottom-4 duration-1000 delay-500 text-shadow-lg">
                {natalInfo.cnName}
            </h2>

            <div className="h-px w-12 bg-white/20 mx-auto mb-6 animate-in scale-x-0 duration-1000 delay-700 fill-mode-forwards" style={{ animationFillMode: 'forwards' }}></div>

            <p className="text-slate-300 font-serif text-lg leading-relaxed italic mb-12 animate-in fade-in duration-1000 delay-1000">
                "{natalInfo.blessing}"
            </p>

            <button 
                onClick={handleEnter}
                className="w-full py-4 bg-white text-slate-900 rounded-full font-serif font-bold tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000"
            >
                进入 Echo
            </button>
        </div>
    </div>
  );
};

export default OnboardingView;
