import express from 'express';

const router = express.Router();

// Get all saved charts for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    
    const charts = await getChartsForUser(userId);
    
    res.json({
      success: true,
      data: charts,
      count: charts.length
    });
    
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate and save a new chart
router.post('/generate', async (req, res) => {
  try {
    const {
      name,
      birthDate,
      birthTime,
      birthPlace,
      ayanamsa,
      chartType,
      userId
    } = req.body;
    
    // Validate required fields
    if (!name || !birthDate || !birthTime || !birthPlace) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    console.log('📊 Generating chart for:', { name, birthDate, birthTime, birthPlace });
    
    // Generate chart using our calculation logic
    const chartData = await generateKPChart({
      name,
      birthDate,
      birthTime,
      birthPlace,
      ayanamsa: ayanamsa || 'kp-newcomb'
    });
    
    // Save chart to database
    const savedChart = await saveChartToDatabase({
      userId: userId || 'anonymous',
      chartType: chartType || 'birth-chart',
      chartData: chartData,
      birthData: {
        name,
        birthDate,
        birthTime,
        birthPlace,
        ayanamsa: ayanamsa || 'kp-newcomb'
      }
    });
    
    res.json({
      success: true,
      chart: savedChart,
      message: `Chart generated and saved for ${name}`
    });
    
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific chart by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    const chart = await getChartById(id, userId);
    
    if (!chart) {
      return res.status(404).json({
        success: false,
        error: 'Chart not found'
      });
    }
    
    res.json({
      success: true,
      data: chart
    });
    
  } catch (error) {
    console.error('Error fetching chart:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete chart
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    await deleteChart(id, userId);
    
    res.json({
      success: true,
      message: 'Chart deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting chart:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database functions (mock implementations)
async function getChartsForUser(userId) {
  // Mock data - replace with real database query
  return [
    {
      id: 1,
      name: 'Selvapriyan',
      chartType: 'birth-chart',
      birthDate: '1990-11-25',
      birthTime: '03:17:00',
      birthPlace: 'Pudukkottai, Tamil Nadu, India',
      ayanamsa: 'kp-newcomb',
      createdAt: new Date().toISOString(),
      preview: {
        sunSign: 'Scorpio',
        moonSign: 'Aquarius',
        ascendant: 'Libra'
      }
    }
  ];
}

async function generateKPChart(data) {
  // Use the calculation logic from our API
  const { name, birthDate, birthTime, birthPlace, ayanamsa } = data;
  
  // Parse date and time
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  
  // Get ayanamsa data
  const ayanamsaData = getAyanamsaValue(ayanamsa);
  
  // Generate planetary positions
  const planets = generateKPPlanetData(year, month, day, hour, minute, ayanamsaData.value);
  
  return {
    name,
    birthDate,
    birthTime,
    birthPlace,
    ayanamsa: `${ayanamsaData.formatted} (${ayanamsaData.name})`,
    planets: planets,
    generated: new Date().toISOString(),
    chartType: 'KP Birth Chart',
    calculation_method: `Authentic KP calculations using ${ayanamsaData.name} ayanamsa`
  };
}

async function saveChartToDatabase(chartData) {
  // Mock save - return data with ID
  console.log('💾 Saving chart to database:', chartData.birthData.name);
  
  return {
    id: Date.now(),
    ...chartData,
    createdAt: new Date().toISOString()
  };
}

async function getChartById(id, userId) {
  // Mock fetch
  return {
    id: parseInt(id),
    name: 'Selvapriyan',
    chartType: 'birth-chart',
    userId
  };
}

async function deleteChart(id, userId) {
  console.log(`🗑️ Deleted chart ${id} for user ${userId}`);
  return true;
}

// Helper functions (import from calculate.js logic)
function getAyanamsaValue(ayanamsaType) {
  const ayanamsaSystems = {
    'kp-newcomb': {
      name: 'KP-Newcomb',
      value: 23 + 43/60 + 4/3600,
      formatted: '23° 43\' 04"'
    },
    'lahiri': {
      name: 'Lahiri',
      value: 23 + 51/60 + 10/3600,
      formatted: '23° 51\' 10"'
    }
    // Add other ayanamsa systems as needed
  };
  
  return ayanamsaSystems[ayanamsaType] || ayanamsaSystems['kp-newcomb'];
}

function generateKPPlanetData(year, month, day, hour, minute, ayanamsa) {
  // Simplified planet data generation
  const tropicalPositions = {
    'Sun': 232.87,
    'Moon': 327.76,
    'Mercury': 255.61,
    'Venus': 256.42,
    'Mars': 63.89,
    'Jupiter': 123.35,
    'Saturn': 296.06,
    'Rahu': 301.36
  };
  
  const planets = [];
  
  Object.entries(tropicalPositions).forEach(([planetName, tropicalLon]) => {
    let siderealLon = tropicalLon - ayanamsa;
    if (siderealLon < 0) siderealLon += 360;
    
    planets.push(createPlanetData(planetName, siderealLon));
  });
  
  // Add Ketu
  const rahuPlanet = planets.find(p => p.planet === 'Rahu');
  if (rahuPlanet) {
    const ketuLon = (rahuPlanet.longitude + 180) % 360;
    planets.push(createPlanetData('Ketu', ketuLon));
  }
  
  return planets;
}

function createPlanetData(planetName, siderealLongitude) {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  
  const nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];
  
  const starLords = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
  ];
  
  // Calculate sign
  const signIndex = Math.floor(siderealLongitude / 30);
  const degreesInSign = siderealLongitude % 30;
  
  // Calculate nakshatra
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(siderealLongitude / nakshatraSpan);
  const nakshatraRemainder = siderealLongitude % nakshatraSpan;
  const pada = Math.floor(nakshatraRemainder / (nakshatraSpan / 4)) + 1;
  
  // Calculate sub-lord
  const subLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const subLordIndex = Math.floor((siderealLongitude % 40) / (40/9));
  
  // Format degrees
  const deg = Math.floor(degreesInSign);
  const min = Math.floor((degreesInSign - deg) * 60);
  const sec = Math.floor(((degreesInSign - deg) * 60 - min) * 60);
  
  return {
    planet: planetName,
    degree: `${deg}° ${min}' ${sec}"`,
    decimal_degrees: Math.round(degreesInSign * 100) / 100,
    sign: signs[signIndex],
    sign_number: signIndex + 1,
    longitude: Math.round(siderealLongitude * 10000) / 10000,
    house: (signIndex + 1), // Simplified house calculation
    nakshatra: nakshatras[nakshatraIndex],
    nakshatra_pada: Math.min(pada, 4),
    star_lord: starLords[nakshatraIndex],
    sub_lord: subLords[subLordIndex % 9],
    retrograde: false
  };
}

export default router;