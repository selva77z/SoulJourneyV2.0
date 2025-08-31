// Simple test script to verify GPT integration works
const testData = {
  name: "Test Person",
  birthDate: "1990-11-03",
  birthTime: "11:31:29",
  birthPlace: "Mumbai, India",
  latitude: "19.0760",
  longitude: "72.8777",
  generateChart: false
};

async function testGPTIntegration() {
  try {
    console.log('Testing GPT Integration...');
    
    const response = await fetch('http://localhost:5000/api/gpt/process-birth-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sk-astro-webapp-2025-secure-api-key-xyz789'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ GPT Integration Working!');
      console.log('Birth data processed successfully');
      console.log('Data saved with ID:', result.data.birthDataId);
    } else {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
  }
}

testGPTIntegration();