// Authentic Swiss Ephemeris KP Calculations
// Based on user's exact implementation with swisseph-v2

import Swisseph from 'swisseph-v2';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Swiss Ephemeris without data path (use built-in Moshier algorithm)
console.log('Initializing Swiss Ephemeris with built-in Moshier algorithm');
try {
  // Don't set any ephemeris path - this forces use of built-in Moshier algorithm
  Swisseph.swe_set_ephe_path(''); // Empty path forces internal calculation
  console.log('Swiss Ephemeris initialized with Moshier algorithm');
} catch (initError) {
  console.error('Swiss Ephemeris initialization error:', initError);
}

// KP-Newcomb Ayanamsa - exact value from user's formula
const AYAN = 23 + 43/60 + 7/3600; // 23°43'07" = 23.71861111°

// Planet constants
const SE_SUN = Swisseph.SE_SUN;
const SE_MOON = Swisseph.SE_MOON;
const SE_MERCURY = Swisseph.SE_MERCURY;
const SE_VENUS = Swisseph.SE_VENUS;
const SE_MARS = Swisseph.SE_MARS;
const SE_JUPITER = Swisseph.SE_JUPITER;
const SE_SATURN = Swisseph.SE_SATURN;
const SE_TRUE_NODE = Swisseph.SE_TRUE_NODE;

// Nakshatra data
const NAKSHATRAS = [
  ["Ashwini", "Ketu"], ["Bharani", "Venus"], ["Krittika", "Sun"], ["Rohini", "Moon"],
  ["Mrigashira", "Mars"], ["Ardra", "Rahu"], ["Punarvasu", "Jupiter"], ["Pushya", "Saturn"],
  ["Ashlesha", "Mercury"], ["Magha", "Ketu"], ["Purva Phalguni", "Venus"], ["Uttara Phalguni", "Sun"],
  ["Hasta", "Moon"], ["Chitra", "Mars"], ["Swati", "Rahu"], ["Vishakha", "Jupiter"],
  ["Anuradha", "Saturn"], ["Jyeshtha", "Mercury"], ["Mula", "Ketu"], ["Purva Ashadha", "Venus"],
  ["Uttara Ashadha", "Sun"], ["Shravana", "Moon"], ["Dhanishta", "Mars"], ["Shatabhisha", "Rahu"],
  ["Purva Bhadrapada", "Jupiter"], ["Uttara Bhadrapada", "Saturn"], ["Revati", "Mercury"]
];

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const RASI_LORDS = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
  'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
};

// Vimshottari Dasa system
const VIMSHOTTARI_DASA = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
  "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

const DASA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const TOTAL_DASA_YEARS = Object.values(VIMSHOTTARI_DASA).reduce((sum, years) => sum + years, 0);
const NAK_LENGTH = 13.3333;

// Get tropical longitude using Swiss Ephemeris Moshier algorithm (built-in, no data files needed)
function getTropicalLongitudeUTC(birthUtcDate, planetConst) {
  try {
    // Use Moshier algorithm - built into Swiss Ephemeris, no external files required
    const flags = Swisseph.SEFLG_MOSEPH | Swisseph.SEFLG_SPEED;
    
    const jdObj = Swisseph.swe_utc_to_jd(
      birthUtcDate.getUTCFullYear(),
      birthUtcDate.getUTCMonth() + 1,
      birthUtcDate.getUTCDate(),
      birthUtcDate.getUTCHours(),
      birthUtcDate.getUTCMinutes(),
      birthUtcDate.getUTCSeconds(),
      Swisseph.SE_GREG_CAL
    );
    
    const julUT = jdObj.julianDayUT !== undefined ? jdObj.julianDayUT : jdObj.error;
    if (typeof julUT === 'string') {
      throw new Error(`Julian day calculation failed: ${julUT}`);
    }
    
    const result = Swisseph.swe_calc_ut(julUT, planetConst, flags);
    if (result.error) {
      throw new Error(`Swiss Ephemeris Moshier calculation failed: ${result.error}`);
    }
    
    return result.longitude; // precise tropical longitude using Moshier algorithm
  } catch (error) {
    console.error(`Swiss Ephemeris Moshier error for planet ${planetConst}:`, error);
    throw error;
  }
}

// Convert tropical to sidereal using KP-Newcomb ayanamsa
function siderealFromTropical(tropLon) {
  return (tropLon - AYAN + 360) % 360;
}

