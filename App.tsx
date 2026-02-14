
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import ThreeStageFlow from './components/ThreeStageFlow';
import ArchiveView from './views/ArchiveView';
import SoulView from './views/SoulView';
import TrendView from './views/TrendView';
import PracticeView from './views/PracticeView';
import OnboardingView from './components/OnboardingView'; 
import { Tab, DayEntry, PracticeSession, SensoryLog, UserProfile, MoonPhase, TarotCard } from './types';
import { MOCK_HISTORY, getTodayStr, TAROT_DECK as DEFAULT_DECK } from './constants';
import RealisticMoon from './components/RealisticMoon';
import { TarotService } from './services/tarotService';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('divination');
  const [userData, setUserData] = useState<DayEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Dynamic Tarot Deck State
  const [tarotDeck, setTarotDeck] = useState<TarotCard[]>(DEFAULT_DECK);
  const [isDeckLoaded, setIsDeckLoaded] = useState(false);

  // Splash Screen State: 'visible' | 'fading' | 'hidden'
  const [splashState, setSplashState] = useState<'visible' | 'fading' | 'hidden'>('visible');
  
  const todayStr = getTodayStr();

  // Load initial data
  useEffect(() => {
    // 1. Load User Data
    setUserData(MOCK_HISTORY);
    
    // 2. Load Persisted Profile
    const savedProfile = localStorage.getItem('echo_user_profile');
    if (savedProfile) {
        try {
            setUserProfile(JSON.parse(savedProfile));
        } catch (e) {
            console.error("Failed to parse user profile", e);
        }
    }

    // 3. Fetch Tarot Deck from Supabase
    const loadDeck = async () => {
        const deck = await TarotService.fetchAllCards();
        if (deck && deck.length > 0) {
            setTarotDeck(deck);
        }
        setIsDeckLoaded(true);
    };
    loadDeck();
    
    // 4. Splash Timer
    const fadeTimer = setTimeout(() => {
        setSplashState('fading');
    }, 3000); // 3 seconds visible

    const removeTimer = setTimeout(() => {
        setSplashState('hidden');
    }, 4000); // 1 second fade out

    return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
    };
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('echo_user_profile', JSON.stringify(profile));
  };

  const handleUpdateProfile = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('echo_user_profile', JSON.stringify(profile));
  };

  const handleSavePractice = (session: PracticeSession) => {
      const existingEntryIndex = userData.findIndex(d => d.date === todayStr);
      let newUserData = [...userData];

      if (existingEntryIndex >= 0) {
          const entry = newUserData[existingEntryIndex];
          const updatedEntry = {
              ...entry,
              practices: [...(entry.practices || []), session]
          };
          newUserData[existingEntryIndex] = updatedEntry;
      } else {
          newUserData.push({
              date: todayStr,
              moonPhase: 'Waxing Gibbous' as any,
              practices: [session],
              todayAwareness: undefined
          });
      }
      setUserData(newUserData);
  };

  const handleSaveSensoryLog = (log: SensoryLog) => {
      const existingEntryIndex = userData.findIndex(d => d.date === todayStr);
      let newUserData = [...userData];

      if (existingEntryIndex >= 0) {
          const entry = newUserData[existingEntryIndex];
          const updatedEntry = {
              ...entry,
              sensoryLogs: [...(entry.sensoryLogs || []), log]
          };
          newUserData[existingEntryIndex] = updatedEntry;
      } else {
          newUserData.push({
              date: todayStr,
              moonPhase: 'Waxing Gibbous' as any,
              sensoryLogs: [log],
              todayAwareness: undefined
          });
      }
      setUserData(newUserData);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'divination':
        return <ThreeStageFlow userData={userData} onUpdateData={setUserData} deck={tarotDeck} />;
      case 'calendar':
        return <ArchiveView data={userData} onUpdateData={setUserData} deck={tarotDeck} />;
      case 'trends':
        return <TrendView data={userData} deck={tarotDeck} />;
      case 'practice':
        return <PracticeView onSaveSession={handleSavePractice} onSaveSensoryLog={handleSaveSensoryLog} />;
      case 'soul':
        return <SoulView data={userData} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
       
       {/* --- SPLASH SCREEN --- */}
       {splashState !== 'hidden' && (
           <div 
                className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-1000 ${splashState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
           >
                <div className="relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse-slow"></div>
                    <div className="mb-10 animate-float opacity-90 flex justify-center">
                         <RealisticMoon phase={MoonPhase.FULL} size={120} brightness={0.9} />
                    </div>
                </div>

                <div className="text-center space-y-4 animate-fade-in-up">
                    <h1 className="text-6xl font-serif text-white tracking-[0.1em] font-light drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        Echo
                    </h1>
                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto"></div>
                    <p className="text-indigo-200/70 text-sm font-serif tracking-[0.4em] uppercase">
                        听见内在的引力
                    </p>
                </div>

                <div className="absolute bottom-12 text-slate-600 text-[10px] tracking-widest font-sans opacity-50 flex flex-col items-center">
                    <span>LOADING COSMOS</span>
                    {!isDeckLoaded && <span className="text-[8px] mt-1 animate-pulse">Synchronizing Tarot Database...</span>}
                </div>
           </div>
       )}

       {/* --- ONBOARDING CHECK --- */}
       {splashState === 'hidden' && !userProfile ? (
            <OnboardingView onComplete={handleOnboardingComplete} />
       ) : (
           <>
               {/* Top Bar / Status */}
               <div className="h-10 w-full flex-shrink-0 flex items-center justify-between px-6 pt-2 z-10 bg-gradient-to-b from-slate-950 to-transparent">
                 <span className="text-[10px] font-bold tracking-widest text-slate-500">ECHO · RESONANCE</span>
                 <div className="flex space-x-1">
                     <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                 </div>
               </div>

               {/* Main Content Area */}
               <div className="flex-1 relative w-full max-w-md mx-auto overflow-hidden">
                  <div 
                    key={currentTab} 
                    className="h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
                  >
                    {renderContent()}
                  </div>
               </div>

               {/* Navigation */}
               <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
           </>
       )}
    </div>
  );
};

export default App;
