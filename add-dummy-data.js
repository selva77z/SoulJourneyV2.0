import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.join(__dirname, 'server', 'local.db');
const db = new Database(dbPath);

// Sample horoscope data with comprehensive KP analysis
const dummyData = [
  {
    name: "Rajesh Kumar",
    dateOfBirth: "1985-03-15",
    timeOfBirth: "14:30:00",
    placeOfBirth: "Mumbai, Maharashtra, India",
    latitude: 19.0760,
    longitude: 72.8777,
    state: "Maharashtra",
    country: "India",
    chartData: JSON.stringify({
      planets: [
        { name: "Sun", degree: 354.45, house: 1, sign: "Pisces" },
        { name: "Moon", degree: 45.23, house: 3, sign: "Taurus" },
        { name: "Mars", degree: 123.67, house: 5, sign: "Leo" },
        { name: "Mercury", degree: 12.89, house: 12, sign: "Pisces" },
        { name: "Jupiter", degree: 78.45, house: 4, sign: "Gemini" },
        { name: "Venus", degree: 332.12, house: 12, sign: "Pisces" },
        { name: "Saturn", degree: 234.78, house: 9, sign: "Sagittarius" },
        { name: "Rahu", degree: 156.34, house: 6, sign: "Virgo" },
        { name: "Ketu", degree: 336.34, house: 12, sign: "Pisces" }
      ],
      houses: [
        { number: 1, degree: 345.0, sign: "Pisces" },
        { number: 2, degree: 15.0, sign: "Aries" },
        { number: 3, degree: 45.0, sign: "Taurus" },
        { number: 4, degree: 75.0, sign: "Gemini" },
        { number: 5, degree: 105.0, sign: "Cancer" },
        { number: 6, degree: 135.0, sign: "Leo" },
        { number: 7, degree: 165.0, sign: "Virgo" },
        { number: 8, degree: 195.0, sign: "Libra" },
        { number: 9, degree: 225.0, sign: "Scorpio" },
        { number: 10, degree: 255.0, sign: "Sagittarius" },
        { number: 11, degree: 285.0, sign: "Capricorn" },
        { number: 12, degree: 315.0, sign: "Aquarius" }
      ],
      kpAnalysis: {
        significators: "Jupiter, Venus, Mercury are strong significators for career and wealth",
        rulingPlanets: "Sun, Jupiter, Venus ruling current life phase",
        analysis: "Strong Jupiter in 4th house indicates property gains and family happiness. Venus in 12th suggests spiritual inclinations and possible foreign connections. Current Rahu Mahadasha brings opportunities in technology and innovation.",
        predictions: "Next 2 years favorable for career advancement, property investment, and spiritual growth. Avoid major decisions during Mars transit in 8th house."
      }
    })
  },
  {
    name: "Priya Sharma", 
    dateOfBirth: "1992-07-22",
    timeOfBirth: "09:15:00",
    placeOfBirth: "Delhi, Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    state: "Delhi",
    country: "India",
    chartData: JSON.stringify({
      planets: [
        { name: "Sun", degree: 120.25, house: 4, sign: "Cancer" },
        { name: "Moon", degree: 78.90, house: 3, sign: "Gemini" },
        { name: "Mars", degree: 234.56, house: 9, sign: "Sagittarius" },
        { name: "Mercury", degree: 135.78, house: 5, sign: "Leo" },
        { name: "Jupiter", degree: 298.34, house: 11, sign: "Aquarius" },
        { name: "Venus", degree: 156.89, house: 6, sign: "Virgo" },
        { name: "Saturn", degree: 67.23, house: 3, sign: "Gemini" },
        { name: "Rahu", degree: 189.45, house: 7, sign: "Libra" },
        { name: "Ketu", degree: 9.45, house: 1, sign: "Aries" }
      ],
      houses: [
        { number: 1, degree: 0.0, sign: "Aries" },
        { number: 2, degree: 30.0, sign: "Taurus" },
        { number: 3, degree: 60.0, sign: "Gemini" },
        { number: 4, degree: 90.0, sign: "Cancer" },
        { number: 5, degree: 120.0, sign: "Leo" },
        { number: 6, degree: 150.0, sign: "Virgo" },
        { number: 7, degree: 180.0, sign: "Libra" },
        { number: 8, degree: 210.0, sign: "Scorpio" },
        { number: 9, degree: 240.0, sign: "Sagittarius" },
        { number: 10, degree: 270.0, sign: "Capricorn" },
        { number: 11, degree: 300.0, sign: "Aquarius" },
        { number: 12, degree: 330.0, sign: "Pisces" }
      ],
      kpAnalysis: {
        significators: "Sun, Moon, Jupiter excellent for education and creativity",
        rulingPlanets: "Moon, Mercury, Jupiter governing current success period", 
        analysis: "Excellent Jupiter in 11th house promises gains and fulfillment of desires. Sun in 4th brings domestic happiness and property. Venus in 6th indicates success through service and healing professions.",
        predictions: "Outstanding period for education, creative projects, and financial gains. Marriage prospects excellent in next 18 months. Health requires attention during Saturn transit."
      }
    })
  },
  {
    name: "Amit Patel",
    dateOfBirth: "1988-11-08", 
    timeOfBirth: "18:45:00",
    placeOfBirth: "Ahmedabad, Gujarat, India",
    latitude: 23.0225,
    longitude: 72.5714,
    state: "Gujarat", 
    country: "India",
    chartData: JSON.stringify({
      planets: [
        { name: "Sun", degree: 226.78, house: 8, sign: "Scorpio" },
        { name: "Moon", degree: 167.34, house: 6, sign: "Virgo" },
        { name: "Mars", degree: 289.56, house: 10, sign: "Capricorn" },
        { name: "Mercury", degree: 245.12, house: 9, sign: "Sagittarius" },
        { name: "Jupiter", degree: 34.67, house: 2, sign: "Taurus" },
        { name: "Venus", degree: 198.23, house: 7, sign: "Libra" },
        { name: "Saturn", degree: 145.89, house: 5, sign: "Leo" },
        { name: "Rahu", degree: 78.90, house: 3, sign: "Gemini" },
        { name: "Ketu", degree: 258.90, house: 9, sign: "Sagittarius" }
      ],
      houses: [
        { number: 1, degree: 315.0, sign: "Aquarius" },
        { number: 2, degree: 345.0, sign: "Pisces" },
        { number: 3, degree: 15.0, sign: "Aries" },
        { number: 4, degree: 45.0, sign: "Taurus" },
        { number: 5, degree: 75.0, sign: "Gemini" },
        { number: 6, degree: 105.0, sign: "Cancer" },
        { number: 7, degree: 135.0, sign: "Leo" },
        { number: 8, degree: 165.0, sign: "Virgo" },
        { number: 9, degree: 195.0, sign: "Libra" },
        { number: 10, degree: 225.0, sign: "Scorpio" },
        { number: 11, degree: 255.0, sign: "Sagittarius" },
        { number: 12, degree: 285.0, sign: "Capricorn" }
      ],
      kpAnalysis: {
        significators: "Mars, Saturn, Venus strong for business and partnerships",
        rulingPlanets: "Mars, Saturn, Mercury driving business success",
        analysis: "Powerful Mars in 10th house indicates leadership and business success. Venus in 7th promises excellent partnerships and marriage. Sun in 8th suggests research abilities and sudden gains through investments.",
        predictions: "Exceptional business opportunities in next 3 years. Partnership ventures highly favorable. Avoid speculation during Mercury retrograde periods. Marriage brings prosperity."
      }
    })
  }
];