// Calculate KP chain (STL, SBL, SSL)
function getFullKPChain(nakDeg) {
  const relDeg = nakDeg;
  let cumulative1 = 0;
  
  for (let planet1 of DASA_SEQUENCE) {
    const subLen = (VIMSHOTTARI_DASA[planet1] / TOTAL_DASA_YEARS) * NAK_LENGTH;
    cumulative1 += subLen;
    if (relDeg <= cumulative1) {
      const subStart = cumulative1 - subLen;
      const relDeg1 = relDeg - subStart;
      
      let cumulative2 = 0;
      for (let planet2 of DASA_SEQUENCE) {
        cumulative2 += (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
        if (relDeg1 <= cumulative2) {
          const sub2Start = cumulative2 - (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
          const sub2Len = (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
          const relDeg2 = relDeg1 - sub2Start;
          
          let cumulative3 = 0;
          for (let planet3 of DASA_SEQUENCE) {
            cumulative3 += (VIMSHOTTARI_DASA[planet3] / TOTAL_DASA_YEARS) * sub2Len;
            if (relDeg2 <= cumulative3) {
              return [planet1, planet2, planet3];
            }
          }
        }
      }
    }
  }
  return [DASA_SEQUENCE[8], DASA_SEQUENCE[8], DASA_SEQUENCE[8]]; // Default to Mercury
}

// Format degrees to DMS
function toDMS(fullDeg) {
  const degInSign = fullDeg % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  const s = Math.floor(((degInSign - d) * 60 - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

// Main function to calculate authentic KP positions using Swiss Ephemeris
async function calculateSwissEphemerisKP(birthDate, birthTime, location) {
  try {
    // Parse birth data
    const [day, month, year] = birthDate.split('/').map(Number);
    const [hours, minutes, seconds = 0] = birthTime.split(':').map(Number);
    
    // Convert IST to UTC (subtract 5.5 hours)
    const localTime = new Date(year, month - 1, day, hours, minutes, seconds);
    const birthUtc = new Date(localTime.getTime() - (5.5 * 60 * 60 * 1000));
    
    console.log(`Calculating Swiss Ephemeris KP for: ${birthDate} ${birthTime} UTC: ${birthUtc.toISOString()}`);
    
    const planets = [
      { name: 'Sun', key: SE_SUN },
      { name: 'Moon', key: SE_MOON },
      { name: 'Mercury', key: SE_MERCURY },
      { name: 'Venus', key: SE_VENUS },
      { name: 'Mars', key: SE_MARS },
      { name: 'Jupiter', key: SE_JUPITER },
      { name: 'Saturn', key: SE_SATURN },
      { name: 'Rahu', key: SE_TRUE_NODE },
      { name: 'Ketu', key: SE_TRUE_NODE }
    ];
    
    const results = [];
    
    for (const p of planets) {
      try {
        const trop = getTropicalLongitudeUTC(birthUtc, p.key);
        let sid = siderealFromTropical(trop);
        
        // Ketu is 180° opposite to Rahu
        if (p.name === 'Ketu') {
          sid = (sid + 180) % 360;
        }
        
        // Calculate zodiac sign
        const signIndex = Math.floor(sid / 30);
        const zodiac = SIGN_NAMES[signIndex];
        const rasi_lord = RASI_LORDS[zodiac];
        
        // Calculate nakshatra
        const nakIndex = Math.floor(sid / NAK_LENGTH);
        const [nakshatra, starLord] = NAKSHATRAS[nakIndex];
        const nakDeg = sid % NAK_LENGTH;
        const pada = Math.floor(nakDeg / (NAK_LENGTH / 4)) + 1;
        
        // Get KP chain
        const [stl, sbl, ssl] = getFullKPChain(nakDeg);
        
        results.push({
          planet: p.name,
          longitude: sid,
          sign: zodiac,
          degree: toDMS(sid),
          degreesInSign: sid % 30,
          rasi_lord: rasi_lord,
          nakshatra: nakshatra,
          pada: pada,
          star_lord: starLord,
          stl: stl,
          sbl: sbl,
          ssl: ssl,
          sssl: ssl // Placeholder for now
        });
        
        console.log(`${p.name}: ${toDMS(sid)} ${zodiac} (Swiss Ephemeris)`);
        
      } catch (planetError) {
        console.error(`Failed to calculate ${p.name} with Swiss Ephemeris:`, planetError);
        throw planetError; // Don't fall back to mock data
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Swiss Ephemeris KP calculation error:', error);
    throw new Error(`Swiss Ephemeris calculation failed: ${error.message}`);
  }
}

export {
  calculateSwissEphemerisKP,
  AYAN as AYANAMSA_VALUE,
  SIGN_NAMES,
  RASI_LORDS,
  NAKSHATRAS
};