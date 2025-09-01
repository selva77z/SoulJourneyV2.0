import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SoulJourney Backend Server Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'Connected' : 'Local SQLite',
    features: [
      'Birth data storage',
      'Chart generation and saving',
      'User authentication ready',
      'KP calculations with multiple ayanamsa',
      'Dasha system calculations'
    ]
  });
});

// Import API routes
import birthDataRoutes from './routes/birth-data.js';
import chartRoutes from './routes/charts.js';
import authRoutes from './routes/auth.js';

// Use routes
app.use('/api/birth-data', birthDataRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/auth', authRoutes);

// Legacy API endpoints (for compatibility)
app.post('/api/calculate', async (req, res) => {
  try {
    const { name, birthDate, birthTime, placeName, ayanamsa, gender, timezone } = req.body;
    
    // Save birth data to database
    const birthDataId = await saveBirthData({
      name,
      birthDate,
      birthTime,
      birthPlace: placeName,
      ayanamsa: ayanamsa || 'kp-newcomb',
      gender: gender || 'not-specified',
      timezone: timezone || '+05:30'
    });
    
    // Generate and save chart
    const chart = await generateAndSaveChart(birthDataId, {
      name,
      birthDate,
      birthTime,
      placeName,
      ayanamsa: ayanamsa || 'kp-newcomb'
    });
    
    res.json({
      success: true,
      chart: chart,
      birthDataId: birthDataId,
      message: `Chart generated and saved for ${name}`
    });
    
  } catch (error) {
    console.error('Error in /api/calculate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /api/health',
      'POST /api/calculate',
      'GET /api/birth-data',
      'POST /api/birth-data',
      'GET /api/charts',
      'POST /api/charts'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Database and utility functions
async function saveBirthData(data) {
  // For now, return a mock ID - will implement database later
  console.log('📝 Saving birth data:', data);
  return Date.now(); // Mock ID
}

async function generateAndSaveChart(birthDataId, data) {
  // Import the calculation logic from our API
  const { calculateChart } = await import('../api/calculate.js');
  
  const chart = await calculateChart(data);
  
  // Save chart to database (mock for now)
  console.log('💾 Saving chart for birth data ID:', birthDataId);
  
  return chart;
}

app.listen(PORT, () => {
  console.log(`🚀 SoulJourney Backend Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Local SQLite'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});