try {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS birth_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      time_of_birth TEXT NOT NULL,
      place_of_birth TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      state TEXT,
      country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      birth_data_id INTEGER NOT NULL,
      chart_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (birth_data_id) REFERENCES birth_data (id)
    )
  `);

  // Insert dummy data
  const insertBirthData = db.prepare(`
    INSERT INTO birth_data (user_id, name, date_of_birth, time_of_birth, place_of_birth, latitude, longitude, state, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChartData = db.prepare(`
    INSERT INTO charts (birth_data_id, chart_data)
    VALUES (?, ?)
  `);

  for (const data of dummyData) {
    const birthResult = insertBirthData.run(
      'test-user',
      data.name,
      data.dateOfBirth,
      data.timeOfBirth,
      data.placeOfBirth,
      data.latitude,
      data.longitude,
      data.state,
      data.country
    );

    insertChartData.run(birthResult.lastInsertRowid, data.chartData);
    console.log(`✅ Added horoscope for ${data.name}`);
  }

  console.log('\n🎉 Successfully added 3 dummy horoscopes with comprehensive KP analysis!');
  console.log('You can now view them at: http://localhost:5173');
  console.log('Click on "Saved Horoscopes" to see the detailed reports with tables.');

} catch (error) {
  console.error('❌ Error adding dummy data:', error);
} finally {
  db.close();
}
