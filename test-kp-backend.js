// Test KP calculations backend integration
import { calculateKPPlanets } from './server/kp-calculations.js';

async function testKPCalculations() {
  try {
    console.log('🧪 Testing KP calculations...');
    
    const birthDate = '25/11/1990';
    const birthTime = '03:17:25';
    const location = {
      latitude: 10.9,
      longitude: 78.8,
      elevation: 0
    };
    
    const result = await calculateKPPlanets(birthDate, birthTime, location);
    
    console.log('✅ KP Calculations successful!');
    console.log('📊 Sample results:');
    result.slice(0, 3).forEach(planet => {
      console.log(`  ${planet.planet}: ${planet.degree} ${planet.sign} (${planet.nakshatra})`);
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ KP calculation failed:', error.message);
    throw error;
  }
}

testKPCalculations()
  .then(() => console.log('🎉 Test completed successfully!'))
  .catch(e => console.error('💥 Test failed:', e.message));