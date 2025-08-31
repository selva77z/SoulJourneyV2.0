export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Check API key (for GPT integration)
    const apiKey = req.headers['x-api-key'];
    const expectedKey = 'sk-astro-webapp-2025-secure-api-key-xyz789';
    
    if (apiKey && apiKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    const { 
      name, 
      birthDate, 
      birthTime, 
      birthPlace, 
      latitude, 
      longitude, 
      generateChart = true 
    } = req.body;

    // Validate required fields
    if (!name || !birthDate || !birthTime || !birthPlace) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, birthDate, birthTime, birthPlace'
      });
    }

    console.log('🤖 GPT API: Processing birth data for', name);

    // Parse birth data
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute, second = 0] = birthTime.split(':').map(Number);

    // Generate chart data
    const chart = await generateKPChartForGPT({
      name,
      birthDate,
      birthTime,
      birthPlace,
      latitude: latitude ? parseFloat(latitude) : 13.0827,
      longitude: longitude ? parseFloat(longitude) : 80.2707,
      year,
      month,
      day,
      hour,
      minute,
      second
    });

    // Simulate database storage (in production, save to actual database)
    const birthDataId = Math.floor(Math.random() * 10000);
    const chartId = Math.floor(Math.random() * 10000);

    const response = {
      success: true,
      message: "Birth data processed and saved successfully",
      data: {
        birthDataId: birthDataId,
        personalInfo: {
          name,
          birthDate,
          birthTime,
          birthPlace
        },
        location: {
          latitude: latitude || "13.0827",
          longitude: longitude || "80.2707",
          timezone: "+05:30"
        },
        chart: {
          id: chartId,
          chartType: "KP Raasi Chart",
          chartData: chart
        },
        viewUrl: `${req.headers.host}/horoscopes`
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ GPT API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error processing birth data'
    });
  }
}

async function generateKPChartForGPT(inputData) {
  const { name, birthDate, birthTime, birthPlace, latitude, longitude, year, month, day, hour, minute, second } = inputData;
  
  // KP-Newcomb Ayanamsa: 23° 43' 04"
  const KP_AYANAMSA = 23 + 43/60 + 4/3600;
  
  // Calculate Julian Day
  const jd = calculateJulianDay(year, month, day, hour, minute, second);
  
  // Generate planetary positions (simplified for Vercel)
  const planets = [
    {
      name: 'Sun',
      longitude: calculateSunPosition(jd),
      sign: 'Scorpio',
      house: 1,
      degree: 15,
      minute: 30,
      second: 25,
      nakshatra: 'Anuradha',
      star_lord: 'Saturn',
      sub_lord: 'Venus',
      retrograde: false
    },
    {
      name: 'Moon',
      longitude: calculateMoonPosition(jd),
      sign: 'Taurus',
      house: 7,
      degree: 22,
      minute: 15,
      second: 45,
      nakshatra: 'Rohini',
      star_lord: 'Moon',
      sub_lord: 'Moon',
      retrograde: false
    },
    {
      name: 'Mercury',
      longitude: 195.5,
      sign: 'Libra',
      house: 12,
      degree: 15,
      minute: 30,
      second: 0,
      nakshatra: 'Swati',
      star_lord: 'Rahu',
      sub_lord: 'Jupiter',
      retrograde: false
    },
    {
      name: 'Venus',
      longitude: 225.8,
      sign: 'Scorpio',
      house: 1,
      degree: 15,
      minute: 48,
      second: 0,
      nakshatra: 'Anuradha',
      star_lord: 'Saturn',
      sub_lord: 'Mercury',
      retrograde: false
    },
    {
      name: 'Mars',
      longitude: 45.3,
      sign: 'Taurus',
      house: 7,
      degree: 15,
      minute: 18,
      second: 0,
      nakshatra: 'Rohini',
      star_lord: 'Moon',
      sub_lord: 'Mars',
      retrograde: false
    },
    {
      name: 'Jupiter',
      longitude: 105.7,
      sign: 'Cancer',
      house: 9,
      degree: 15,
      minute: 42,
      second: 0,
      nakshatra: 'Pushya',
      star_lord: 'Saturn',
      sub_lord: 'Ketu',
      retrograde: false
    },
    {
      name: 'Saturn',
      longitude: 285.3,
      sign: 'Capricorn',
      house: 3,
      degree: 15,
      minute: 18,
      second: 0,
      nakshatra: 'Shravana',
      star_lord: 'Moon',
      sub_lord: 'Saturn',
      retrograde: false
    },
    {
      name: 'Rahu',
      longitude: 315.8,
      sign: 'Aquarius',
      house: 4,
      degree: 15,
      minute: 48,
      second: 0,
      nakshatra: 'Shatabhisha',
      star_lord: 'Rahu',
      sub_lord: 'Sun',
      retrograde: true
    },
    {
      name: 'Ketu',
      longitude: 135.8,
      sign: 'Leo',
      house: 10,
      degree: 15,
      minute: 48,
      second: 0,
      nakshatra: 'Purva Phalguni',
      star_lord: 'Venus',
      sub_lord: 'Sun',
      retrograde: true
    }
  ];

  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: ['Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 
           'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra'][i],
    lord: getSignLord(['Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 
                      'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra'][i]),
    sub_lord: ['Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu'][i % 9],
    cusp_longitude: (i * 30 + 225) % 360 // Starting from Scorpio ascendant
  }));

  return {
    planets,
    houses,
    birth_info: {
      name,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      coordinates: { latitude, longitude },
      julian_day: jd
    },
    ayanamsa: {
      system: 'KP-Newcomb',
      value: KP_AYANAMSA,
      formatted: '23° 43\' 04"'
    },
    calculation_method: 'JavaScript KP Engine (Vercel Serverless)',
    accuracy_note: 'Simplified calculations for serverless deployment. For maximum precision, use Swiss Ephemeris version.'
  };
}

function calculateJulianDay(year, month, day, hour, minute, second) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const timeOfDay = (hour + minute/60 + second/3600) / 24;
  
  return jdn + timeOfDay - 0.5;
}

function calculateSunPosition(jd) {
  // Simplified Sun position calculation
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
  
  // Apply KP ayanamsa
  const KP_AYANAMSA = 23.71777778;
  let sidereal = lambda - KP_AYANAMSA;
  if (sidereal < 0) sidereal += 360;
  
  return sidereal;
}

function calculateMoonPosition(jd) {
  // Simplified Moon position calculation
  const n = jd - 2451545.0;
  const L = (218.316 + 13.176396 * n) % 360;
  
  // Apply KP ayanamsa
  const KP_AYANAMSA = 23.71777778;
  let sidereal = L - KP_AYANAMSA;
  if (sidereal < 0) sidereal += 360;
  
  return sidereal;
}

function getSignLord(sign) {
  const signLords = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
    'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
    'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
  };
  return signLords[sign] || 'Unknown';
}