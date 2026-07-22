import { spawn } from 'child_process';
import path from 'path';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateKPPlanets, AYANAMSA_VALUE } from "./kp-calculations.js";
import { registerMobileRoutes } from "./mobile-routes";
import { registerAdminRoutes } from "./admin-routes";
import { registerAIRoutes } from "./ai-routes";

import * as admin from 'firebase-admin';

// Middleware for GPT API key authentication
const gptApiKeyAuth = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  // For development, we can be lenient or check a default key
  if (process.env.NODE_ENV === 'development') return next();

  const validApiKey = process.env.WEBAPP_API_KEY || 'sk-astro-webapp-2025-secure-api-key-xyz789';
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid API key required' });
  }
  next();
};

// Check if Authorization header has a valid Firebase ID token
const isAuthenticated = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      // Ensure admin is initialized (it should be by storage-firebase, but let's be safe)
      const adminSdk = (admin as any).default || admin;
      if (adminSdk.apps.length === 0) {
        // If not initialized, we can't verify. Fallback to dev bypass logic if okay?
        // But we want to test real auth.
        console.warn("Firebase Admin not initialized in route middleware.");
      } else {
        const decodedToken = await adminSdk.auth().verifyIdToken(idToken);
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          firstName: decodedToken.name ? decodedToken.name.split(' ')[0] : 'User',
          lastName: decodedToken.name ? decodedToken.name.split(' ').slice(1).join(' ') : '',
          claims: decodedToken
        };
        return next();
      }
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return res.status(403).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
  }

  // Fallback for development (legacy bypass) - ONLY if no token provided
  // This allows us to keep using the app if frontend isn't updated, 
  // but if frontend SENDS a token, we verified it above.
  /*
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
  */

  res.status(401).json({ message: "Unauthorized - No token provided" });
};

// Setup auth endpoint
const setupAuth = async (app: Express) => {
  // Login endpoint to exchange/verify token (frontend sends token, we verify and set cookie if needed)
  app.post('/api/auth/login', isAuthenticated, async (req: any, res) => {
    try {
      // Ensure user exists in our database
      await storage.upsertUser({
        id: req.user.id, // Using Firebase UID as our ID
        email: req.user.email || '',
        firstName: req.user.firstName || 'User',
        lastName: req.user.lastName || '',
        createdAt: new Date().toISOString() // Will be ignored by upsert if user exists
      });

      res.json({
        success: true,
        user: req.user,
        message: "Successfully authenticated via Firebase"
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ success: false, message: "Failed to persist user session" });
    }
  });


  app.get('/api/auth/user', isAuthenticated, (req: any, res) => {
    res.json(req.user);
  });
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

      return res.json({
        success: true,
        message: `KP horoscope generated for ${name}`,
        chart,
        planets: planetsFormatted,
        planetsCount: planetsFormatted.length
      });

    } catch (error: any) {
      console.error("Simple Horoscope Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: "Failed to generate KP horoscope",
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

  // Calculate and return chart data for a specific saved birth record
  app.get('/api/chart-data/:id', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // 1. Get birth data
      const birthData = await storage.getBirthData(id);
      if (!birthData) {
        return res.status(404).json({ error: "Record not found" });
      }

      // Ensure user owns this data
      if (birthData.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 2. Calculate Chart
      console.log(`Calculating chart for saved record: ${birthData.name} (${birthData.birthDate})`);

      const chartData: any = await calculateSwissEphemerisPositions(
        birthData.birthDate, // expects string "YYYY-MM-DD" or similar
        birthData.birthTime,
        birthData.latitude,
        birthData.longitude,
        birthData.birthPlace
      );

      // 3. Return Data
      res.json(chartData);

    } catch (error: any) {
      console.error("Error calculating chart for saved record:", error);
      res.status(500).json({ error: "Failed to calculate chart" });
    }
  });

  // Dynamic horoscope endpoint with proper Swiss Ephemeris calculations
  app.post('/api/horoscope', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name, birthDate, birthTime, birthPlace } = req.body;
      let { latitude, longitude } = req.body;

      console.log(`Generating horoscope for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);

      // Geocoding Fallback if coordinates are missing
      if (!latitude || !longitude) {
        console.log("Coordinates missing, attempting to geocode birthPlace...");
        try {
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(birthPlace)}`;
          const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'SoulJourneyApp/1.0' } });
          const geoData = await geoRes.json();

          if (geoData && geoData.length > 0) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
            console.log(`Geocoded '${birthPlace}' to: ${latitude}, ${longitude}`);
          } else {
            console.error("Geocoding failed: No results found");
            return res.status(400).json({ error: "Could not find coordinates for the provided existing location." });
          }
        } catch (geoError) {
          console.error("Geocoding error:", geoError);
          // If fetch fails (e.g. no internet), fallback or error?
          // For local dev, maybe fallback to Pudukkottai/default if strictly testing? No, better error.
          return res.status(400).json({ error: "Failed to geocode location. Please enter coordinates manually." });
        }
      }

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

      // Return only real data
      return res.json(transformedRealData);
    } catch (error: any) {
      console.error("Error fetching saved horoscopes:", error);
      res.status(500).json({
        message: "Failed to fetch saved horoscopes",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Birth data routes  
  app.get('/api/birth-data/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allBirthData = await storage.getAllBirthDataForBrowsing(userId);
      res.json(allBirthData || []);
    } catch (error: any) {
      console.error("Error fetching birth data:", error);
      res.status(500).json({
        message: "Failed to fetch birth data",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Delete birth data endpoint
  app.delete('/api/birth-data/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      // TODO: In a real app, verify ownership!
      await storage.deleteBirthData(id);
      res.json({ success: true, message: "Birth data deleted" });
    } catch (error: any) {
      console.error("Error deleting birth data:", error);
      res.status(500).json({ message: "Failed to delete birth data" });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  return server;
}