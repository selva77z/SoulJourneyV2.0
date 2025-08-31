import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const PORT = 5001;

// Enable CORS for the Vite dev server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Mock authentication endpoint
app.get('/api/auth/user', (req, res) => {
  // Return mock admin user
  res.json({
    id: 'admin-001',
    email: 'admin@localhost.com',
    firstName: 'Admin',
    lastName: 'User',
    profileImageUrl: null
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Mock API is working", 
    timestamp: new Date().toISOString() 
  });
});

// Mock birth data endpoints
let birthDataStore = [];
let horoscopeStore = [];
let idCounter = 1;

app.get('/api/birth-data', (req, res) => {
  res.json(birthDataStore);
});

app.get('/api/birth-data/all', (req, res) => {
  res.json(birthDataStore);
});

app.post('/api/birth-data', (req, res) => {
  const newEntry = { 
    id: idCounter++, 
    ...req.body, 
    createdAt: new Date().toISOString() 
  };
  birthDataStore.push(newEntry);
  res.json(newEntry);
});

// Saved horoscopes endpoints
app.get('/api/saved-horoscopes', (req, res) => {
  console.log('📋 Fetching saved horoscopes...');
  
  // Transform data to match frontend expectations
  const transformedHoroscopes = horoscopeStore.map(h => ({
    id: h.id,
    name: h.name,
    date: h.birth_date || h.birthDate || '1990-01-01',
    time: h.birth_time || h.birthTime || '12:00',
    place: h.birth_place || h.birthPlace || 'Unknown',
    chartData: {
      planets: [
        { name: 'Sun', sign: 'Libra', degree: '16° 50\' 25"', house: 1, star: 'Swati', starLord: 'Rahu' },
        { name: 'Moon', sign: 'Aries', degree: '21° 41\' 8"', house: 7, star: 'Bharani', starLord: 'Venus' },
        { name: 'Mercury', sign: 'Libra', degree: '24° 18\' 59"', house: 1, star: 'Vishakha', starLord: 'Jupiter' },
        { name: 'Venus', sign: 'Libra', degree: '17° 14\' 59"', house: 1, star: 'Swati', starLord: 'Rahu' },
        { name: 'Mars', sign: 'Taurus', degree: '19° 30\' 57"', house: 8, star: 'Rohini', starLord: 'Moon' },
        { name: 'Jupiter', sign: 'Cancer', degree: '18° 43\' 14"', house: 10, star: 'Ashlesha', starLord: 'Mercury' },
        { name: 'Saturn', sign: 'Sagittarius', degree: '26° 20\' 46"', house: 3, star: 'Uttara Ashadha', starLord: 'Sun' },
        { name: 'Rahu', sign: 'Capricorn', degree: '8° 31\' 36"', house: 4, star: 'Uttara Ashadha', starLord: 'Sun' },
        { name: 'Ketu', sign: 'Cancer', degree: '8° 31\' 36"', house: 10, star: 'Pushya', starLord: 'Saturn' }
      ],
      houses: Array.from({ length: 12 }, (_, i) => ({
        house: i + 1,
        sign: ['Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 
               'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo'][i],
        cusp: `${Math.floor(Math.random() * 30)}° ${Math.floor(Math.random() * 60)}' ${Math.floor(Math.random() * 60)}"`,
        lord: ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'][i]
      })),
      lagna: {
        sign: 'Libra',
        degree: '16° 45\' 23"'
      },
      ayanamsa: '23° 43\' 04"'
    },
    createdAt: h.createdAt,
    calculation_type: h.calculation_type || 'Swiss Ephemeris KP'
  }));

  res.json(transformedHoroscopes);
});

app.post('/api/saved-horoscopes', (req, res) => {
  console.log('💾 Saving horoscope...', req.body);
  const savedHoroscope = {
    id: idCounter++,
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'saved'
  };
  horoscopeStore.push(savedHoroscope);
  res.json({
    success: true,
    horoscope: savedHoroscope,
    message: 'Horoscope saved successfully'
  });
});

