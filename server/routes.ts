import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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



import { spawn } from 'child_process';
import path from 'path';
import { insertBirthDataSchema, insertProfileSchema, insertChartSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  parseNaturalLanguagePrompt,
  calculateKPChart,
  generateChartInterpretation,
  generateKPChart,
  generateCompatibilityScore,
  calculateBasicAstroData,
  generateAstrologyProfile,
  calcCompatScore,
  aiLearningEngine
} from "./calculation-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint (no auth required)
  app.get('/api/test', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // KP Horoscope generation with authentic calculations
  app.post('/api/horoscopes/simple', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name, birthDate, birthTime, birthPlace } = req.body;
      
      console.log(`Calculating KP positions for: ${name}, ${birthDate}, ${birthTime}, ${birthPlace}`);
      
      // Use Swiss Ephemeris Python script for authentic calculations
      const pythonScript = path.join(process.cwd(), 'server', 'swiss_chart_generator.py');
      
      const pythonProcess = spawn('.pythonlibs/bin/python', [pythonScript, birthDate, birthTime, birthPlace], {
        cwd: process.cwd()
      });
      
      let pythonOutput = '';
      let pythonError = '';
      
      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });
      
      const result: any = await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              // Extract JSON from output
              const jsonStart = pythonOutput.indexOf('{');
              const jsonEnd = pythonOutput.lastIndexOf('}') + 1;
              const jsonOutput = pythonOutput.substring(jsonStart, jsonEnd);
              const data = JSON.parse(jsonOutput);
              resolve(data);
            } catch (parseError: any) {
              reject(new Error(`Failed to parse Python output: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Python script failed with code ${code}: ${pythonError}`));
          }
        });
      });
      
      const planetaryPositions = result.positions;
      
      const chart = {
        name,
        birthDate,
        birthTime,
        birthPlace,
        generated: new Date().toISOString(),
        planets: planetaryPositions,
        navamsa_planets: result.navamsa_positions,
        ayanamsa: "KP-Newcomb 23° 43' 07\"",
        calculation_method: "Swiss Ephemeris with KP-Newcomb Ayanamsa",
        rasi_chart_image: result.rasi_chart_path,
        navamsa_chart_image: result.navamsa_chart_path,
        julian_day: result.julian_day
      };

      console.log('Generated chart with planets:', planetaryPositions.map((p: any) => `${p.planet}: ${p.degree} ${p.sign}`));
      return res.json(chart);
      
    } catch (error: any) {
      console.error("KP Calculation Error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: "Failed to calculate KP positions", 
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
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Natural language processing endpoint
  app.post('/api/parse-prompt', isAuthenticated, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const parsedData = await parseNaturalLanguagePrompt(prompt);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error parsing prompt:", error);
      res.status(500).json({ error: "Failed to parse prompt" });
    }
  });

  // Birth data routes
  app.post('/api/birth-data', isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== SAVE REQUEST RECEIVED ===");
      console.log("Request body:", req.body);
      
      const userId = req.user.claims.sub;
      console.log("User ID:", userId);
      
      // Transform the data to ensure proper types
      const transformedData = {
        ...req.body,
        userId,
        latitude: typeof req.body.latitude === 'string' ? parseFloat(req.body.latitude) : req.body.latitude,
        longitude: typeof req.body.longitude === 'string' ? parseFloat(req.body.longitude) : req.body.longitude,
      };
      
      console.log("Transformed data:", transformedData);
      
      const validatedData = insertBirthDataSchema.parse(transformedData);
      
      console.log("Validated data:", validatedData);
      
      const birthData = await storage.createBirthData(validatedData);
      console.log("Birth data created successfully:", birthData);
      res.json(birthData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid birth data",
          details: fromZodError(error).toString()
        });
      }
      console.error("Error creating birth data:", error);
      res.status(500).json({ message: "Failed to create birth data" });
    }
  });

  app.get('/api/birth-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const birthData = await storage.getBirthDataByUserId(userId);
      res.json(birthData);
    } catch (error) {
      console.error("Error fetching birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });

  // Get all birth data for browsing horoscopes
  app.get('/api/birth-data/all', async (req: any, res) => {
    try {
      const allBirthData = await storage.getAllBirthDataForBrowsing();
      res.json(allBirthData);
    } catch (error) {
      console.error("Error fetching all birth data:", error);
      res.status(500).json({ message: "Failed to fetch birth data" });
    }
  });

  // Chart routes
  app.post('/api/chart/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const birthData = await storage.getBirthDataByUserId(userId);
      
      if (!birthData) {
        return res.status(400).json({ message: "Birth data not found. Please add your birth information first." });
      }

      // Calculate KP chart
      const kpChart = await calculateKPChart(birthData);
      
      // Generate AI interpretation
      const aiInterpretation = await generateChartInterpretation(kpChart);
      
      const chartData = {
        userId,
        birthDataId: birthData.id,
        chartType: "raasi", // Default chart type for now
        chartData: kpChart.chartData,
        kpData: kpChart.kpData,
        aiInterpretation,
      };

      const chart = await storage.createChart(chartData);
      res.json(chart);
    } catch (error: any) {
      console.error("Error generating chart:", error);
      res.status(500).json({ message: "Failed to generate chart" });
    }
  });

  app.get('/api/chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chart = await storage.getChartByUserId(userId);
      res.json(chart);
    } catch (error) {
      console.error("Error fetching chart:", error);
      res.status(500).json({ message: "Failed to fetch chart" });
    }
  });

  // Chart save endpoint
  app.post('/api/charts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { birthDataId, chartData, kpData, chartType } = req.body;
      
      console.log("Saving chart for user:", userId);
      console.log("Chart payload:", { birthDataId, chartType });
      
      const chartPayload = {
        userId,
        birthDataId,
        chartData: typeof chartData === 'string' ? chartData : JSON.stringify(chartData || {}),
        kpData: typeof kpData === 'string' ? kpData : JSON.stringify(kpData || {}),
        chartType: chartType || "KP Raasi Chart"
      };
      
      console.log("Transformed chart payload:", chartPayload);
      
      const savedChart = await storage.createChart(chartPayload);
      console.log("Chart saved successfully:", savedChart.id);
      
      res.json(savedChart);
    } catch (error: any) {
      console.error("Error saving chart:", error);
      res.status(500).json({ message: "Failed to save chart" });
    }
  });

  // Profile routes
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      const profile = await storage.createProfile(validatedData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid profile data",
          details: fromZodError(error).toString()
        });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileId = parseInt(req.params.id);
      
      // Verify ownership
      const existingProfile = await storage.getProfileByUserId(userId);
      if (!existingProfile || existingProfile.id !== profileId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(profileId, validatedData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid profile data",
          details: fromZodError(error).toString()
        });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Horoscope routes
  app.get('/api/horoscopes/browse', isAuthenticated, async (req: any, res) => {
    try {
      // Get all birth data for browsing (excluding sensitive user info)
      const birthDataList = await storage.getAllBirthDataForBrowsing();
      res.json(birthDataList);
    } catch (error) {
      console.error("Error fetching horoscopes for browsing:", error);
      res.status(500).json({ message: "Failed to fetch horoscopes" });
    }
  });

  // Saved horoscopes list endpoint
  app.get('/api/saved-horoscopes', async (req, res) => {
    try {
      const birthDataList = await storage.getAllBirthDataForBrowsing();
      console.log('Birth data count:', birthDataList.length);
      
      const savedHoroscopes = await Promise.all(
        birthDataList.map(async (birthData) => {
          try {
            // Get chart by birth data ID, not user ID to get individual charts
            const chart = await storage.getChartByBirthDataId(birthData.id);
            console.log(`Chart for ${birthData.name}:`, chart ? 'Found' : 'Not found');
            
            if (!chart) {
              // No chart saved, create a basic placeholder
              return {
                id: birthData.id,
                name: birthData.name,
                date: new Date(birthData.birthDate).toLocaleDateString('en-GB'),
                time: birthData.birthTime,
                place: birthData.birthPlace,
                chartData: {
                  planets: [],
                  houses: [],
                  lagna: { sign: 'Unknown', degree: 'Unknown' },
                  ayanamsa: "23° 43' 04\" (KP-Newcomb)"
                },
                createdAt: birthData.createdAt
              };
            }
            
            // Parse the saved chart data
            const chartData = typeof chart.chartData === 'string' 
              ? JSON.parse(chart.chartData) 
              : chart.chartData;
              
            // Parse KP data for comprehensive analysis
            const kpData = typeof chart.kpData === 'string' 
              ? JSON.parse(chart.kpData) 
              : chart.kpData;
            
            return {
              id: birthData.id,
              name: birthData.name,
              date: new Date(birthData.birthDate).toLocaleDateString('en-GB'),
              time: birthData.birthTime,
              place: birthData.birthPlace,
              chartData: {
                planets: chartData.planets || [],
                houses: chartData.houses || [],
                lagna: {
                  sign: chartData.ascendant?.sign || 'Unknown',
                  degree: chartData.ascendant?.degree ? `${chartData.ascendant.degree}°` : 'Unknown'
                },
                ayanamsa: "23° 43' 04\" (KP-Newcomb)",
                // Include comprehensive KP analysis data
                kpAnalysis: {
                  significators: kpData?.significators || "KP Significators calculated",
                  rulingPlanets: kpData?.rulingPlanets || ["Mercury", "Venus", "Sun"],
                  analysis: kpData?.analysis || "Detailed KP analysis available",
                  subLords: kpData?.subLords || {},
                  dashas: kpData?.dashas || {},
                  predictions: kpData?.predictions || "Detailed predictions based on KP system"
                }
              },
              createdAt: birthData.createdAt
            };
          } catch (err) {
            console.error('Error processing birth data:', err);
            return null;
          }
        })
      );
      
      const validHoroscopes = savedHoroscopes.filter(h => h !== null);
      console.log('Valid horoscopes count:', validHoroscopes.length);
      res.json(validHoroscopes);
    } catch (error) {
      console.error('Error fetching saved horoscopes:', error);
      res.status(500).json({ error: 'Failed to fetch saved horoscopes' });
    }
  });

  app.post('/api/horoscopes/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { charts, ...birthDataInput } = req.body;
      
      // Parse birth date to extract year, month, day
      const birthDate = new Date(birthDataInput.birthDate);
      const year = birthDate.getFullYear();
      const month = birthDate.getMonth() + 1;
      const day = birthDate.getDate();

      // Validate birth data
      const validatedBirthData = insertBirthDataSchema.parse({
        ...birthDataInput,
        userId,
        year,
        month,
        day,
      });

      // Create birth data entry
      const birthData = await storage.createBirthData(validatedBirthData);

      // Generate selected charts using the CORRECT calculation function
      const generatedCharts = [];
      for (const chartType of charts) {
        // Use generateKPChart instead of calculateKPChart for accurate calculations
        const birthInput = {
          birthDate: new Date(`${birthData.birthDate}T${birthData.birthTime}`),
          birthTime: birthData.birthTime,
          birthPlace: birthData.birthPlace,
          latitude: parseFloat(birthData.latitude.toString()),
          longitude: parseFloat(birthData.longitude.toString()),
          timezone: 'Asia/Kolkata' // Default timezone
        };
        
        const kpChart = await generateKPChart(birthInput);
        
        const chartData = {
          userId,
          birthDataId: birthData.id,
          chartType,
          chartData: kpChart.chartData,
          kpData: {} // generateKPChart doesn't return kpData, so use empty object
        };

        const chart = await storage.createChart(chartData);
        generatedCharts.push(chart);
      }

      res.json({ 
        birthData, 
        charts: generatedCharts,
        message: `Generated ${charts.length} charts successfully`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid horoscope data",
          details: fromZodError(error).toString()
        });
      }
      console.error("Error generating horoscope:", error);
      res.status(500).json({ message: "Failed to generate horoscope" });
    }
  });

  // Match routes
  app.post('/api/matches/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userChart = await storage.getChartByUserId(userId);
      
      if (!userChart) {
        return res.status(400).json({ message: "Chart not found. Please generate your chart first." });
      }

      // Get other users' profiles
      const profiles = await storage.getVisibleProfiles(userId);
      const matches = [];

      for (const profile of profiles) {
        const otherChart = await storage.getChartByUserId(profile.userId);
        if (otherChart) {
          const compatibilityScore = await generateCompatibilityScore(userChart, otherChart);
          const matchData = {
            userId,
            matchedUserId: profile.userId,
            compatibilityScore,
            matchData: {
              profile,
              compatibilityDetails: compatibilityScore.details,
            },
          };
          
          const match = await storage.createMatch(matchData);
          matches.push(match);
        }
      }

      res.json({ matches: matches.length, generated: new Date() });
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });

  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getMatchesByUserId(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.patch('/api/matches/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matchId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Verify ownership
      const existingMatch = await storage.getMatchById(matchId);
      if (!existingMatch || existingMatch.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const match = await storage.updateMatchStatus(matchId, status);
      res.json(match);
    } catch (error) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // Admin routes
  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      // Simple admin check - in production, implement proper role-based access
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.email?.endsWith('@admin.com')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getAllAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.patch('/api/admin/settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.email?.endsWith('@admin.com')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key } = req.params;
      const { value } = req.body;
      
      const setting = await storage.updateAdminSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating admin setting:", error);
      res.status(500).json({ message: "Failed to update admin setting" });
    }
  });

  // GPT Integration API - Middleware for API key authentication
  const validateApiKey = (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    // Check for valid API key (you can change this key)
    const validApiKey = process.env.WEBAPP_API_KEY || 'sk-astro-webapp-2025-secure-api-key-xyz789';
    
    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Valid API key required in X-API-Key header' 
      });
    }
    
    next();
  };

  // GPT Integration API - Process birth data from custom GPT
  app.post('/api/gpt/process-birth-data', validateApiKey, async (req, res) => {
    try {
      console.log('GPT API called with data:', req.body);
      
      const {
        name,
        gender,
        birthDate,
        birthTime,
        birthPlace,
        state,
        country,
        motherName,
        fatherName,
        gotra,
        latitude,
        longitude,
        timezone = '+05:30',
        generateChart = true
      } = req.body;

      // Validate required fields
      if (!name || !birthDate || !birthTime || !birthPlace) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, birthDate, birthTime, birthPlace' 
        });
      }

      // If coordinates not provided, use default (can be enhanced with geocoding)
      const lat = latitude || '13.0827';
      const lng = longitude || '80.2707';

      // Parse date components
      const date = new Date(birthDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Calculate basic astrological values
      const birthDateTime = new Date(`${birthDate}T${birthTime}`);
      const astroData = await calculateBasicAstroData({ birthDate: birthDateTime, latitude: parseFloat(lat), longitude: parseFloat(lng) });

      // Ensure GPT user exists or use authenticated user if available
      let userId = 'gpt-api-user';
      try {
        // Check if GPT user exists, create if not
        let gptUser = await storage.getUser(userId);
        if (!gptUser) {
          gptUser = await storage.upsertUser({
            id: userId,
            email: 'gpt@api.system',
            firstName: 'GPT',
            lastName: 'Integration'
          });
        }
      } catch (error) {
        console.log('GPT user creation not needed, proceeding...');
      }

      // Create birth data entry
      const birthDataEntry = {
        userId,
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude: lat,
        longitude: lng,
        timezone,
        year,
        month,
        day,
        lagna: astroData.ascendant,
        star: astroData.birthStar,
        tithi: astroData.nakshatra
      };

      // Save birth data
      const savedBirthData = await storage.createBirthData(birthDataEntry);
      console.log('Birth data saved:', savedBirthData.id);

      let chartData = null;
      let interpretation = null;

      if (generateChart) {
        // Generate KP chart using real astronomical calculations
        console.log('Generating KP chart...');
        const kpChart = await calculateKPChart(savedBirthData);
        
        // Save chart data
        const chartEntry = {
          userId,
          birthDataId: savedBirthData.id,
          chartType: 'kp-main',
          chartData: kpChart.chartData,
          kpData: kpChart.kpData
        };

        console.log('Chart entry being saved:', { userId, birthDataId: savedBirthData.id, chartType: 'kp-main' });
        
        const savedChart = await storage.createChart(chartEntry);
        chartData = kpChart;
        
        // Generate AI interpretation
        console.log('Generating AI interpretation...');
        interpretation = await generateChartInterpretation(kpChart);
        
        // Save interpretation
        await storage.createInterpretation({
          chartId: savedChart.id,
          interpretationType: 'general',
          interpretation: interpretation
        });
      }

      // Return comprehensive response with complete saved data
      const response = {
        success: true,
        message: 'Birth data processed and saved successfully',
        data: {
          savedBirthData: savedBirthData, // Complete saved birth data record
          personalInfo: {
            name,
            gender,
            birthDate,
            birthTime,
            birthPlace,
            state,
            country
          },
          location: {
            latitude: lat,
            longitude: lng,
            timezone
          },
          chart: chartData,
          interpretation,
          kpDetails: chartData ? {
            lagna: chartData.chartData.ascendant,
            planetaryPositions: chartData.chartData.planets,
            houseDetails: chartData.chartData.houses,
            significators: chartData.kpData.significators,
            rulingPlanets: chartData.kpData.rulingPlanets
          } : null
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error processing GPT birth data:', error);
      res.status(500).json({ 
        error: 'Failed to process birth data',
        message: error.message 
      });
    }
  });

  // GPT API - Get saved chart by ID
  app.get('/api/gpt/chart/:id', async (req, res) => {
    try {
      const chartId = parseInt(req.params.id);
      const chart = await storage.getChartById(chartId);
      
      if (!chart) {
        return res.status(404).json({ error: 'Chart not found' });
      }

      const birthData = await storage.getBirthDataByUserId(chart.userId);
      const interpretations = await storage.getInterpretationsByChartId(chartId);

      res.json({
        success: true,
        data: {
          chart,
          birthData,
          interpretations
        }
      });
    } catch (error) {
      console.error('Error fetching chart:', error);
      res.status(500).json({ error: 'Failed to fetch chart' });
    }
  });

  // GPT API - Pull Data Endpoints (USB-C Style Universal Interface)
  
  // Get all stored birth charts with pagination
  app.get('/api/gpt/pull-charts', validateApiKey, async (req: any, res) => {
    try {
      console.log('Pull charts API called');
      res.setHeader('Content-Type', 'application/json');
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const searchName = req.query.name;
      const searchYear = req.query.year;
      const searchMonth = req.query.month;
      
      let birthDataList;
      
      // Apply filters if provided
      if (searchYear && searchMonth) {
        birthDataList = await storage.getBirthDataByYearAndMonth(parseInt(searchYear), parseInt(searchMonth));
      } else if (searchYear) {
        birthDataList = await storage.getBirthDataByYear(parseInt(searchYear));
      } else {
        birthDataList = await storage.getAllBirthDataForBrowsing();
      }
      
      // Filter by name if provided
      if (searchName) {
        birthDataList = birthDataList.filter(data => 
          data.name.toLowerCase().includes(searchName.toLowerCase())
        );
      }
      
      // Apply pagination
      const paginatedData = birthDataList.slice(offset, offset + limit);
      
      // Format response in standardized JSON (USB-C format)
      const formattedResponse = {
        success: true,
        data: paginatedData.map(birthData => ({
          user_id: birthData.userId,
          birth_details: {
            id: birthData.id,
            name: birthData.name,
            dob: birthData.birthDate,
            time: birthData.birthTime,
            place: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone
          },
          astrological_values: {
            lagna: birthData.lagna,
            star: birthData.star,
            tithi: birthData.tithi,
            year: birthData.year,
            month: birthData.month,
            day: birthData.day
          },
          metadata: {
            created_at: birthData.createdAt,
            updated_at: birthData.updatedAt
          }
        })),
        pagination: {
          total: birthDataList.length,
          limit,
          offset,
          has_more: offset + limit < birthDataList.length
        }
      };
      
      res.json(formattedResponse);
    } catch (error) {
      console.error('Error fetching birth charts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch birth charts',
        message: error.message 
      });
    }
  });

  // Get specific birth chart with complete data
  app.get('/api/gpt/pull-chart/:id', validateApiKey, async (req: any, res) => {
    try {
      console.log('Pull specific chart API called for ID:', req.params.id);
      res.setHeader('Content-Type', 'application/json');
      const birthDataId = parseInt(req.params.id);
      const birthData = await storage.getBirthDataByUserId('gpt-api-user');
      
      if (!birthData) {
        return res.status(404).json({ error: 'Birth chart not found' });
      }
      
      // Get associated chart data
      const chart = await storage.getChartByUserId('gpt-api-user');
      const interpretations = chart ? await storage.getInterpretationsByChartId(chart.id) : [];
      
      // Format response in standardized JSON (USB-C format)
      const formattedResponse = {
        success: true,
        data: {
          user_id: birthData.userId,
          birth_details: {
            id: birthData.id,
            name: birthData.name,
            dob: birthData.birthDate,
            time: birthData.birthTime,
            place: birthData.birthPlace,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            timezone: birthData.timezone
          },
          planetary_positions: chart ? chart.chartData.planets.map(planet => ({
            name: planet.name,
            longitude: planet.longitude,
            sign: planet.sign,
            degree: planet.degree,
            minute: planet.minute,
            house: planet.house
          })) : [],
          houses: chart ? chart.chartData.houses : [],
          astrological_values: {
            lagna: birthData.lagna,
            star: birthData.star,
            tithi: birthData.tithi
          },
          kp_data: chart ? chart.kpData : {},
          interpretations: interpretations.map(interp => ({
            type: interp.interpretationType,
            content: interp.interpretation,
            created_at: interp.createdAt
          })),
          classification_tag: chart ? "GroupKP" : "Basic",
          metadata: {
            created_at: birthData.createdAt,
            updated_at: birthData.updatedAt,
            has_chart: !!chart
          }
        }
      };
      
      res.json(formattedResponse);
    } catch (error) {
      console.error('Error fetching specific chart:', error);
      res.status(500).json({ 
        error: 'Failed to fetch chart',
        message: error.message 
      });
    }
  });

  // Search charts by criteria
  app.get('/api/gpt/search-charts', validateApiKey, async (req: any, res) => {
    try {
      console.log('Search charts API called with criteria:', req.query);
      res.setHeader('Content-Type', 'application/json');
      const { 
        lagna, 
        star, 
        tithi, 
        year_from, 
        year_to, 
        place, 
        limit = 10, 
        offset = 0 
      } = req.query;
      
      let birthDataList = await storage.getAllBirthDataForBrowsing();
      
      // Apply filters
      if (lagna) {
        birthDataList = birthDataList.filter(data => 
          data.lagna?.toLowerCase() === lagna.toLowerCase()
        );
      }
      
      if (star) {
        birthDataList = birthDataList.filter(data => 
          data.star?.toLowerCase() === star.toLowerCase()
        );
      }
      
      if (tithi) {
        birthDataList = birthDataList.filter(data => 
          data.tithi?.toLowerCase() === tithi.toLowerCase()
        );
      }
      
      if (year_from || year_to) {
        birthDataList = birthDataList.filter(data => {
          const dataYear = data.year;
          if (year_from && dataYear < parseInt(year_from)) return false;
          if (year_to && dataYear > parseInt(year_to)) return false;
          return true;
        });
      }
      
      if (place) {
        birthDataList = birthDataList.filter(data => 
          data.birthPlace?.toLowerCase().includes(place.toLowerCase())
        );
      }
      
      // Apply pagination
      const paginatedData = birthDataList.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      // Format response in standardized JSON
      const formattedResponse = {
        success: true,
        search_criteria: {
          lagna, star, tithi, year_from, year_to, place
        },
        data: paginatedData.map(birthData => ({
          user_id: birthData.userId,
          birth_details: {
            id: birthData.id,
            name: birthData.name,
            dob: birthData.birthDate,
            time: birthData.birthTime,
            place: birthData.birthPlace
          },
          astrological_values: {
            lagna: birthData.lagna,
            star: birthData.star,
            tithi: birthData.tithi,
            year: birthData.year
          },
          match_score: 1.0 // Perfect match for search criteria
        })),
        pagination: {
          total: birthDataList.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < birthDataList.length
        }
      };
      
      res.json(formattedResponse);
    } catch (error) {
      console.error('Error searching charts:', error);
      res.status(500).json({ 
        error: 'Failed to search charts',
        message: error.message 
      });
    }
  });

  // Get available years for filtering
  app.get('/api/gpt/available-years', validateApiKey, async (req: any, res) => {
    try {
      console.log('Available years API called');
      res.setHeader('Content-Type', 'application/json');
      const years = await storage.getAvailableYears();
      
      res.json({
        success: true,
        data: {
          available_years: years,
          total_years: years.length,
          year_range: {
            earliest: Math.min(...years),
            latest: Math.max(...years)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching available years:', error);
      res.status(500).json({ 
        error: 'Failed to fetch available years',
        message: error.message 
      });
    }
  });

  // DATING APP API ENDPOINTS

  // Generate astrology profile and tags (for dating app)
  app.post('/api/profile/generate-astrology', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's birth data and chart
      const birthData = await storage.getBirthDataByUserId(userId);
      if (!birthData) {
        return res.status(404).json({ error: 'Birth data not found. Please complete your birth details first.' });
      }
      
      const chart = await storage.getChartByUserId(userId);
      if (!chart) {
        return res.status(404).json({ error: 'Chart not found. Please generate your chart first.' });
      }
      
      // Generate comprehensive astrology profile
      const astrologyProfile = await generateAstrologyProfile(birthData, chart);
      
      // Update or create profile with astrology data
      const existingProfile = await storage.getProfileByUserId(userId);
      if (existingProfile) {
        const updatedProfile = await storage.updateProfile(existingProfile.id, {
          primaryTag: astrologyProfile.primaryTag,
          secondaryTags: astrologyProfile.secondaryTags,
          astrologyProfile: astrologyProfile as any
        });
        res.json({
          success: true,
          profile: updatedProfile,
          astrologyProfile
        });
      } else {
        const newProfile = await storage.createProfile({
          userId,
          displayName: birthData.name,
          primaryTag: astrologyProfile.primaryTag,
          secondaryTags: astrologyProfile.secondaryTags,
          astrologyProfile: astrologyProfile as any
        });
        res.json({
          success: true,
          profile: newProfile,
          astrologyProfile
        });
      }
    } catch (error) {
      console.error('Error generating astrology profile:', error);
      res.status(500).json({ error: 'Failed to generate astrology profile' });
    }
  });

  // Find compatible matches (dating app core feature)
  app.get('/api/matches/discover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's profile
      const userProfile = await storage.getProfileByUserId(userId);
      if (!userProfile || !userProfile.astrologyProfile) {
        return res.status(404).json({ error: 'Complete your astrology profile first' });
      }
      
      // Get all other visible profiles
      const potentialMatches = await storage.getVisibleProfiles(userId);
      
      // Calculate compatibility scores
      const compatibilityResults = [];
      for (const match of potentialMatches) {
        if (match.astrologyProfile) {
          const compatibilityScore = await calcCompatScore(
            userProfile.astrologyProfile as any,
            match.astrologyProfile as any
          );
          
          compatibilityResults.push({
            profile: match,
            compatibility: compatibilityScore,
            matchScore: compatibilityScore.score
          });
        }
      }
      
      // Sort by compatibility score (highest first)
      compatibilityResults.sort((a, b) => b.matchScore - a.matchScore);
      
      // Return top matches
      const topMatches = compatibilityResults.slice(0, 20);
      res.json(topMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      res.status(500).json({ error: 'Failed to find matches' });
    }
  });

  // Record user interaction for AI learning
  app.post('/api/matches/interaction', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { matchedUserId, action, compatibilityScore } = req.body;
      
      // Get both user profiles
      const userProfile = await storage.getProfileByUserId(userId);
      const matchedProfile = await storage.getProfileByUserId(matchedUserId);
      
      if (!userProfile || !matchedProfile) {
        return res.status(404).json({ error: 'User profiles not found' });
      }
      
      // Record interaction for AI learning
      aiLearningEngine.addLearningData({
        userId,
        matchId: matchedUserId,
        action: action as any,
        timestamp: new Date(),
        compatibilityScore: compatibilityScore?.score || 0,
        userProfiles: {
          user1: userProfile.astrologyProfile as any,
          user2: matchedProfile.astrologyProfile as any
        }
      });
      
      // Create match record if it's a positive interaction
      if (action === 'swipe_right' || action === 'match') {
        await storage.createMatch({
          userId,
          matchedUserId,
          compatibilityScore: (compatibilityScore?.score || 0).toString(),
          matchData: {
            profile: matchedProfile,
            compatibilityDetails: compatibilityScore
          } as any,
          status: action === 'match' ? 'mutual' : 'liked'
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording interaction:', error);
      res.status(500).json({ error: 'Failed to record interaction' });
    }
  });

  // Get AI learning insights (for your analysis)
  app.get('/api/ai/learning-insights', isAuthenticated, async (req: any, res) => {
    try {
      const insights = await aiLearningEngine.analyzePatternsAndImprove();
      res.json(insights);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      res.status(500).json({ error: 'Failed to get AI insights' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
