const { spawn } = require('child_process');

// Test the Swiss Ephemeris calculation directly
function testSwissCalculation() {
  const pythonScript = `
from datetime import datetime, timedelta
import swisseph as swe
import json

# Your birth data for testing
birth_date = "25/11/1990"
birth_time = "03:17:25"
latitude = 10.381389
longitude = 78.821389

# Parse birth data
day, month, year = map(int, birth_date.split('/'))
time_parts = birth_time.split(':')
hour = int(time_parts[0])
minute = int(time_parts[1])
second = int(time_parts[2]) if len(time_parts) > 2 else 0

# Create birth datetime in local time (IST)
birth_datetime_local = datetime(year, month, day, hour, minute, second)

# Convert to UTC (subtract 5.5 hours for IST)
birth_datetime_utc = birth_datetime_local - timedelta(hours=5.5)

# Calculate Julian Day Number
julian_day = swe.julday(
    birth_datetime_utc.year,
    birth_datetime_utc.month, 
    birth_datetime_utc.day,
    birth_datetime_utc.hour + birth_datetime_utc.minute/60.0 + birth_datetime_utc.second/3600.0
)

# Set ayanamsa - use Lahiri (standard Vedic)
swe.set_sid_mode(swe.SIDM_LAHIRI)

# Get ayanamsa value
ayanamsa = swe.get_ayanamsa(julian_day)

# Planet definitions
planets = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE
}

# Calculate planetary positions
results = {}
signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

for planet_name, planet_id in planets.items():
    if planet_name == 'Rahu':
        # Calculate geocentric position
        position = swe.calc_ut(julian_day, planet_id, swe.FLG_SWIEPH)[0]
        tropical_longitude = position[0]
        
        # Convert to sidereal for Rahu
        rahu_sidereal = (tropical_longitude - ayanamsa) % 360
        ketu_sidereal = (rahu_sidereal + 180) % 360
        
        # Format Rahu
        rahu_sign_index = int(rahu_sidereal / 30)
        rahu_degree = rahu_sidereal % 30
        results['Rahu'] = {
            'longitude': rahu_sidereal,
            'sign': signs[rahu_sign_index],
            'degree': int(rahu_degree),
            'house': rahu_sign_index + 1
        }
        
        # Format Ketu
        ketu_sign_index = int(ketu_sidereal / 30)
        ketu_degree = ketu_sidereal % 30
        results['Ketu'] = {
            'longitude': ketu_sidereal,
            'sign': signs[ketu_sign_index],
            'degree': int(ketu_degree),
            'house': ketu_sign_index + 1
        }
    else:
        # Calculate geocentric position
        position = swe.calc_ut(julian_day, planet_id, swe.FLG_SWIEPH)[0]
        tropical_longitude = position[0]
        
        # Convert to sidereal
        sidereal_longitude = (tropical_longitude - ayanamsa) % 360
        
        # Format position
        sign_index = int(sidereal_longitude / 30)
        degree_in_sign = sidereal_longitude % 30
        
        results[planet_name] = {
            'longitude': sidereal_longitude,
            'sign': signs[sign_index],
            'degree': int(degree_in_sign),
            'house': sign_index + 1
        }

print(json.dumps(results))
`;

  const python = spawn('python3', ['-c', pythonScript]);
  
  let dataString = '';
  let errorString = '';

  python.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python script failed:', errorString);
      return;
    }

    try {
      const result = JSON.parse(dataString.trim());
      console.log('✅ Swiss Ephemeris Test Results:');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('Failed to parse result:', e.message);
      console.error('Raw output:', dataString);
    }
  });
}

testSwissCalculation();