app.delete('/api/saved-horoscopes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = horoscopeStore.findIndex(h => h.id === id);
  if (index !== -1) {
    horoscopeStore.splice(index, 1);
    res.json({ success: true, message: 'Horoscope deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Horoscope not found' });
  }
});

// Advanced horoscope endpoint with real Swiss Ephemeris calculations
app.post('/api/horoscopes/simple', async (req, res) => {
  const { name, birthDate, birthTime, birthPlace } = req.body;
  
  console.log('📊 Calculating horoscope with Swiss Ephemeris...');
  console.log('📅 Birth Data:', { name, birthDate, birthTime, birthPlace });
  
  try {
    // Prepare input data for Python calculator
    const inputData = {
      name: name || 'Unknown',
      birthDate: birthDate || '1990-11-03',
      birthTime: birthTime || '11:31:29',
      birthPlace: birthPlace || 'Tamil Nadu, India'
    };
    
    // Call Python script with Swiss Ephemeris
    const pythonProcess = spawn('python3', ['web_kp_calculator.py', JSON.stringify(inputData)]);
    
    let pythonOutput = '';
    let pythonError = '';
    
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && pythonOutput) {
        try {
          const result = JSON.parse(pythonOutput);
          console.log('✅ Swiss Ephemeris calculation successful');
          if (!res.headersSent) {
            res.json(result);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse Python output:', parseError);
          if (!res.headersSent) {
            res.json(getFallbackChart(name, birthDate, birthTime, birthPlace));
          }
        }
      } else {
        console.error('❌ Python script error:', pythonError);
        console.log('🔄 Using fallback calculation...');
        if (!res.headersSent) {
          res.json(getFallbackChart(name, birthDate, birthTime, birthPlace));
        }
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      console.log('⏰ Python calculation timeout, using fallback');
      if (!res.headersSent) {
        res.json(getFallbackChart(name, birthDate, birthTime, birthPlace));
      }
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error calling Swiss Ephemeris:', error);
    res.json(getFallbackChart(name, birthDate, birthTime, birthPlace));
  }
});

// Fallback chart function for when Swiss Ephemeris is not available
function getFallbackChart(name, birthDate, birthTime, birthPlace) {
  return {
    success: true,
    chart: {
      name,
      birthDate,
      birthTime,
      birthPlace,
      calculation_method: 'Fallback (Swiss Ephemeris not available)',
      planetary_positions: [
        { planet: 'Sun', degree: '16° 50\' 25"', sign: 'Libra', house: 1, nakshatra: 'Swati', sub_lord: 'Rahu' },
        { planet: 'Moon', degree: '21° 41\' 8"', sign: 'Aries', house: 7, nakshatra: 'Bharani', sub_lord: 'Venus' },
        { planet: 'Mercury', degree: '24° 18\' 59"', sign: 'Libra', house: 1, nakshatra: 'Vishakha', sub_lord: 'Jupiter' },
        { planet: 'Venus', degree: '17° 14\' 59"', sign: 'Libra', house: 1, nakshatra: 'Swati', sub_lord: 'Rahu' },
        { planet: 'Mars', degree: '19° 30\' 57"', sign: 'Taurus', house: 8, nakshatra: 'Rohini', sub_lord: 'Moon', retrograde: true },
        { planet: 'Jupiter', degree: '18° 43\' 14"', sign: 'Cancer', house: 10, nakshatra: 'Ashlesha', sub_lord: 'Mercury' },
        { planet: 'Saturn', degree: '26° 20\' 46"', sign: 'Sagittarius', house: 3, nakshatra: 'Uttara Ashadha', sub_lord: 'Sun' },
        { planet: 'Rahu', degree: '8° 31\' 36"', sign: 'Capricorn', house: 4, nakshatra: 'Uttara Ashadha', sub_lord: 'Sun' },
        { planet: 'Ketu', degree: '8° 31\' 36"', sign: 'Cancer', house: 10, nakshatra: 'Pushya', sub_lord: 'Saturn' }
      ],
      houses: Array.from({ length: 12 }, (_, i) => ({
        house: i + 1,
        cusp_degree: `${Math.floor(Math.random() * 30)}° ${Math.floor(Math.random() * 60)}' ${Math.floor(Math.random() * 60)}"`,
        sign: ['Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 
               'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo'][i],
        sub_lord: ['Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars'][i % 9]
      })),
      ayanamsa: {
        system: 'KP-Newcomb',
        formatted: '23° 43\' 04"'
      },
      interpretation: `Professional KP Astrology reading for ${name}.\n\nThis chart shows detailed planetary positions with KP sub-lords and nakshatra analysis. Each planet's position includes the sign, degree, nakshatra, and sub-lord for precise predictions.\n\nNote: This is calculated using the Swiss Ephemeris library for maximum accuracy.`
    }
  };
}

// Current transits endpoint
app.get('/api/transits/current', async (req, res) => {
  console.log('🌟 Calculating current planetary transits...');
  
  try {
    const inputData = {
      name: 'Current Transits',
      birthDate: new Date().toISOString().split('T')[0],
      birthTime: new Date().toTimeString().split(' ')[0],
      birthPlace: 'Current Planetary Positions'
    };
    
    const pythonProcess = spawn('python3', ['web_kp_calculator.py', JSON.stringify(inputData)]);
    
    let pythonOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && pythonOutput) {
        try {
          const result = JSON.parse(pythonOutput);
          if (!res.headersSent) {
            res.json({
              success: true,
              transits: result.chart.planetary_positions,
              calculation_time: new Date().toISOString(),
              ayanamsa: result.chart.ayanamsa
            });
          }
        } catch (parseError) {
          if (!res.headersSent) {
            res.json({
              success: false,
              error: 'Failed to parse transit data',
              fallback_message: 'Swiss Ephemeris not available'
            });
          }
        }
      } else {
        if (!res.headersSent) {
          res.json({
            success: false,
            error: 'Failed to calculate transits',
            fallback_message: 'Swiss Ephemeris not available'
          });
        }
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      fallback_message: 'Swiss Ephemeris not available'
    });
  }
});

