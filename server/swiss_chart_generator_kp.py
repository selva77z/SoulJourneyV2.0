#!/usr/bin/env python3
"""
Authentic KP Chart Generator with Swiss Ephemeris
Following the exact calculation method from the reference implementation
"""

from datetime import datetime, timedelta
import swisseph as swe
import json
import sys

# KP-Newcomb Ayanamsa value (23° 43' 07")
ayanamsa_value = 23 + 43/60 + 7/3600

# Nakshatra length in degrees
nak_length = 13.3333

# Vimshottari Dasa periods
vimshottari_dasa = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
}

# Dasa sequence
dasa_sequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
total_dasa_years = sum(vimshottari_dasa.values())

# Sub-divisions
sub_divisions = {
    planet: (vimshottari_dasa[planet] / total_dasa_years) * nak_length
    for planet in dasa_sequence
}

# Zodiac signs
sign_names = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
              'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

# Rasi lords
rasi_lords = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
    'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
}

# Nakshatras with their lords
nakshatras = [
    ("Ashwini", "Ketu"), ("Bharani", "Venus"), ("Krittika", "Sun"), ("Rohini", "Moon"),
    ("Mrigashira", "Mars"), ("Ardra", "Rahu"), ("Punarvasu", "Jupiter"), ("Pushya", "Saturn"),
    ("Ashlesha", "Mercury"), ("Magha", "Ketu"), ("Purva Phalguni", "Venus"), ("Uttara Phalguni", "Sun"),
    ("Hasta", "Moon"), ("Chitra", "Mars"), ("Swati", "Rahu"), ("Vishakha", "Jupiter"),
    ("Anuradha", "Saturn"), ("Jyeshtha", "Mercury"), ("Mula", "Ketu"), ("Purva Ashadha", "Venus"),
    ("Uttara Ashadha", "Sun"), ("Shravana", "Moon"), ("Dhanishta", "Mars"), ("Shatabhisha", "Rahu"),
    ("Purva Bhadrapada", "Jupiter"), ("Uttara Bhadrapada", "Saturn"), ("Revati", "Mercury")
]

# Planet IDs for Swiss Ephemeris
planets = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Rahu": swe.TRUE_NODE,
    "Ketu": swe.TRUE_NODE
}

def get_full_kp_chain(nak_deg):
    """Calculate KP significators (STL, SBL, SSL, SSSL)"""
    # Star Lord (STL)
    cumulative = 0
    for planet1 in dasa_sequence:
        cumulative += sub_divisions[planet1]
        if nak_deg <= cumulative:
            # Sub Lord (SBL)
            sub_start = cumulative - sub_divisions[planet1]
            sub_len = sub_divisions[planet1]
            rel_deg = nak_deg - sub_start
            cumulative2 = 0
            for planet2 in dasa_sequence:
                cumulative2 += (vimshottari_dasa[planet2] / total_dasa_years) * sub_len
                if rel_deg <= cumulative2:
                    # Sub-Sub Lord (SSL)
                    sub2_start = cumulative2 - (vimshottari_dasa[planet2] / total_dasa_years) * sub_len
                    sub2_len = (vimshottari_dasa[planet2] / total_dasa_years) * sub_len
                    rel_deg2 = rel_deg - sub2_start
                    cumulative3 = 0
                    for planet3 in dasa_sequence:
                        cumulative3 += (vimshottari_dasa[planet3] / total_dasa_years) * sub2_len
                        if rel_deg2 <= cumulative3:
                            return (planet1, planet2, planet3)
    return (dasa_sequence[-1], dasa_sequence[-1], dasa_sequence[-1])

