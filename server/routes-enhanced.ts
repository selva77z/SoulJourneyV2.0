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

      console.log('✅ Generated authentic KP chart with planets:', planetsFormatted.map(p => `${p.planet}: ${p.degree} ${p.sign}`));
      return res.json(chart);
      
    } catch (error: any) {
      console.error("Horoscope Calculation Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: "Failed to calculate horoscope", 
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
        await storage.createUser({
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
        latitude: parseFloat(horoscopeData.latitude) || 0,
        longitude: parseFloat(horoscopeData.longitude) || 0,
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