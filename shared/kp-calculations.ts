// KP (Krishnamurti Paddhati) Calculation System
// Implements Star Lord, Sign Lord, and Sub Lord calculations

export interface KPPlanetData {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  house: number;
  signLord: string;
  starLord: string;
  subLord: string;
  nakshatra: string;
  nakshatraPada: number;
  subDivision: number;
}

// Zodiac Signs and their ruling planets (Sign Lords)
export const SIGN_LORDS: Record<string, string> = {
  'Aries': 'Mars',
  'Taurus': 'Venus', 
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Saturn',
  'Pisces': 'Jupiter'
};

// 27 Nakshatras with their ruling planets (Star Lords)
export const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'Ketu', startDegree: 0, endDegree: 13.333333 },
  { name: 'Bharani', lord: 'Venus', startDegree: 13.333333, endDegree: 26.666666 },
  { name: 'Krittika', lord: 'Sun', startDegree: 26.666666, endDegree: 40 },
  { name: 'Rohini', lord: 'Moon', startDegree: 40, endDegree: 53.333333 },
  { name: 'Mrigashira', lord: 'Mars', startDegree: 53.333333, endDegree: 66.666666 },
  { name: 'Ardra', lord: 'Rahu', startDegree: 66.666666, endDegree: 80 },
  { name: 'Punarvasu', lord: 'Jupiter', startDegree: 80, endDegree: 93.333333 },
  { name: 'Pushya', lord: 'Saturn', startDegree: 93.333333, endDegree: 106.666666 },
  { name: 'Ashlesha', lord: 'Mercury', startDegree: 106.666666, endDegree: 120 },
  { name: 'Magha', lord: 'Ketu', startDegree: 120, endDegree: 133.333333 },
  { name: 'Purva Phalguni', lord: 'Venus', startDegree: 133.333333, endDegree: 146.666666 },
  { name: 'Uttara Phalguni', lord: 'Sun', startDegree: 146.666666, endDegree: 160 },
  { name: 'Hasta', lord: 'Moon', startDegree: 160, endDegree: 173.333333 },
  { name: 'Chitra', lord: 'Mars', startDegree: 173.333333, endDegree: 186.666666 },
  { name: 'Swati', lord: 'Rahu', startDegree: 186.666666, endDegree: 200 },
  { name: 'Vishakha', lord: 'Jupiter', startDegree: 200, endDegree: 213.333333 },
  { name: 'Anuradha', lord: 'Saturn', startDegree: 213.333333, endDegree: 226.666666 },
  { name: 'Jyeshtha', lord: 'Mercury', startDegree: 226.666666, endDegree: 240 },
  { name: 'Mula', lord: 'Ketu', startDegree: 240, endDegree: 253.333333 },
  { name: 'Purva Ashadha', lord: 'Venus', startDegree: 253.333333, endDegree: 266.666666 },
  { name: 'Uttara Ashadha', lord: 'Sun', startDegree: 266.666666, endDegree: 280 },
  { name: 'Shravana', lord: 'Moon', startDegree: 280, endDegree: 293.333333 },
  { name: 'Dhanishtha', lord: 'Mars', startDegree: 293.333333, endDegree: 306.666666 },
  { name: 'Shatabhisha', lord: 'Rahu', startDegree: 306.666666, endDegree: 320 },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', startDegree: 320, endDegree: 333.333333 },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', startDegree: 333.333333, endDegree: 346.666666 },
  { name: 'Revati', lord: 'Mercury', startDegree: 346.666666, endDegree: 360 }
];

// KP Sub-division system - Each nakshatra divided into 9 sub-parts
// The sub-lords follow the sequence starting from the nakshatra lord
const SUB_LORD_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

/**
 * Get the sign lord for a given zodiac sign
 */
export function getSignLord(sign: string): string {
  return SIGN_LORDS[sign] || 'Unknown';
}

/**
 * Get nakshatra details for a given longitude
 */
export function getNakshatraDetails(longitude: number): {
  nakshatra: string;
  lord: string;
  pada: number;
  degreeInNakshatra: number;
} {
  // Normalize longitude to 0-360 range
  const normalizedLong = ((longitude % 360) + 360) % 360;
  
  for (const nakshatra of NAKSHATRAS) {
    if (normalizedLong >= nakshatra.startDegree && normalizedLong < nakshatra.endDegree) {
      const degreeInNakshatra = normalizedLong - nakshatra.startDegree;
      const pada = Math.floor(degreeInNakshatra / (13.333333 / 4)) + 1; // Each nakshatra has 4 padas
      
      return {
        nakshatra: nakshatra.name,
        lord: nakshatra.lord,
        pada: Math.min(pada, 4), // Ensure pada is between 1-4
        degreeInNakshatra
      };
    }
  }
  
  // Fallback for edge cases
  return {
    nakshatra: 'Ashwini',
    lord: 'Ketu',
    pada: 1,
    degreeInNakshatra: 0
  };
}

/**
 * Calculate the sub-lord using KP subdivision system
 */
export function getSubLord(longitude: number): {
  subLord: string;
  subDivision: number;
} {
  const nakshatraDetails = getNakshatraDetails(longitude);
  
  // Find the starting index of the nakshatra lord in the sequence
  const startIndex = SUB_LORD_SEQUENCE.indexOf(nakshatraDetails.lord);
  
  // Each nakshatra (13°20') is divided into 9 sub-divisions
  const subDivisionSize = 13.333333 / 9; // ~1.48 degrees per sub-division
  const degreeInNakshatra = nakshatraDetails.degreeInNakshatra;
  
  // Calculate which sub-division (0-8)
  const subDivisionIndex = Math.floor(degreeInNakshatra / subDivisionSize);
  
  // Calculate the sub-lord using the sequence starting from nakshatra lord
  const subLordIndex = (startIndex + subDivisionIndex) % 9;
  const subLord = SUB_LORD_SEQUENCE[subLordIndex];
  
  return {
    subLord,
    subDivision: subDivisionIndex + 1 // 1-9 instead of 0-8
  };
}

/**
 * Calculate complete KP data for a planet
 */
export function calculateKPData(planetData: {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  house: number;
}): KPPlanetData {
  const signLord = getSignLord(planetData.sign);
  const nakshatraDetails = getNakshatraDetails(planetData.longitude);
  const subLordDetails = getSubLord(planetData.longitude);
  
  return {
    name: planetData.name,
    sign: planetData.sign,
    degree: planetData.degree,
    longitude: planetData.longitude,
    house: planetData.house,
    signLord,
    starLord: nakshatraDetails.lord,
    subLord: subLordDetails.subLord,
    nakshatra: nakshatraDetails.nakshatra,
    nakshatraPada: nakshatraDetails.pada,
    subDivision: subLordDetails.subDivision
  };
}

/**
 * Format degree as DMS (Degrees, Minutes, Seconds)
 */
export function formatDegreeAsDMS(degree: number): string {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  const s = Math.floor(((degree - d) * 60 - m) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
}

/**
 * Get degree within sign (0-30)
 */
export function getDegreeInSign(longitude: number): number {
  return longitude % 30;
}