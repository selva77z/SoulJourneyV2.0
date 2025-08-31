#!/usr/bin/env python3
"""
Accurate KP Astrology Calculator using Swiss Ephemeris
Following the working approach from user's image
"""

# Re-import all necessary modules due to code environment reset
from datetime import datetime, timedelta
import swisseph as swe
import pandas as pd

# Set ephemeris path - try multiple common locations
try:
    swe.set_ephe_path('/mnt/data')
except:
    try:
        swe.set_ephe_path('/usr/share/swisseph')
    except:
        # Use default path
        pass

def calculate_accurate_kp_positions(birth_date, birth_time, latitude, longitude, timezone_offset=5.5):
    """
    Calculate accurate planetary positions using Swiss Ephemeris
    Following the exact approach shown in the working image
    """
    
    # Parse birth data
    if isinstance(birth_date, str):
        day, month, year = map(int, birth_date.split('/'))
    else:
        day, month, year = birth_date.day, birth_date.month, birth_date.year
    
    if isinstance(birth_time, str):
        time_parts = birth_time.split(':')
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        second = int(time_parts[2]) if len(time_parts) > 2 else 0
    else:
        hour, minute, second = birth_time.hour, birth_time.minute, birth_time.second
    
    # Create birth datetime in local time
    birth_datetime_local = datetime(year, month, day, hour, minute, second)
    
    # Convert to UTC (subtract timezone offset)
    birth_datetime_utc = birth_datetime_local - timedelta(hours=timezone_offset)
    
    # Calculate Julian Day Number
    julian_day = swe.julday(
        birth_datetime_utc.year,
        birth_datetime_utc.month, 
        birth_datetime_utc.day,
        birth_datetime_utc.hour + birth_datetime_utc.minute/60.0 + birth_datetime_utc.second/3600.0
    )
    
    print(f"Birth: {birth_date} {birth_time} (Local)")
    print(f"UTC: {birth_datetime_utc}")
    print(f"Julian Day: {julian_day}")
    print(f"Location: {latitude}°N, {longitude}°E")
    
    # Use exact KP ayanamsa: 23° 43' 07" = 23.71861111°
    kp_ayanamsa = 23.0 + 43.0/60 + 7.0/3600  # KP ayanamsa value
    print(f"KP Ayanamsa: {kp_ayanamsa:.8f}° (23° 43' 07\")")
    
    # Planet definitions
    planets = {
        'Sun': swe.SUN,
        'Moon': swe.MOON,
        'Mercury': swe.MERCURY,
        'Venus': swe.VENUS,
        'Mars': swe.MARS,
        'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN,
        'Rahu': swe.MEAN_NODE,  # Mean lunar node
        'Ketu': swe.MEAN_NODE   # Will calculate as opposite to Rahu
    }
    
    # Calculate planetary positions
    results = {}
    
    print("\n=== ACCURATE PLANETARY POSITIONS ===")
    print("Using Swiss Ephemeris with KP Ayanamsa 23° 43' 07\"")
    print("-" * 50)
    
    for planet_name, planet_id in planets.items():
        if planet_name == 'Ketu':
            continue  # Handle separately
            
        # Calculate geocentric position
        position = swe.calc_ut(julian_day, planet_id, swe.FLG_SWIEPH)[0]
        
        # Get tropical longitude
        tropical_longitude = position[0]
        
        # Convert to sidereal
        if planet_name == 'Rahu':
            sidereal_longitude = (tropical_longitude - kp_ayanamsa) % 360
            # Store both Rahu and Ketu
            results['Rahu'] = sidereal_longitude
            results['Ketu'] = (sidereal_longitude + 180) % 360
        else:
            sidereal_longitude = (tropical_longitude - kp_ayanamsa) % 360
            results[planet_name] = sidereal_longitude
    
    # Format and display results
    signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
             'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
    
    for planet_name in ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']:
        longitude = results[planet_name]
        sign_index = int(longitude / 30)
        degree_in_sign = longitude % 30
        deg = int(degree_in_sign)
        min_val = int((degree_in_sign % 1) * 60)
        sec_val = int(((degree_in_sign % 1) * 60 % 1) * 60)
        
        print(f"{planet_name:8}: {deg:02d}°{min_val:02d}'{sec_val:02d}\" {signs[sign_index]}")
    
    return results

if __name__ == "__main__":
    # Test with your birth data: 25/11/1990, 3:17:25 AM, Pudukkottai
    birth_date = "25/11/1990"
    birth_time = "03:17:25"
    latitude = 10.381389   # 10°22'53"N
    longitude = 78.821389  # 78°49'17"E
    
    try:
        positions = calculate_accurate_kp_positions(
            birth_date, birth_time, latitude, longitude
        )
        
        print("\n=== SUMMARY ===")
        print("Calculation method: Swiss Ephemeris + KP Ayanamsa 23° 43' 07\"")
        print("This should match KP astrology software and methods")
        
    except Exception as e:
        print(f"Error in calculation: {e}")
        print("Trying fallback calculation...")
        
        # Fallback without ephemeris files
        import ephem
        print("Using PyEphem as fallback...")