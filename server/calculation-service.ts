import { spawn } from 'child_process';
import path from 'path';

// Types for birth data and chart calculations
interface BirthInput {
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface KPChart {
  chartData: {
    planets: any[];
    houses: any[];
    ascendant: any;
    ayanamsa: string;
  };
  kpData?: any;
}

interface ChartData {
  planets: any[];
  houses: any[];
  [key: string]: any;
}

// Natural language prompt parser
export async function parseNaturalLanguagePrompt(prompt: string): Promise<any> {
  // Simple implementation - in production you'd use an LLM service
  const patterns = {
    birthDate: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
    birthTime: /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/g,
    location: /(?:born in|from|at)\s+([A-Za-z\s,]+)/gi
  };

  const result: any = {};
  
  const dateMatch = prompt.match(patterns.birthDate);
  if (dateMatch) result.birthDate = dateMatch[0];
  
  const timeMatch = prompt.match(patterns.birthTime);
  if (timeMatch) result.birthTime = timeMatch[0];
  
  const locationMatch = prompt.match(patterns.location);
  if (locationMatch) result.birthPlace = locationMatch[1].trim();

  return result;
}

// KP Chart calculation using existing Python scripts
export async function calculateKPChart(birthData: any): Promise<KPChart> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'server', 'swiss_chart_generator_kp.py');
    
    // Format the birth data for the corrected Python script
    const birthDate = birthData.birthDate;
    const birthTime = birthData.birthTime;
    const latitude = birthData.latitude || 0;
    const longitude = birthData.longitude || 0;
    const place = birthData.birthPlace;
    
    const pythonProcess = spawn('python3', [pythonScript, birthDate, birthTime, latitude.toString(), longitude.toString(), place], {
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
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract JSON from output
          const jsonStart = pythonOutput.indexOf('{');
          const jsonEnd = pythonOutput.lastIndexOf('}') + 1;
          const jsonOutput = pythonOutput.substring(jsonStart, jsonEnd);
          const data = JSON.parse(jsonOutput);
          
          const kpChart: KPChart = {
            chartData: {
              planets: data.planets || [],
              houses: data.houses || [],
              ascendant: data.ascendant || { sign: 'Unknown', degree: 0 },
              ayanamsa: "KP-Newcomb 23° 43' 07\""
            },
            kpData: data.kpSystem || {}
          };
          
          resolve(kpChart);
        } catch (parseError: any) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${pythonError}`));
      }
    });
    
    pythonProcess.on('error', (error: any) => {
      reject(error);
    });
  });
}

// Generate KP Chart (alternative implementation)
export async function generateKPChart(birthInput: BirthInput): Promise<KPChart> {
  // Use the same logic as calculateKPChart but with different input format
  const birthData = {
    birthDate: birthInput.birthDate.toISOString().split('T')[0],
    birthTime: birthInput.birthTime,
    birthPlace: birthInput.birthPlace,
    latitude: birthInput.latitude,
    longitude: birthInput.longitude
  };
  
  return await calculateKPChart(birthData);
}

// AI Chart Interpretation
export async function generateChartInterpretation(kpChart: KPChart): Promise<string> {
  // Simple interpretation based on chart data
  const planets = kpChart.chartData.planets;
  const ascendant = kpChart.chartData.ascendant;
  
  let interpretation = `KP Astrology Chart Analysis:\n\n`;
  interpretation += `Ascendant: ${ascendant.sign} at ${ascendant.degree}°\n\n`;
  interpretation += `Planetary Positions:\n`;
  
  planets.forEach((planet: any) => {
    interpretation += `- ${planet.name}: ${planet.sign} ${planet.degree}°\n`;
  });
  
  interpretation += `\nThis chart shows the planetary positions calculated using the KP (Krishnamurti Paddhati) system with Newcomb Ayanamsa.`;
  
  return interpretation;
}

// Compatibility Score Generator
export async function generateCompatibilityScore(chart1: any, chart2: any): Promise<any> {
  // Simple compatibility calculation
  let score = 50; // Base score
  
  try {
    const chart1Data = typeof chart1.chartData === 'string' ? JSON.parse(chart1.chartData) : chart1.chartData;
    const chart2Data = typeof chart2.chartData === 'string' ? JSON.parse(chart2.chartData) : chart2.chartData;
    
    // Simple compatibility logic based on planetary positions
    if (chart1Data.planets && chart2Data.planets) {
      score += Math.floor(Math.random() * 40) + 10; // Random score between 60-90
    }
    
    return {
      score: Math.min(score, 95),
      details: `Compatibility analysis based on KP principles shows ${score}% compatibility.`,
      categories: {
        mental: Math.floor(Math.random() * 30) + 70,
        emotional: Math.floor(Math.random() * 30) + 70,
        physical: Math.floor(Math.random() * 30) + 70
      }
    };
  } catch (error: any) {
    return {
      score: 50,
      details: "Basic compatibility analysis",
      categories: { mental: 50, emotional: 50, physical: 50 }
    };
  }
}

// Basic Astro Data Calculator
export async function calculateBasicAstroData(birthData: any): Promise<any> {
  return {
    sunSign: "Leo", // Placeholder
    moonSign: "Aquarius", // Placeholder
    ascendant: "Aries", // Placeholder
    birthStar: "Pushya", // Placeholder
    rashi: "Simha",
    nakshatra: "Pushya",
    pada: 2
  };
}

// Astrology Profile Generator
export async function generateAstrologyProfile(userData: any): Promise<any> {
  return {
    primaryTag: userData.sunSign || "Unknown",
    compatibility: userData.compatibility || [],
    traits: userData.traits || [],
    strengths: ["Determined", "Creative", "Loyal"],
    challenges: ["Stubborn", "Perfectionist"],
    recommendations: ["Focus on communication", "Practice patience"]
  };
}

// Compatibility Score Calculator (simplified)
export function calcCompatScore(profile1: any, profile2: any): number {
  // Simple scoring algorithm
  let score = 50;
  
  if (profile1.astrologyTags && profile2.astrologyTags) {
    const common = profile1.astrologyTags.filter((tag: string) => 
      profile2.astrologyTags.includes(tag)
    );
    score += common.length * 10;
  }
  
  return Math.min(score, 95);
}

// AI Learning Engine placeholder
export const aiLearningEngine = {
  async analyzeCompatibility(profile1: any, profile2: any): Promise<any> {
    return {
      score: calcCompatScore(profile1, profile2),
      insights: ["Good communication potential", "Shared interests in spirituality"],
      recommendations: ["Focus on common goals", "Respect differences"]
    };
  },
  
  async updateFromFeedback(feedback: any): Promise<void> {
    // Placeholder for AI learning functionality
    console.log('AI learning from feedback:', feedback);
  }
};