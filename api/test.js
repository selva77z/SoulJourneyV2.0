export default function handler(req, res) {
  // Set CORS headers for Vercel
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
    message: "Vercel API is working!", 
    timestamp: new Date().toISOString(),
    environment: 'Vercel Serverless',
    node_version: process.version,
    available_endpoints: [
      'GET /api/test',
      'POST /api/horoscopes/simple',
      'GET /api/transits/current'
    ]
  });
}