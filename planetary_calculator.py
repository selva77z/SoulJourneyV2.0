#!/usr/bin/env python3
"""
Simple Swiss Ephemeris Planetary Position Calculator
Returns accurate planetary positions using Swiss Ephemeris
"""

import sys
import json
from datetime import datetime
import swisseph as swe

# KP-Newcomb Ayanamsa value
KP_NEWCOMB_AYANAMSA = 23.71861111

# Planet IDs for Swiss Ephemeris
PLANETS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,
    'Ketu': swe.MEAN_NODE  # Will be calculated as opposite of Rahu
}

# Zodiac signs
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

def calculate_julian_day(date_str, time_str):
    """Calculate Julian Day using Swiss Ephemeris method"""
    try:
        # Parse date (YYYY-MM-DD format)
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts[0]) == 4:  # YYYY/MM/DD
                year, month, day = map(int, parts)
            else:  # DD/MM/YYYY
                day, month, year = map(int, parts)
        else:  # YYYY-MM-DD
            year, month, day = map(int, date_str.split('-'))
        
        # Parse time (HH:MM:SS format)
        time_parts = time_str.split(':')
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        second = int(time_parts[2]) if len(time_parts) > 2 else 0
        
        # Calculate decimal time
        decimal_time = hour + minute/60 + second/3600
        
        # Use Swiss Ephemeris julday function
        jd = swe.julday(year, month, day, decimal_time)
        
        return jd
    except Exception as e:
        print(f"Error calculating Julian Day: {e}", file=sys.stderr)
        return None

def calculate_planetary_positions(jd):
    """Calculate planetary positions using Swiss Ephemeris"""
    positions = []
    
    try:
        for planet_name, planet_id in PLANETS.items():
            try:
                if planet_name == 'Ketu':
                    # Ketu is 180° opposite to Rahu
                    rahu_result = swe.calc_ut(jd, swe.MEAN_NODE)
                    tropical_lon = (rahu_result[0] + 180) % 360
                else:
                    # Calculate using Swiss Ephemeris
                    result = swe.calc_ut(jd, planet_id)
                    tropical_lon = result[0]
                
                # Apply KP Ayanamsa to get sidereal longitude
                sidereal_lon = (tropical_lon - KP_NEWCOMB_AYANAMSA) % 360
                if sidereal_lon < 0:
                    sidereal_lon += 360
                
                # Calculate sign and degrees
                sign_num = int(sidereal_lon // 30)
                degrees_in_sign = sidereal_lon % 30
                
                # Format degrees
                deg = int(degrees_in_sign)
                min_val = int((degrees_in_sign - deg) * 60)
                sec_val = int(((degrees_in_sign - deg) * 60 - min_val) * 60)
                
                # Determine house (simplified - would need ascendant for accurate house calculation)
                house = (sign_num % 12) + 1
                
                position = {
                    'planet': planet_name,
                    'longitude': round(sidereal_lon, 6),
                    'sign': SIGNS[sign_num],
                    'degree': f"{deg}° {min_val}' {sec_val}\"",
                    'degrees_in_sign': round(degrees_in_sign, 2),
                    'house': house,
                    'tropical_longitude': round(tropical_lon, 6)
                }
                
                positions.append(position)
                
            except Exception as e:
                print(f"Error calculating {planet_name}: {e}", file=sys.stderr)
                continue
        
        return positions
        
    except Exception as e:
        print(f"Error in planetary calculations: {e}", file=sys.stderr)
        return []

def main():
    if len(sys.argv) != 4:
        print("Usage: python3 planetary_calculator.py <date> <time> <place>", file=sys.stderr)
        print("Example: python3 planetary_calculator.py 1990-11-25 03:17:25 'Chennai, India'", file=sys.stderr)
        sys.exit(1)
    
    date_str = sys.argv[1]
    time_str = sys.argv[2]
    place = sys.argv[3]
    
    # Calculate Julian Day
    jd = calculate_julian_day(date_str, time_str)
    if jd is None:
        print(json.dumps({"error": "Failed to calculate Julian Day"}))
        sys.exit(1)
    
    # Calculate planetary positions
    positions = calculate_planetary_positions(jd)
    
    # Return JSON result
    result = {
        "success": True,
        "julian_day": jd,
        "birth_date": date_str,
        "birth_time": time_str,
        "birth_place": place,
        "ayanamsa": KP_NEWCOMB_AYANAMSA,
        "planetary_positions": positions
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
