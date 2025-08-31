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

      // Parse birth date and time
      const [year, month, day] = birthDate.split('-').map(Number);
      const [hours, minutes] = birthTime.split(':').map(Number);
      
      const birthDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Calculate KP planetary positions
      const planetaryData = await calculateKPPlanets(birthDateTime, location);
      
      // Create comprehensive horoscope data
      const horoscopeData = {
        personalDetails: {
          name,
          birthDate,
          birthTime,
          birthPlace,
          coordinates: { latitude: location.latitude, longitude: location.longitude }
        },
        planetaryPositions: planetaryData.planets,
        houses: planetaryData.houses,
        kpData: {
          ayanamsa: planetaryData.ayanamsa,
          siderealTime: planetaryData.siderealTime,
          ascendant: planetaryData.ascendant,
          mc: planetaryData.mc
        },
        timestamp: new Date().toISOString()
      };

      console.log('✅ KP horoscope calculation completed successfully');
      return res.json(horoscopeData);

    } catch (error: any) {
      console.error('❌ KP horoscope calculation failed:', error);
      return res.status(500).json({ 
        error: "Horoscope calculation failed", 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Store birth data endpoint
  app.post('/api/birth-data/store', async (req: any, res) => {
    try {
      const { name, birthDate, birthTime, birthPlace, latitude, longitude, gender } = req.body;
      
      if (!name || !birthDate || !birthTime || !birthPlace) {
        return res.status(400).json({ message: "Missing required birth data fields" });
      }

      const birthData = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        gender: gender || 'not_specified',
        userId: req.user?.id || 'anonymous',
        createdAt: new Date().toISOString()
      };

      const saved = await storage.storeBirthData(birthData);
      
      if (saved) {
        res.json({ 
          message: "Birth data stored successfully", 
          id: saved.id,
          data: saved 
        });
      } else {
        res.status(500).json({ message: "Failed to store birth data" });
      }
    } catch (error: any) {
      console.error("Error storing birth data:", error);
      res.status(500).json({ message: "Failed to store birth data" });
    }
  });

  // Get stored birth data
  app.get('/api/birth-data/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const birthData = await storage.getBirthDataById(id);
      
      if (birthData) {
        res.json(birthData);
      } else {
        res.status(404).json({ message: "Birth data not found" });
      }
    } catch (error: any) {
      console.error("Error fetching birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });

  // Get all birth data for browsing
  app.get('/api/birth-data/all', async (req: any, res) => {
    try {
      const allBirthData = await storage.getAllBirthDataForBrowsing();
      res.json(allBirthData || []);
    } catch (error: any) {
      console.error("Error fetching all birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });

  // Register additional route modules
  registerMobileRoutes(app);
  registerAdminRoutes(app);
  registerAIRoutes(app);

  // Create HTTP server
  const server = createServer(app);

  return server;
}