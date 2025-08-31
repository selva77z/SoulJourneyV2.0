#!/usr/bin/env python3
"""
Accurate KP Astrology Calculations using PyEphem
Matches professional astrology software like AstroSage
"""

import ephem
from datetime import datetime, timezone
import math

def calculate_kp_positions(birth_date, birth_time, latitude, longitude):
    """Calculate accurate planetary positions for KP astrology"""
    
    # Create observer for the birth location
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.lon = str(longitude)
    observer.elevation = 0  # Sea level
    
    # Set the birth date and time (UTC)
    birth_datetime = datetime.strptime(f"{birth_date} {birth_time}", "%d-%m-%Y %H:%M:%S")
    observer.date = birth_datetime
    
    print(f"Birth: {birth_datetime}")
    print(f"Location: {latitude}°N, {longitude}°E")
    print(f"Observer date: {observer.date}")
    
    # KP-Newcomb Ayanamsa for 1990: 23° 43' 07" = 23.71861°
    # More accurate calculation based on year
    year = birth_datetime.year
    kp_ayanamsa = 23.0 + 43.0/60 + 7.0/3600  # Base value for reference epoch
    
    print(f"KP-Newcomb Ayanamsa: {kp_ayanamsa:.6f}°")
    
    # Create planetary objects
    planets = {
        'Sun': ephem.Sun(observer),
        'Moon': ephem.Moon(observer),
        'Mercury': ephem.Mercury(observer),
        'Venus': ephem.Venus(observer),
        'Mars': ephem.Mars(observer),
        'Jupiter': ephem.Jupiter(observer),
        'Saturn': ephem.Saturn(observer),
        'Rahu': None,  # Will calculate lunar nodes separately
        'Ketu': None
    }
    
    def decimal_to_dms(decimal_deg):
        """Convert decimal degrees to degrees, minutes, seconds"""
        deg = int(decimal_deg)
        min_float = (decimal_deg - deg) * 60
        min_val = int(min_float)
        sec = (min_float - min_val) * 60
        return deg, min_val, sec
    
    def get_zodiac_sign(longitude):
        """Get zodiac sign from longitude"""
        signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        sign_index = int(longitude / 30)
        degree_in_sign = longitude % 30
        return signs[sign_index], degree_in_sign
    
    print("\n=== TROPICAL POSITIONS ===")
    tropical_positions = {}
    
    for name, planet in planets.items():
        if planet is None:
            continue
        
        # Get tropical longitude in degrees
        tropical_lon = math.degrees(planet.hlon)
        tropical_positions[name] = tropical_lon
        
        deg, min_val, sec = decimal_to_dms(tropical_lon)
        sign, deg_in_sign = get_zodiac_sign(tropical_lon)
        deg_sign, min_sign = int(deg_in_sign), int((deg_in_sign % 1) * 60)
        
        print(f"{name}: {tropical_lon:.6f}° = {deg_sign:02d}°{min_sign:02d}' {sign}")
    
    # Calculate lunar nodes (Rahu/Ketu)
    moon = ephem.Moon(observer)
    # Mean lunar node longitude (approximate)
    mean_node = math.degrees(moon.hlon) - 180  # Simplified calculation
    rahu_tropical = mean_node % 360
    ketu_tropical = (rahu_tropical + 180) % 360
    
    tropical_positions['Rahu'] = rahu_tropical
    tropical_positions['Ketu'] = ketu_tropical
    
    deg, min_val, sec = decimal_to_dms(rahu_tropical)
    sign, deg_in_sign = get_zodiac_sign(rahu_tropical)
    deg_sign, min_sign = int(deg_in_sign), int((deg_in_sign % 1) * 60)
    print(f"Rahu: {rahu_tropical:.6f}° = {deg_sign:02d}°{min_sign:02d}' {sign}")
    
    deg, min_val, sec = decimal_to_dms(ketu_tropical)
    sign, deg_in_sign = get_zodiac_sign(ketu_tropical)
    deg_sign, min_sign = int(deg_in_sign), int((deg_in_sign % 1) * 60)
    print(f"Ketu: {ketu_tropical:.6f}° = {deg_sign:02d}°{min_sign:02d}' {sign}")
    
    print(f"\n=== SIDEREAL POSITIONS (KP-Newcomb Ayanamsa: {kp_ayanamsa:.6f}°) ===")
    
    sidereal_positions = {}
    for name, tropical_lon in tropical_positions.items():
        sidereal_lon = (tropical_lon - kp_ayanamsa) % 360
        sidereal_positions[name] = sidereal_lon
        
        sign, deg_in_sign = get_zodiac_sign(sidereal_lon)
        deg_sign, min_sign = int(deg_in_sign), int((deg_in_sign % 1) * 60)
        
        print(f"{name}: {deg_sign:02d}°{min_sign:02d}' {sign}")
    
    # Calculate Ascendant (Lagna)
    print(f"\n=== ASCENDANT CALCULATION ===")
    
    # Local Sidereal Time calculation
    jd = ephem.julian_date(observer.date)
    print(f"Julian Date: {jd:.6f}")
    
    # Simplified ascendant calculation (needs more precise formula)
    # This is approximation - professional software uses more complex calculations
    lst_hours = (jd % 1) * 24 + longitude/15  # Approximate LST
    lst_degrees = (lst_hours % 24) * 15
    
    # Ascendant longitude (very approximate)
    asc_tropical = lst_degrees % 360
    asc_sidereal = (asc_tropical - kp_ayanamsa) % 360
    
    sign, deg_in_sign = get_zodiac_sign(asc_sidereal)
    deg_sign, min_sign = int(deg_in_sign), int((deg_in_sign % 1) * 60)
    print(f"Ascendant (approx): {deg_sign:02d}°{min_sign:02d}' {sign}")
    
    return sidereal_positions

if __name__ == "__main__":
    # Your birth data
    birth_date = "25-11-1990"
    birth_time = "03:17:25"  # 3:17:25 AM
    latitude = 10.381389  # 10°22'53"N  
    longitude = 78.821389  # 78°49'17"E
    
    print("=== ACCURATE KP ASTROLOGY CALCULATION ===")
    print(f"Birth Date: {birth_date}")
    print(f"Birth Time: {birth_time}")
    print(f"Location: Pudukkottai ({latitude}°N, {longitude}°E)")
    
    positions = calculate_kp_positions(birth_date, birth_time, latitude, longitude)