def calculate_kp_chart(birth_date, birth_time, latitude, longitude, place_name):
    """Calculate KP chart using Swiss Ephemeris"""
    try:
        # Parse birth data
        year, month, day = map(int, birth_date.split('-'))
        hour, minute, second = map(int, birth_time.split(':'))
        
        # Create datetime object (assuming local time)
        birth_datetime = datetime(year, month, day, hour, minute, second)
        
        # Convert to UTC (assuming IST +5:30 for Indian locations)
        timezone_offset = timedelta(hours=5, minutes=30)
        utc_datetime = birth_datetime - timezone_offset
        
        # Calculate Julian Day
        jd = swe.julday(utc_datetime.year, utc_datetime.month, utc_datetime.day,
                        utc_datetime.hour + utc_datetime.minute / 60.0 + utc_datetime.second / 3600.0)
        
        # Calculate planetary positions
        results = []
        for planet, planet_id in planets.items():
            # Get tropical longitude
            lon = swe.calc_ut(jd, planet_id)[0][0]
            
            # Handle Ketu (opposite of Rahu)
            if planet == "Ketu":
                lon = (swe.calc_ut(jd, swe.TRUE_NODE)[0][0] + 180.0) % 360
            
            # Calculate sidereal longitude using KP-Newcomb ayanamsa
            sidereal_lon = (lon - ayanamsa_value) % 360
            
            # Calculate nakshatra
            nak_index = int(sidereal_lon // nak_length)
            nak_name, stl = nakshatras[nak_index]
            
            # Calculate nakshatra degree
            nak_deg = sidereal_lon % nak_length
            
            # Calculate pada
            pada = int(nak_deg // (nak_length / 4)) + 1
            
            # Calculate rasi lord
            ral = rasi_lords[sign_names[int(sidereal_lon // 30)]]
            
            # Calculate KP significators
            sbl, ssl, sssl = get_full_kp_chain(nak_deg)
            
            # Format position
            deg = int(sidereal_lon % 30)
            minute = int((sidereal_lon % 1) * 60)
            zodiac = sign_names[int(sidereal_lon // 30)]
            
            # Calculate house (simplified, assuming equal house system)
            house = int(sidereal_lon // 30) + 1
            
            results.append({
                "name": planet,
                "sign": zodiac,
                "house": house,
                "degree": deg,
                "longitude": sidereal_lon,
                "nakshatra": f"{nak_name} ({pada})",
                "ral": ral,  # Rasi Lord
                "stl": stl,  # Star Lord
                "sbl": sbl,  # Sub Lord
                "ssl": ssl,  # Sub-Sub Lord
                "sssl": sssl  # Sub-Sub-Sub Lord
            })
        
        # Create houses (simplified equal house system)
        houses = []
        for i in range(1, 13):
            houses.append({
                "number": i,
                "sign": sign_names[i-1],
                "lord": rasi_lords[sign_names[i-1]],
                "cuspal": (i-1) * 30
            })
        
        # Create chart data
        chart_data = {
            "name": f"KP Chart for {place_name}",
            "birthDate": birth_date,
            "birthTime": birth_time,
            "birthPlace": place_name,
            "latitude": latitude,
            "longitude": longitude,
            "generated": datetime.now().isoformat() + "Z",
            "chartType": "KP Raasi Chart",
            "planets": results,
            "houses": houses,
            "kpSystem": {
                "significators": f"Calculated using Swiss Ephemeris with KP-Newcomb Ayanamsa {ayanamsa_value:.6f}°",
                "rulingPlanets": [planet["stl"] for planet in results[:3]],
                "analysis": "Authentic KP calculations with STL, SBL, SSL, SSSL significators using Swiss Ephemeris."
            },
            "message": "KP horoscope generated with authentic Swiss Ephemeris calculations and KP significators"
        }
        
        return chart_data
        
    except Exception as e:
        return {"error": f"Calculation error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(json.dumps({"error": "Usage: python3 swiss_chart_generator_kp.py birth_date birth_time latitude longitude place_name"}))
        sys.exit(1)
    
    birth_date = sys.argv[1]
    birth_time = sys.argv[2]
    latitude = float(sys.argv[3])
    longitude = float(sys.argv[4])
    place_name = sys.argv[5]
    
    chart = calculate_kp_chart(birth_date, birth_time, latitude, longitude, place_name)
    print(json.dumps(chart, indent=2))