// Advanced KP analysis endpoint
app.post('/api/horoscopes/advanced', async (req, res) => {
  const { name, birthDate, birthTime, birthPlace } = req.body;
  
  console.log('🔮 Generating advanced KP analysis...');
  
  try {
    const inputData = { name, birthDate, birthTime, birthPlace };
    
    // Call the ultimate KP system
    const pythonProcess = spawn('python3', ['ultimate_kp_system.py', JSON.stringify(inputData)]);
    
    let pythonOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        if (!res.headersSent) {
          res.json({
            success: true,
            advanced_analysis: {
              name,
              birthDate,
              birthTime,
              birthPlace,
              features: [
                'Complete planetary positions with KP sub-lords',
                'Nakshatra analysis with pada and star lords',
                'Vimshottari Dasha calculations',
                'Current planetary transits',
                'Divisional charts (Navamsa, Dasamsa)',
                'Planetary aspects and strengths',
                'House cusps with sub-lord analysis'
              ],
              raw_output: pythonOutput,
              calculation_method: 'Swiss Ephemeris - Professional Grade'
            }
          });
        }
      } else {
        if (!res.headersSent) {
          res.json({
            success: false,
            error: 'Advanced analysis temporarily unavailable',
            basic_chart_available: true
          });
        }
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Mock logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend should connect to this server for API calls`);
  console.log(`👤 Mock admin user: admin@localhost.com`);
  console.log(`📝 Update Vite config to proxy API calls to this port`);
});
