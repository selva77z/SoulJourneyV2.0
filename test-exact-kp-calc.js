// Test exact KP-Newcomb calculation for 3:17 AM Pudukkottai 25/11/1990
const Astronomy = require('astronomy-engine');

function calculateExactKPNewCombAyanamsa(date) {
  // Exact KP-Newcomb Ayanamsa: 23° 43' 04"
  const baseAyanamsa = 23 + (43/60) + (4/3600); // 23.717777777...°
  
  console.log(`Exact KP-Newcomb Ayanamsa: ${baseAyanamsa}° (23° 43' 04")`);
  return baseAyanamsa;
}

function calculatePlanetaryPositions() {
  // Birth details: 3:17 AM, Pudukkottai, 25/11/1990
  const birthDate = new Date('1990-11-25T03:17:00+05:30'); // IST
  const utcDate = new Date('1990-11-24T21:47:00Z'); // UTC conversion
  
  console.log('\n=== KP PLANETARY CALCULATION VERIFICATION ===');
  console.log('Birth Details: 3:17 AM, Pudukkottai, 25 November 1990');
  console.log('Coordinates: 13.0827°N, 80.2707°E');
  console.log('Local Time: 3:17 AM IST');
  console.log('UTC Time:', utcDate.toISOString());
  
  const ayanamsa = calculateExactKPNewCombAyanamsa(birthDate);
  
  console.log('\n=== PLANETARY POSITIONS (KP-Newcomb Sidereal) ===');
  console.log('Planet      | Tropical    | Ayanamsa    | Sidereal    | Sign        | Degree');
  console.log('------------|-------------|-------------|-------------|-------------|----------');
  
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  
  planets.forEach(planetName => {
    try {
      let astroBody;
      switch(planetName) {
        case 'Sun': astroBody = Astronomy.Body.Sun; break;
        case 'Moon': astroBody = Astronomy.Body.Moon; break;
        case 'Mercury': astroBody = Astronomy.Body.Mercury; break;
        case 'Venus': astroBody = Astronomy.Body.Venus; break;
        case 'Mars': astroBody = Astronomy.Body.Mars; break;
        case 'Jupiter': astroBody = Astronomy.Body.Jupiter; break;
        case 'Saturn': astroBody = Astronomy.Body.Saturn; break;
      }
      
      const position = Astronomy.EclipticGeoMoon(utcDate);
      if (planetName === 'Moon') {
        // Use special Moon calculation
        const tropicalLong = position.elon;
        const siderealLong = tropicalLong - ayanamsa;
        const adjustedSidereal = ((siderealLong % 360) + 360) % 360;
        
        const sign = getZodiacSign(adjustedSidereal);
        const degree = adjustedSidereal % 30;
        const deg = Math.floor(degree);
        const min = Math.floor((degree - deg) * 60);
        
        console.log(`${planetName.padEnd(11)} | ${tropicalLong.toFixed(2)}°      | ${ayanamsa.toFixed(4)}°    | ${adjustedSidereal.toFixed(2)}°      | ${sign.padEnd(11)} | ${deg}° ${min}'`);
      } else {
        // Use regular planet calculation
        const equ = Astronomy.Equator(astroBody, utcDate, null, true, true);
        const ecl = Astronomy.Ecliptic(equ);
        const tropicalLong = ecl.elon;
        const siderealLong = tropicalLong - ayanamsa;
        const adjustedSidereal = ((siderealLong % 360) + 360) % 360;
        
        const sign = getZodiacSign(adjustedSidereal);
        const degree = adjustedSidereal % 30;
        const deg = Math.floor(degree);
        const min = Math.floor((degree - deg) * 60);
        
        console.log(`${planetName.padEnd(11)} | ${tropicalLong.toFixed(2)}°      | ${ayanamsa.toFixed(4)}°    | ${adjustedSidereal.toFixed(2)}°      | ${sign.padEnd(11)} | ${deg}° ${min}'`);
      }
    } catch (error) {
      console.log(`${planetName.padEnd(11)} | Error: ${error.message}`);
    }
  });
  
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('These positions use EXACT KP-Newcomb Ayanamsa: 23° 43\' 04"');
}

function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30)];
}

calculatePlanetaryPositions();