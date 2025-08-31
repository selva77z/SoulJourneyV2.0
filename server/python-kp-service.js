// Python KP Calculation Service
// Integrates accurate PyEphem calculations with our Node.js application

import { spawn } from 'child_process';
import path from 'path';

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const RASI_LORDS = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
  'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
};

const NAKSHATRAS = [
  ["Ashwini", "Ketu"], ["Bharani", "Venus"], ["Krittika", "Sun"], ["Rohini", "Moon"],
  ["Mrigashira", "Mars"], ["Ardra", "Rahu"], ["Punarvasu", "Jupiter"], ["Pushya", "Saturn"],
  ["Ashlesha", "Mercury"], ["Magha", "Ketu"], ["Purva Phalguni", "Venus"], ["Uttara Phalguni", "Sun"],
  ["Hasta", "Moon"], ["Chitra", "Mars"], ["Swati", "Rahu"], ["Vishakha", "Jupiter"],
  ["Anuradha", "Saturn"], ["Jyeshtha", "Mercury"], ["Mula", "Ketu"], ["Purva Ashadha", "Venus"],
  ["Uttara Ashadha", "Sun"], ["Shravana", "Moon"], ["Dhanishta", "Mars"], ["Shatabhisha", "Rahu"],
  ["Purva Bhadrapada", "Jupiter"], ["Uttara Bhadrapada", "Saturn"], ["Revati", "Mercury"]
];

// Vimshottari Dasa data for KP calculations
const VIMSHOTTARI_DASA = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
  "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

const DASA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const TOTAL_DASA_YEARS = Object.values(VIMSHOTTARI_DASA).reduce((sum, years) => sum + years, 0);
const NAK_LENGTH = 13.3333;

// Calculate sub-divisions for KP system
const SUB_DIVISIONS = {};
DASA_SEQUENCE.forEach(planet => {
  SUB_DIVISIONS[planet] = (VIMSHOTTARI_DASA[planet] / TOTAL_DASA_YEARS) * NAK_LENGTH;
});

// Get complete KP chain (STL, SBL, SSL)
function getFullKPChain(nakDeg) {
  let cumulative = 0;
  
  for (let planet1 of DASA_SEQUENCE) {
    cumulative += SUB_DIVISIONS[planet1];
    if (nakDeg <= cumulative) {
      const subStart = cumulative - SUB_DIVISIONS[planet1];
      const subLen = SUB_DIVISIONS[planet1];
      const relDeg = nakDeg - subStart;
      
      let cumulative2 = 0;
      for (let planet2 of DASA_SEQUENCE) {
        cumulative2 += (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
        if (relDeg <= cumulative2) {
          const sub2Start = cumulative2 - (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
          const sub2Len = (VIMSHOTTARI_DASA[planet2] / TOTAL_DASA_YEARS) * subLen;
          const relDeg2 = relDeg - sub2Start;
          
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

// Run Python calculation script
async function runPythonKPCalculation(birthDate, birthTime, latitude, longitude) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', `
import ephem
from datetime import datetime
import math
import json

def calculate_kp_positions(birth_date, birth_time, latitude, longitude):
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    observer.elevation = 0
    
    birth_datetime = datetime.strptime(f"{birth_date} {birth_time}", "%d-%m-%Y %H:%M:%S")
    observer.date = birth_datetime
    
    kp_ayanamsa = 23.0 + 43.0/60 + 7.0/3600
    
    planets = {
        'Sun': ephem.Sun(observer),
        'Moon': ephem.Moon(observer),
        'Mercury': ephem.Mercury(observer),
        'Venus': ephem.Venus(observer),
        'Mars': ephem.Mars(observer),
        'Jupiter': ephem.Jupiter(observer),
        'Saturn': ephem.Saturn(observer)
    }
    
    def get_zodiac_sign(longitude):
        signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        sign_index = int(longitude / 30)
        degree_in_sign = longitude % 30
        return signs[sign_index], degree_in_sign
    
    positions = {}
    for name, planet in planets.items():
        tropical_lon = math.degrees(planet.hlon)
        sidereal_lon = (tropical_lon - kp_ayanamsa) % 360
        sign, deg_in_sign = get_zodiac_sign(sidereal_lon)
        
        positions[name] = {
            'longitude': sidereal_lon,
            'sign': sign,
            'degreesInSign': deg_in_sign
        }
    
    # Calculate lunar nodes
    moon = ephem.Moon(observer)
    mean_node = math.degrees(moon.hlon) - 180
    rahu_tropical = mean_node % 360
    ketu_tropical = (rahu_tropical + 180) % 360
    
    rahu_sidereal = (rahu_tropical - kp_ayanamsa) % 360
    ketu_sidereal = (ketu_tropical - kp_ayanamsa) % 360
    
    sign_rahu, deg_rahu = get_zodiac_sign(rahu_sidereal)
    sign_ketu, deg_ketu = get_zodiac_sign(ketu_sidereal)
    
    positions['Rahu'] = {
        'longitude': rahu_sidereal,
        'sign': sign_rahu,
        'degreesInSign': deg_rahu
    }
    
    positions['Ketu'] = {
        'longitude': ketu_sidereal,
        'sign': sign_ketu,
        'degreesInSign': deg_ketu
    }
    
    return positions

# Parse command line arguments
birth_date = "${birthDate}"
birth_time = "${birthTime}" 
latitude = ${latitude}
longitude = ${longitude}

result = calculate_kp_positions(birth_date, birth_time, latitude, longitude)
print(json.dumps(result))
`]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${error}`));
        return;
      }
      
      try {
        const positions = JSON.parse(output.trim());
        resolve(positions);
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
      }
    });
  });
}

// Enhanced KP calculation with accurate PyEphem positions
export async function calculateAccurateKPPlanets(birthDate, birthTime, location) {
  try {
    const { latitude, longitude } = location;
    
    // Get accurate planetary positions from Python/PyEphem
    const pythonPositions = await runPythonKPCalculation(birthDate, birthTime, latitude, longitude);
    
    const results = [];
    
    for (const [planetName, positionData] of Object.entries(pythonPositions)) {
      const { longitude: siderealLon, sign: zodiac, degreesInSign } = positionData;
      
      const rasi_lord = RASI_LORDS[zodiac];
      
      // Calculate degrees, minutes, seconds within sign
      const degrees = Math.floor(degreesInSign);
      const minutes = Math.floor((degreesInSign % 1) * 60);
      const seconds = Math.floor(((degreesInSign % 1) * 60 % 1) * 60);
      
      // Calculate nakshatra
      const nakIndex = Math.floor(siderealLon / NAK_LENGTH);
      const [nakshatra, starLord] = NAKSHATRAS[nakIndex] || ["Unknown", "Unknown"];
      const nakDeg = siderealLon % NAK_LENGTH;
      const pada = Math.floor(nakDeg / (NAK_LENGTH / 4)) + 1;
      
      // Get KP chain
      const [stl, sbl, ssl] = getFullKPChain(nakDeg);
      
      results.push({
        planet: planetName,
        longitude: siderealLon,
        sign: zodiac,
        degree: `${degrees}° ${minutes}' ${seconds}"`,
        degreesInSign: degreesInSign,
        rasi_lord: rasi_lord,
        nakshatra: nakshatra,
        pada: pada,
        star_lord: starLord,
        stl: stl,
        sbl: sbl,
        ssl: ssl,
        sssl: ssl
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Accurate KP Calculation Error:', error);
    throw new Error(`Failed to calculate accurate KP positions: ${error.message}`);
  }
}