#!/usr/bin/env python3
"""
Simple Swiss Ephemeris Test - Just get planetary positions
"""

import sys
import json
import swisseph as swe

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600  # Exactly 23° 43' 04" = 23.7177777778

# Planet IDs for Swiss Ephemeris
PLANETS = {
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
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

def main():
    # Birth details: 03/11/1990, 11:31:29 AM, Tamil Nadu
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    
    # Location coordinates
    latitude = 6 + 55/60 + 55/3600   # 6° 55' 55" N
    longitude = 79 + 50/60 + 52/3600  # 79° 50' 52" E
    place_name = "Tamil Nadu (6°55'55\"N, 79°50'52\"E)"
    
    # Calculate decimal time
    decimal_time = hour + minute/60 + second/3600
    
    # Calculate Julian Day
    jd = swe.julday(year, month, day, decimal_time)
    
    # Also calculate with IST timezone offset (+5:30 GMT)
    ist_offset = 5.5  # IST is UTC+5:30
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    print(f"Julian Day (Local Time): {jd}")
    print(f"Julian Day (UTC): {jd_utc}")
    print(f"Date: {year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}")
    print(f"Place: {place_name}")
    print(f"Coordinates: {latitude:.6f}°N, {longitude:.6f}°E")
    print(f"KP Ayanamsa: {KP_AYANAMSA:.10f}° (23° 43' 04\")")
    
    # Use UTC calculation (correct method)
    print(f"\nPLANETARY POSITIONS (UTC - Correct Method):")
    print("=" * 60)
    
    results = []
    
    for planet_name, planet_id in PLANETS.items():
        try:
            # Calculate using Swiss Ephemeris (UTC time)
            result = swe.calc_ut(jd_utc, planet_id)
            tropical_lon = result[0][0]  # First element of first tuple is longitude
            
            # Apply KP Ayanamsa to get sidereal longitude
            sidereal_lon = tropical_lon - KP_AYANAMSA
            if sidereal_lon < 0:
                sidereal_lon += 360
            
            # Calculate sign and degrees
            sign_num = int(sidereal_lon // 30)
            degrees_in_sign = sidereal_lon % 30
            
            # Format degrees
            deg = int(degrees_in_sign)
            min_val = int((degrees_in_sign - deg) * 60)
            sec_val = int(((degrees_in_sign - deg) * 60 - min_val) * 60)
            
            print(f"{planet_name:8}: {degrees_in_sign:6.2f}° in {SIGNS[sign_num]:12} ({deg:2d}° {min_val:2d}' {sec_val:2d}\")")
            
            results.append({
                'planet': planet_name,
                'sign': SIGNS[sign_num],
                'degrees': f"{deg:2d}° {min_val:2d}' {sec_val:2d}\"",
                'decimal_degrees': round(degrees_in_sign, 2),
                'sidereal_longitude': round(sidereal_lon, 6)
            })
            
        except Exception as e:
            print(f"Error calculating {planet_name}: {e}")
    
    # Add Ketu (180° opposite to Rahu)
    try:
        rahu_result = swe.calc_ut(jd_utc, swe.MEAN_NODE)
        rahu_tropical = rahu_result[0][0]  # First element of first tuple
        ketu_tropical = (rahu_tropical + 180) % 360
        
        ketu_sidereal = ketu_tropical - KP_AYANAMSA
        if ketu_sidereal < 0:
            ketu_sidereal += 360
            
        sign_num = int(ketu_sidereal // 30)
        degrees_in_sign = ketu_sidereal % 30
        
        deg = int(degrees_in_sign)
        min_val = int((degrees_in_sign - deg) * 60)
        sec_val = int(((degrees_in_sign - deg) * 60 - min_val) * 60)
        
        print(f"{'Ketu':8}: {degrees_in_sign:6.2f}° in {SIGNS[sign_num]:12} ({deg:2d}° {min_val:2d}' {sec_val:2d}\")")
        
        results.append({
            'planet': 'Ketu',
            'sign': SIGNS[sign_num],
            'degrees': f"{deg:2d}° {min_val:2d}' {sec_val:2d}\"",
            'decimal_degrees': round(degrees_in_sign, 2),
            'sidereal_longitude': round(ketu_sidereal, 6)
        })
        
    except Exception as e:
        print(f"Error calculating Ketu: {e}")
    
    print(f"\nJSON Output:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
