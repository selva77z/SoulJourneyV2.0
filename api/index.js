export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    message: "SoulJourney KP Astrology API - Vercel Compatible",
    version: "1.0.0",
    environment: "Vercel Serverless",
    timestamp: new Date().toISOString(),
    endpoints: {
      test: "GET /api/test",
      simple_horoscope: "POST /api/horoscopes/simple",
      current_transits: "GET /api/transits/current"
    },
    features: [
      "KP-Newcomb Ayanamsa (23° 43' 04\")",
      "Nakshatra and Star Lord calculations",
      "Sub-Lord system for predictions", 
      "House cusp calculations",
      "Current planetary transits",
      "Vercel serverless compatible"
    ],
    usage: {
      horoscope_generation: {
        endpoint: "/api/horoscopes/simple",
        method: "POST",
        body: {
          name: "Person Name",
          birthDate: "YYYY-MM-DD",
          birthTime: "HH:MM:SS",
          birthPlace: "City, State, Country"
        }
      },
      current_transits: {
        endpoint: "/api/transits/current",
        method: "GET"
      }
    }
  });
}