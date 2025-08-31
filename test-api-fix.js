const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('https://99e05497-dc40-4026-807e-88dd2b97cad5-00-2z3pasrq7lpea.janeway.replit.dev/api/gpt/process-birth-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sk-astro-webapp-2025-secure-api-key-xyz789'
      },
      body: JSON.stringify({
        name: 'API Test Person',
        birthDate: '1985-03-15',
        birthTime: '14:30:00',
        birthPlace: 'Mumbai, Maharashtra, India'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();