import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateKPPlanets, AYANAMSA_VALUE } from "./kp-calculations.js";
import { registerMobileRoutes } from "./mobile-routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerAIRoutes } from "./ai-routes";

// Simple middleware to bypass authentication in development
const isAuthenticated = (req: any, res: any, next: any) => {
  // For development, always allow access
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'admin-001',
      email: 'admin@localhost.com',
      firstName: 'Admin',
      lastName: 'User',
      claims: {
        sub: 'admin-001'
      }
    };
    return next();
  }
  // In production, you'd implement real auth here
  next();
};

// Simple setup function for development
const setupAuth = async (app: Express) => {
  console.log('🔧 Development mode: Authentication bypassed');
};

// Function to calculate dynamic planetary positions using Swiss Ephemeris
async function calculateSwissEphemerisPositions(birthDate: string, birthTime: string, latitude: number, longitude: number, placeName: string) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'server', 'swiss_chart_generator_kp.py');
    
    // Format birth data for the corrected Python script
    const formattedDate = birthDate; // Expecting YYYY-MM-DD format
    const formattedTime = birthTime; // Expecting HH:MM:SS format
    const lat = latitude || 10.381389; // Default to Pudukkottai if not provided
    const lng = longitude || 78.821389;
    const place = placeName || 'Pudukkottai';
    
    console.log(`Calculating with: Date=${formattedDate}, Time=${formattedTime}, Lat=${lat}, Lng=${lng}, Place=${place}`);
    
    const pythonProcess = spawn('python3', [pythonScript, formattedDate, formattedTime, lat.toString(), lng.toString(), place], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let pythonOutput = '';
    let pythonError = '';
    
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      console.log('Python script output:', pythonOutput);
      if (pythonError) console.log('Python script errors:', pythonError);
      
      if (code === 0) {
        try {
          // Parse JSON output from the Python script
          const chartData = JSON.parse(pythonOutput.trim());
          console.log('Parsed chart data from JSON:', chartData);
          // Return the complete chart data, not just planets
          resolve(chartData);
        } catch (error) {
          console.error('Error parsing JSON output:', error);
          reject(error);
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${pythonError}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Error running Python script:', error);
      reject(error);
    });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint (no auth required)
  app.get('/api/test', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // KP horoscope endpoint with authentic astronomical calculations
  app.post('/api/horoscopes/simple', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name, birthDate, birthTime, birthPlace, latitude, longitude } = req.body;
      
      console.log(`Calculating authentic KP horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      
      // Parse birth data for calculations
      const location = {
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        elevation: 0
      };
      
      // Calculate authentic planetary positions using KP system
      let realPlanets;
      try {
        realPlanets = calculateKPPlanets(birthDate, birthTime, location);
        console.log('✅ Real KP calculations successful');
      } catch (calcError) {
        console.error('❌ KP calculation failed:', calcError);
        throw new Error(`KP calculation failed: ${calcError.message}`);
      }
      
      // Transform planets data to match frontend format
      const planetsFormatted = realPlanets.map(planet => ({
        planet: planet.planet,
        degree: planet.degree,
        sign: planet.sign,
        nakshatra: planet.nakshatra,
        pada: planet.pada,
        rasi_lord: planet.rasi_lord,
        star_lord: planet.star_lord,
        stl: planet.stl,
        sbl: planet.sbl,
        ssl: planet.ssl,
        longitude: planet.longitude,
        degreesInSign: planet.degreesInSign
      }));
      
      // Build rasi chart layout
      const rasiChart = {
        "Aries": [],
        "Taurus": [],
        "Gemini": [],
        "Cancer": [],
        "Leo": [],
        "Virgo": [],
        "Libra": [],
        "Scorpio": [],
        "Sagittarius": [],
        "Capricorn": [],
        "Aquarius": [],
        "Pisces": []
      };
      
      // Place planets in their signs
      realPlanets.forEach(planet => {
        if (rasiChart[planet.sign]) {
          rasiChart[planet.sign].push(planet.planet);
        }
      });
      
      // Find ascendant (Lagna) - for now using first planet's sign as approximation
      const lagna = realPlanets.length > 0 ? `${realPlanets[0].sign} ${realPlanets[0].degree}` : "Unknown";
      // ...existing code...
      
      if (!chartData || !chartData.planets || !Array.isArray(chartData.planets)) {
        console.error("Failed to calculate planetary positions for GPT request");
        return res.status(500).json({ 
          error: "Failed to calculate planetary positions", 
          message: "Swiss Ephemeris calculation failed" 
        });
      }

      // Create the chart object
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude: location.latitude,
        longitude: location.longitude,
        generated: new Date().toISOString(),
        planets: planetsFormatted,
        ayanamsa: `KP-Newcomb ${AYANAMSA_VALUE.toFixed(6)}°`,
        calculation_method: "Authentic VSOP87 + KP-Newcomb Ayanamsa",
        lagna: lagna,
        rasi_chart: rasiChart,
        kpSystem: {
          ayanamsa: AYANAMSA_VALUE,
          calculation_type: "Krishnamurti Paddhati with authentic astronomical positions",
          features: ["Star Lord", "Sub Lord", "Sub-Sub Lord", "Nakshatra Pada"]
        }
      };
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId('admin-001') : [];
      
      let foundChart = null;
      
      if (id) {
        // Search by ID
        foundChart = allCharts.find((chart: any) => chart.id == id);
      } else if (name) {
        // Search by name (case insensitive)
        const searchName = typeof name === 'string' ? name : String(name);
        foundChart = allCharts.find((chart: any) => {
          const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
          return chartData.name && chartData.name.toLowerCase().includes(searchName.toLowerCase());
        });
      } else {
        // Return all charts if no search criteria
        const allChartsFormatted = allCharts.map((chart: any) => {
          const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
          return {
            id: chart.id,
            name: chartData.name,
            birthDate: chartData.birthDate,
            birthTime: chartData.birthTime,
            birthPlace: chartData.birthPlace,
            generated: chartData.generated,
            planetsCount: chartData.planets ? chartData.planets.length : 0
          };
        });
        
        return res.json({
          success: true,
          message: `Found ${allChartsFormatted.length} saved charts`,
          charts: allChartsFormatted
        });
      }
      
      if (!foundChart) {
        return res.json({
          success: false,
          message: name ? `No chart found for name: ${name}` : `No chart found for ID: ${id}`,
          charts: []
        });
      }
      
      // Parse and return the found chart
      const chartData = typeof foundChart.chartData === 'string' ? JSON.parse(foundChart.chartData) : foundChart.chartData;
      
      return res.json({
        success: true,
        message: `Chart found for ${chartData.name}`,
        chart: {
          id: foundChart.id,
          name: chartData.name,
          birthDate: chartData.birthDate,
          birthTime: chartData.birthTime,
          birthPlace: chartData.birthPlace,
          latitude: chartData.latitude,
          longitude: chartData.longitude,
          generated: chartData.generated,
          chartType: chartData.chartType,
          planets: chartData.planets,
          houses: chartData.houses,
          kpSystem: chartData.kpSystem,
          planetsCount: chartData.planets ? chartData.planets.length : 0,
          calculation: "Swiss Ephemeris with KP-Newcomb Ayanamsa",
          significators: "RAL, STL, SBL, SSL, SSSL included"
        }
      });
      
    } catch (error: any) {
      console.error("GPT Query Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to query chart data",
        details: error.message
      });
    }
  });

  // GPT endpoint to pull charts with filters (requires API key)
  app.get('/api/gpt/pull-charts', gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { year, month, limit = 10 } = req.query;
      
      console.log(`GPT Pull - Retrieving charts with filters: year=${year}, month=${month}, limit=${limit}`);
      
      // Get all saved charts
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId('admin-001') : [];
      
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database",
          charts: [],
          count: 0
        });
      }

      // Filter charts based on criteria
      let filteredCharts = allCharts.map(chart => {
        const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
        return {
          id: chart.id,
          name: chartData.name,
          birthDate: chartData.birthDate,
          birthTime: chartData.birthTime,
          birthPlace: chartData.birthPlace,
          generated: chartData.generated,
          planets: chartData.planets,
          houses: chartData.houses
        };
      });

      // Apply year filter if provided
      if (year) {
        filteredCharts = filteredCharts.filter(chart => 
          chart.birthDate && chart.birthDate.startsWith(year.toString())
        );
      }

      // Apply month filter if provided
      if (month) {
        const monthStr = month.toString().padStart(2, '0');
        filteredCharts = filteredCharts.filter(chart => 
          chart.birthDate && chart.birthDate.includes(`-${monthStr}-`)
        );
      }

      // Apply limit
      const limitedCharts = filteredCharts.slice(0, parseInt(limit.toString()));

      return res.json({
        success: true,
        message: `Retrieved ${limitedCharts.length} charts`,
        charts: limitedCharts,
        count: limitedCharts.length,
        totalAvailable: filteredCharts.length
      });
      
    } catch (error: any) {
      console.error("GPT Pull Charts Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to pull charts",
        details: error.message
      });
    }
  });

  // GPT endpoint to search charts by astrological criteria (requires API key)
  app.get('/api/gpt/search-charts', gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { planet, sign, nakshatra, house, limit = 5 } = req.query;
      
      console.log(`GPT Search - Finding charts with criteria: planet=${planet}, sign=${sign}, nakshatra=${nakshatra}, house=${house}`);
      
      // Get all saved charts
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId('admin-001') : [];
      
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database for search",
          results: [],
          count: 0
        });
      }

      // Search charts based on astrological criteria
      const searchResults = [];
      
      for (const chart of allCharts) {
        const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
        const planets = chartData.planets || [];
        
        // Search through planets for matching criteria
        for (const planetData of planets) {
          let match = false;
          
          // Check planet name match
          if (planet && planetData.name && planetData.name.toLowerCase().includes(planet.toString().toLowerCase())) {
            match = true;
          }
          
          // Check sign match
          if (sign && planetData.sign && planetData.sign.toLowerCase().includes(sign.toString().toLowerCase())) {
            match = true;
          }
          
          // Check nakshatra/star match
          if (nakshatra && planetData.star && planetData.star.toLowerCase().includes(nakshatra.toString().toLowerCase())) {
            match = true;
          }
          
          // Check house match
          if (house && planetData.house && planetData.house.toString() === house.toString()) {
            match = true;
          }
          
          if (match) {
            searchResults.push({
              id: chart.id,
              name: chartData.name,
              birthDate: chartData.birthDate,
              birthPlace: chartData.birthPlace,
              matchedPlanet: planetData,
              generated: chartData.generated
            });
            break; // Only add chart once even if multiple planets match
          }
        }
      }

      // Apply limit
      const limitedResults = searchResults.slice(0, parseInt(limit.toString()));

      return res.json({
        success: true,
        message: `Found ${limitedResults.length} charts matching criteria`,
        results: limitedResults,
        count: limitedResults.length,
        totalMatches: searchResults.length
      });
      
    } catch (error: any) {
      console.error("GPT Search Charts Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to search charts",
        details: error.message
      });
    }
  });

  // GPT endpoint to get available years for filtering (requires API key)
  app.get('/api/gpt/available-years', gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      console.log('GPT Available Years - Getting data range for filtering');
      
      // Get all saved charts
      const allCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId('admin-001') : [];
      
      if (allCharts.length === 0) {
        return res.json({
          success: true,
          message: "No charts found in database",
          years: [],
          count: 0
        });
      }

      // Extract years from birth dates
      const years = new Set<number>();
      
      for (const chart of allCharts) {
        const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
        if (chartData.birthDate) {
          const year = chartData.birthDate.split('-')[0];
          if (year && !isNaN(parseInt(year))) {
            years.add(parseInt(year));
          }
        }
      }

      const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort descending

      return res.json({
        success: true,
        message: `Available birth years in database`,
        years: sortedYears,
        count: sortedYears.length,
        totalCharts: allCharts.length
      });
      
    } catch (error: any) {
      console.error("GPT Available Years Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to get available years",
        details: error.message
      });
    }
  });

  // GPT endpoint to delete chart by ID (requires API key)
  app.delete('/api/gpt/delete-chart/:id', gptApiKeyAuth, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const chartId = parseInt(req.params.id);
      
      if (isNaN(chartId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid chart ID provided"
        });
      }
      
      console.log(`GPT Delete - Deleting chart with ID: ${chartId}`);
      
      // Check if chart exists first
      const chart = await storage.getChartById(chartId);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: "Chart not found",
          chartId: chartId
        });
      }
      
      // Delete the chart
      const deleted = await storage.deleteChart(chartId);
      
      if (deleted) {
        return res.json({
          success: true,
          message: `Chart with ID ${chartId} has been deleted successfully`,
          chartId: chartId,
          deletedChart: {
            id: chart.id,
            chartType: chart.chartType,
            createdAt: chart.createdAt
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Failed to delete chart",
          chartId: chartId
        });
      }
      
    } catch (error: any) {
      console.error("GPT Delete Chart Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to delete chart",
        details: error.message
      });
    }
  });

  // Dynamic horoscope endpoint with proper Swiss Ephemeris calculations
  app.post('/api/horoscope', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name, birthDate, birthTime, birthPlace, latitude, longitude } = req.body;
      
      console.log(`Generating horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      
      // Calculate actual planetary positions using Swiss Ephemeris
      const chartData: any = await calculateSwissEphemerisPositions(birthDate, birthTime, latitude, longitude, birthPlace);
      
      // If calculation fails, provide a clear error message
      if (!chartData || !chartData.planets || !Array.isArray(chartData.planets)) {
        console.error("Failed to calculate planetary positions");
        return res.status(500).json({ 
          error: "Failed to calculate planetary positions", 
          message: "Swiss Ephemeris calculation failed" 
        });
      }

      // Use the complete chart data from Swiss Ephemeris calculation
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude,
        longitude,
        generated: new Date().toISOString(),
        chartType: "KP Raasi Chart",
        planets: chartData.planets,
        houses: chartData.houses,
        kpSystem: chartData.kpSystem,
        message: "Horoscope generated successfully using Swiss Ephemeris with authentic KP calculations and significators"
      };

        latitude: location.latitude,
        longitude: location.longitude,
        generated: new Date().toISOString(),
        planets: planetsFormatted,
        ayanamsa: `KP-Newcomb ${AYANAMSA_VALUE.toFixed(6)}°`,
        calculation_method: "Authentic VSOP87 + KP-Newcomb Ayanamsa",
        lagna: lagna,
        rasi_chart: rasiChart,
        kpSystem: {
          ayanamsa: AYANAMSA_VALUE,
          calculation_type: "Krishnamurti Paddhati with authentic astronomical positions",
          features: ["Star Lord", "Sub Lord", "Sub-Sub Lord", "Nakshatra Pada"]
        }
      };

      console.log('✅ Generated authentic KP chart with planets:', planetsFormatted.map(p => `${p.planet}: ${p.degree} ${p.sign}`));
      return res.json(chart);
      
    } catch (error: any) {
      console.error("Horoscope Generation Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: "Failed to generate horoscope", 
        details: error.message 
      });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // For development, return mock user
      const user = {
        id: userId,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      };
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Login endpoint for development
  app.get('/api/login', async (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      // In development, redirect to home page as if logged in
      res.redirect('/');
    } else {
      res.status(501).json({ message: "Login not implemented for production" });
    }
  });

  // Save horoscope data endpoint
  app.post('/api/horoscopes/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const horoscopeData = req.body;
      
      console.log("Saving horoscope data:", horoscopeData);
      
      // Ensure user exists in database
      try {
        await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || 'admin@localhost.com',
          firstName: req.user.claims.given_name || 'Admin',
          lastName: req.user.claims.family_name || 'User'
        });
      } catch (error) {
        // User might already exist, that's okay
        console.log("User already exists or creation failed:", error);
      }
      
      // Save birth data
      const birthDataToSave = {
        userId,
        name: horoscopeData.name,
        birthDate: horoscopeData.birthDate,
        birthTime: horoscopeData.birthTime,
        birthPlace: horoscopeData.birthPlace,
        latitude: String(parseFloat(horoscopeData.latitude) || 0),
        longitude: String(parseFloat(horoscopeData.longitude) || 0),
        timezone: horoscopeData.timezone || 'UTC',
        year: new Date(horoscopeData.birthDate).getFullYear(),
        month: new Date(horoscopeData.birthDate).getMonth() + 1,
        day: new Date(horoscopeData.birthDate).getDate()
      };
      
      const savedBirthData = await storage.createBirthData(birthDataToSave);
      
      // Save chart data
      const chartDataToSave = {
        userId,
        birthDataId: savedBirthData.id,
        chartType: horoscopeData.chartType || 'KP Raasi Chart',
        chartData: JSON.stringify(horoscopeData),
        kpData: JSON.stringify({
          planets: horoscopeData.planets,
          houses: horoscopeData.houses,
          ayanamsa: horoscopeData.ayanamsa
        })
      };
      
      const savedChart = await storage.createChart(chartDataToSave);
      
      res.json({ 
        success: true, 
        birthDataId: savedBirthData.id,
        chartId: savedChart.id,
        message: "Horoscope saved successfully"
      });
      
    } catch (error: any) {
      console.error("Error saving horoscope:", error);
      res.status(500).json({ message: "Failed to save horoscope", error: error.message });
    }
  });

  // Delete a chart endpoint (authenticated)
  app.delete('/api/saved-horoscopes/:id', isAuthenticated, async (req: any, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const chartId = parseInt(req.params.id);
      
      if (isNaN(chartId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid chart ID provided"
        });
      }
      
      console.log(`Deleting chart with ID: ${chartId} by user: ${req.user?.id}`);
      
      // Check if chart exists first
      const chart = await storage.getChartById(chartId);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: "Chart not found"
        });
      }
      
      // Admin can delete any chart, regular users only their own
      if (chart.userId !== req.user.id && !req.user.email?.endsWith('@admin.com')) {
        return res.status(403).json({
          success: false,
          error: "You can only delete your own charts"
        });
      }
      
      // Delete the chart
      const deleted = await storage.deleteChart(chartId);
      
      if (deleted) {
        return res.json({
          success: true,
          message: `Chart deleted successfully`,
          chartId: chartId
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Failed to delete chart"
        });
      }
      
    } catch (error: any) {
      console.error("Delete Chart Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to delete chart",
        details: error.message
      });
    }
  });

  // Saved horoscopes endpoint - now fetches real data plus sample data
  app.get('/api/saved-horoscopes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get real saved charts from database
      const realSavedCharts = await storage.getChartsByUserId ? await storage.getChartsByUserId(userId) : [];
      
      // Transform real data to match frontend format
      const transformedRealData = realSavedCharts.map((chart: any) => {
        const chartData = typeof chart.chartData === 'string' ? JSON.parse(chart.chartData) : chart.chartData;
        return {
          id: chart.id,
          name: chartData.name,
          date: chartData.birthDate,
          time: chartData.birthTime,
          place: chartData.birthPlace,
          calculation_type: chartData.calculation_method || "KP-Newcomb Ayanamsa",
          chartData: {
            planets: chartData.planets || [],
            houses: chartData.houses || [],
            lagna: chartData.lagna,
            ayanamsa: chartData.ayanamsa
          }
        };
      });
      
      // Add sample data to show interface features
      const sampleHoroscopes = [
        {
          id: 1,
          name: "Selvan Kumar",
          date: "1990-11-25",
          time: "03:17:25",
          place: "Pudukkottai, Tamil Nadu, India",
          calculation_type: "KP-Newcomb Ayanamsa",
          chartData: {
            planets: [
              { name: "Sun", sign: "Scorpio", degree: "8°52'", house: 8, star: "Anuradha", starLord: "Saturn" },
              { name: "Moon", sign: "Pisces", degree: "23°15'", house: 12, star: "Revati", starLord: "Mercury" },
              { name: "Mercury", sign: "Virgo", degree: "14°22'", house: 6, star: "Hasta", starLord: "Moon" },
              { name: "Venus", sign: "Pisces", degree: "23°36'", house: 12, star: "Revati", starLord: "Mercury" },
              { name: "Mars", sign: "Cancer", degree: "20°30'", house: 4, star: "Ashlesha", starLord: "Mercury" },
              { name: "Jupiter", sign: "Aries", degree: "17°41'", house: 1, star: "Bharani", starLord: "Venus" },
              { name: "Saturn", sign: "Aries", degree: "6°38'", house: 1, star: "Ashwini", starLord: "Ketu" }
            ],
            houses: [
              { number: 1, sign: "Scorpio", degree: "11°00'", lord: "Mars" },
              { number: 2, sign: "Sagittarius", degree: "11°00'", lord: "Jupiter" },
              { number: 3, sign: "Capricorn", degree: "11°00'", lord: "Saturn" },
              { number: 4, sign: "Aquarius", degree: "11°00'", lord: "Saturn" },
              { number: 5, sign: "Pisces", degree: "11°00'", lord: "Jupiter" },
              { number: 6, sign: "Aries", degree: "11°00'", lord: "Mars" },
              { number: 7, sign: "Taurus", degree: "11°00'", lord: "Venus" },
              { number: 8, sign: "Gemini", degree: "11°00'", lord: "Mercury" },
              { number: 9, sign: "Cancer", degree: "11°00'", lord: "Moon" },
              { number: 10, sign: "Leo", degree: "11°00'", lord: "Sun" },
              { number: 11, sign: "Virgo", degree: "11°00'", lord: "Mercury" },
              { number: 12, sign: "Libra", degree: "11°00'", lord: "Venus" }
            ],
            lagna: {
              sign: "Scorpio",
              degree: "11°00'"
            },
            ayanamsa: "KP-Newcomb 23°43'07\""
          }
        },
        {
          id: 2,
          name: "Priya Sharma",
          date: "1995-07-15",
          time: "14:30:00",
          place: "Chennai, Tamil Nadu, India",
          calculation_type: "KP-Newcomb Ayanamsa",
          chartData: {
            planets: [
              { name: "Sun", sign: "Cancer", degree: "29°15'", house: 4, star: "Ashlesha", starLord: "Mercury" },
              { name: "Moon", sign: "Virgo", degree: "12°45'", house: 6, star: "Hasta", starLord: "Moon" },
              { name: "Mercury", sign: "Gemini", degree: "18°22'", house: 3, star: "Ardra", starLord: "Rahu" },
              { name: "Venus", sign: "Leo", degree: "8°15'", house: 5, star: "Magha", starLord: "Ketu" },
              { name: "Mars", sign: "Virgo", degree: "25°30'", house: 6, star: "Chitra", starLord: "Mars" },
              { name: "Jupiter", sign: "Sagittarius", degree: "15°45'", house: 9, star: "Purva Ashadha", starLord: "Venus" },
              { name: "Saturn", sign: "Aquarius", degree: "22°18'", house: 11, star: "Purva Bhadrapada", starLord: "Jupiter" }
            ],
            houses: [
              { number: 1, sign: "Aries", degree: "5°00'", lord: "Mars" },
              { number: 2, sign: "Taurus", degree: "5°00'", lord: "Venus" },
              { number: 3, sign: "Gemini", degree: "5°00'", lord: "Mercury" },
              { number: 4, sign: "Cancer", degree: "5°00'", lord: "Moon" },
              { number: 5, sign: "Leo", degree: "5°00'", lord: "Sun" },
              { number: 6, sign: "Virgo", degree: "5°00'", lord: "Mercury" },
              { number: 7, sign: "Libra", degree: "5°00'", lord: "Venus" },
              { number: 8, sign: "Scorpio", degree: "5°00'", lord: "Mars" },
              { number: 9, sign: "Sagittarius", degree: "5°00'", lord: "Jupiter" },
              { number: 10, sign: "Capricorn", degree: "5°00'", lord: "Saturn" },
              { number: 11, sign: "Aquarius", degree: "5°00'", lord: "Saturn" },
              { number: 12, sign: "Pisces", degree: "5°00'", lord: "Jupiter" }
            ],
            lagna: {
              sign: "Aries",
              degree: "5°00'"
            },
            ayanamsa: "KP-Newcomb 23°43'07\""
          }
        }
      ];
      
      // Combine real data and sample data
      const allHoroscopes = [...transformedRealData, ...sampleHoroscopes];
      res.json(allHoroscopes);
    } catch (error: any) {
      console.error("Error fetching saved horoscopes:", error);
      res.status(500).json({ message: "Failed to fetch saved horoscopes" });
    }
  });

  // Birth data routes  
  app.get('/api/birth-data/all', async (req: any, res) => {
    try {
      const allBirthData = await storage.getAllBirthDataForBrowsing();
      res.json(allBirthData || []);
    } catch (error: any) {
      console.error("Error fetching all birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  return server;
}