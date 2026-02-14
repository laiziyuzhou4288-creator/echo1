
import { MoonPhase } from '../types';
import { Moon, Circle, Sun } from 'lucide-react';

export const getMoonIcon = (phase: MoonPhase) => {
  switch (phase) {
    case MoonPhase.FULL: return Sun; 
    case MoonPhase.NEW: return Circle;
    default: return Moon;
  }
};

/**
 * Calculates accurate astronomical moon data for a given date.
 * Uses Julian Date calculation to determine precise moon age and illumination.
 */
export const getLunarDetails = (date: Date) => {
    // Normalize date to UTC midnight for consistent calculation
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    // Adjust for Jan/Feb (Julian calendar logic)
    if (month < 3) {
        year--;
        month += 12;
    }

    // Calculate Julian Date (JD)
    // Algorithm based on Meeus/Conway
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;

    // Days since known New Moon (Jan 6, 2000 was a New Moon, JD 2451550.1)
    const daysSinceNew = JD - 2451550.1;
    const lunarCycle = 29.53058867; // Average Synodic Month

    // Moon Age (0 to ~29.53)
    const moonAge = daysSinceNew % lunarCycle;
    
    // Phase Ratio (0 to 1)
    const ratio = moonAge / lunarCycle;

    // Calculate Illumination Percentage (0% to 100%)
    // Formula: (1 - cos(angle)) / 2
    // angle = ratio * 2 * PI
    const angle = ratio * 2 * Math.PI;
    const illumination = (1 - Math.cos(angle)) / 2;
    const illuminationPercent = Math.round(illumination * 100);

    // Determine Phase Name based on age/ratio
    // 0.0 - 0.03: New Moon
    // 0.03 - 0.22: Waxing Crescent
    // 0.22 - 0.28: First Quarter
    // 0.28 - 0.47: Waxing Gibbous
    // 0.47 - 0.53: Full Moon
    // 0.53 - 0.72: Waning Gibbous
    // 0.72 - 0.78: Last Quarter
    // 0.78 - 0.97: Waning Crescent
    // 0.97 - 1.00: New Moon

    let phaseName = MoonPhase.NEW;

    if (ratio < 0.03 || ratio >= 0.97) phaseName = MoonPhase.NEW;
    else if (ratio < 0.22) phaseName = MoonPhase.WAXING_CRESCENT;
    else if (ratio < 0.28) phaseName = MoonPhase.FIRST_QUARTER;
    else if (ratio < 0.47) phaseName = MoonPhase.WAXING_GIBBOUS;
    else if (ratio < 0.53) phaseName = MoonPhase.FULL;
    else if (ratio < 0.72) phaseName = MoonPhase.WANING_GIBBOUS;
    else if (ratio < 0.78) phaseName = MoonPhase.LAST_QUARTER;
    else phaseName = MoonPhase.WANING_CRESCENT;

    return {
        phase: phaseName,
        illumination: illuminationPercent,
        age: moonAge,
        ratio: ratio
    };
};

/**
 * Legacy wrapper for backward compatibility, now uses accurate astronomical calc.
 */
export const calculateMoonPhase = (date: Date): MoonPhase => {
    return getLunarDetails(date).phase;
};

export const calculateComplexity = (messages: any[]): number => {
  if (!messages || messages.length === 0) return 0;
  
  const turns = messages.length;
  const combinedText = messages.map(m => m.text).join(' ');
  const totalLength = combinedText.length || 1;

  const emotivePattern = /(feel|happy|sad|anxious|calm|love|hate|hope|lost|pain|grateful|感觉|觉得|开心|难过|焦虑|平静|爱|恨|怕|希望|温柔|痛苦|迷茫|感恩|治愈|释放|沉重)/gi;
  const matches = combinedText.match(emotivePattern);
  const emotionalCount = matches ? matches.length : 0;

  const density = (emotionalCount / totalLength) * 100;

  const rawScore = (turns * 0.4) + (density * 0.6);
  
  return Math.min(100, Math.floor(rawScore * 8));
};
