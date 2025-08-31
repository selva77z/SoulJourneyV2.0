#!/usr/bin/env python3
import sys
import json
from datetime import datetime, timedelta
import swisseph as swe

def calculate_kp_positions(birth_date, birth_time, latitude, longitude):
    """
    Calculate KP planetary positions using Swiss Ephemeris
    Args:
        birth_date: Date in YYYY-MM-DD format
        birth_time: Time in HH:MM:SS format
        latitude: Latitude in decimal degrees
        longitude: Longitude in decimal degrees
    """
    try:
        # Parse birth data
        year, month, day = map(int, birth_date.split('-'))
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
        
        # Set KP ayanamsa (23° 43' 07")
        kp_ayanamsa = 23.71861111  # 23° 43' 07" in decimal degrees
        swe.set_sid_mode(swe.SIDM_USER, 0, kp_ayanamsa)
        
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
        
        # Zodiac signs
        signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        
        # Calculate planetary positions
        results = []
        
        for planet_name, planet_id in planets.items():
            try:
                # Calculate geocentric position
                position = swe.calc_ut(julian_day, planet_id, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
                tropical_longitude = position[0][0]
                
                # Convert to sidereal longitude using KP ayanamsa
                sidereal_longitude = tropical_longitude
                
                # Normalize to 0-360 range
                while sidereal_longitude < 0:
                    sidereal_longitude += 360
                while sidereal_longitude >= 360:
                    sidereal_longitude -= 360
                
                # Determine sign and degree
                sign_index = int(sidereal_longitude // 30)
                degree_in_sign = sidereal_longitude % 30
                sign_name = signs[sign_index]
                
                # Calculate house (simplified - using equal house system for now)
                # In proper KP, this would use house cusps
                house = ((sign_index + 1) % 12) + 1
                
                # Add Ketu (opposite of Rahu)
                if planet_name == 'Rahu':
                    ketu_longitude = (sidereal_longitude + 180) % 360
                    ketu_sign_index = int(ketu_longitude // 30)
                    ketu_degree = ketu_longitude % 30
                    ketu_sign = signs[ketu_sign_index]
                    ketu_house = ((ketu_sign_index + 1) % 12) + 1
                    
                    results.append({
                        'name': 'Ketu',
                        'sign': ketu_sign,
                        'house': ketu_house,
                        'degree': int(ketu_degree),
                        'longitude': ketu_longitude
                    })
                
                results.append({
                    'name': planet_name,
                    'sign': sign_name,
                    'house': house,
                    'degree': int(degree_in_sign),
                    'longitude': sidereal_longitude
                })
                
            except Exception as e:
                print(f"Error calculating {planet_name}: {e}", file=sys.stderr)
                continue
        
        return results
        
    except Exception as e:
        print(f"Error in calculation: {e}", file=sys.stderr)
        return []

def main():
    """Main function to handle command line arguments and output JSON"""
    if len(sys.argv) != 5:
        print("Usage: python3 dynamic_swiss_kp.py <birth_date> <birth_time> <latitude> <longitude>", file=sys.stderr)
        sys.exit(1)
    
    birth_date = sys.argv[1]  # YYYY-MM-DD
    birth_time = sys.argv[2]  # HH:MM:SS
    latitude = float(sys.argv[3])
    longitude = float(sys.argv[4])
    
    # Calculate positions
    planets = calculate_kp_positions(birth_date, birth_time, latitude, longitude)
    
    # Output as JSON
    print(json.dumps(planets, indent=2))

if __name__ == "__main__":
    main()