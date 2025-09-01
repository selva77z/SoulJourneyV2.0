export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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
    const { moonLongitude, birthDate } = req.body;
    
    if (!moonLongitude || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: moonLongitude, birthDate'
      });
    }

    console.log('📊 Calculating Vimshottari Dasha for Moon at:', moonLongitude);
    
    const dashaSystem = calculateVimshottariDasha(moonLongitude, new Date(birthDate));
    
    res.status(200).json({
      success: true,
      dasha_system: dashaSystem,
      calculation_method: 'Vimshottari Dasha (120-year cycle)',
      birth_date: birthDate,
      moon_longitude: moonLongitude
    });

  } catch (error) {
    console.error('Error calculating Dasha:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to calculate Vimshottari Dasha'
    });
  }
}

function calculateVimshottariDasha(moonLongitude, birthDate) {
  // Vimshottari Dasha periods (in years)
  const dashaPeriods = {
    'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
    'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
  };
  
  // Dasha sequence
  const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  
  // Find Moon's nakshatra
  const nakshatraSpan = 360 / 27; // 13.333...
  const moonNakshatra = Math.floor(moonLongitude / nakshatraSpan);
  
  // Distance Moon has traveled in current nakshatra
  const distanceInNak = moonLongitude % nakshatraSpan;
  
  // Find ruling planet of Moon's nakshatra
  const rulingPlanets = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const moonDashaLord = rulingPlanets[moonNakshatra % 9];
  
  // Calculate remaining period in current dasha
  const totalNakPeriod = dashaPeriods[moonDashaLord] * 365.25; // Convert to days
  const periodPerDegree = totalNakPeriod / nakshatraSpan;
  const remainingDays = (nakshatraSpan - distanceInNak) * periodPerDegree;
  
  // Start building dasha periods
  const dashaList = [];
  let currentDate = new Date(birthDate);
  
  // Add remaining period of birth dasha
  let endDate = new Date(currentDate.getTime() + remainingDays * 24 * 60 * 60 * 1000);
  dashaList.push({
    planet: moonDashaLord,
    start_date: formatDate(currentDate),
    end_date: formatDate(endDate),
    duration_years: Math.round((remainingDays / 365.25) * 100) / 100,
    duration_days: Math.round(remainingDays),
    is_birth_dasha: true,
    status: isCurrentPeriod(currentDate, endDate) ? 'current' : 'future'
  });
  
  // Add next 8 complete dashas (full cycle)
  currentDate = new Date(endDate);
  let currentPlanetIndex = (dashaSequence.indexOf(moonDashaLord) + 1) % 9;
  
  for (let i = 0; i < 8; i++) {
    const planet = dashaSequence[currentPlanetIndex];
    const durationDays = dashaPeriods[planet] * 365.25;
    endDate = new Date(currentDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    dashaList.push({
      planet: planet,
      start_date: formatDate(currentDate),
      end_date: formatDate(endDate),
      duration_years: dashaPeriods[planet],
      duration_days: Math.round(durationDays),
      is_birth_dasha: false,
      status: isCurrentPeriod(currentDate, endDate) ? 'current' : 
              currentDate < new Date() ? 'past' : 'future'
    });
    
    currentDate = new Date(endDate);
    currentPlanetIndex = (currentPlanetIndex + 1) % 9;
  }
  
  return {
    birth_dasha_lord: moonDashaLord,
    moon_nakshatra: Math.floor(moonLongitude / nakshatraSpan) + 1,
    total_cycle_years: 120,
    dasha_periods: dashaList,
    calculation_date: new Date().toISOString()
  };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isCurrentPeriod(startDate, endDate) {
  const now = new Date();
  return now >= startDate && now <= endDate;
}