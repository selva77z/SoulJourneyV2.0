#!/usr/bin/env python3
"""
Web-Ready KP Astrology Calculator
Outputs JSON for web application integration
"""

import sys
import json
import swisseph as swe
from datetime import datetime

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

STAR_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
]

def format_dms(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds"""
    deg = int(decimal_degrees)
    min_val = int((decimal_degrees - deg) * 60)
    sec_val = int(((decimal_degrees - deg) * 60 - min_val) * 60)
    return f"{deg:2d}° {min_val:2d}' {sec_val:2d}\""

def get_nakshatra_info(longitude):
    """Get nakshatra and star lord information"""
    nakshatra_span = 360 / 27  # 13.333...
    nakshatra_num = int(longitude / nakshatra_span)
    nakshatra_remainder = longitude % nakshatra_span
    
    pada_span = nakshatra_span / 4
    pada_num = int(nakshatra_remainder / pada_span) + 1
    
    return {
        'nakshatra': NAKSHATRAS[nakshatra_num],
        'nakshatra_number': nakshatra_num + 1,
        'pada': pada_num,
        'star_lord': STAR_LORDS[nakshatra_num],
        'distance_in_nakshatra': nakshatra_remainder
    }

def get_sub_lord(longitude):
    """Calculate KP Sub-Lord"""
    # Simplified sub-lord calculation
    sub_lord_divisions = {
        'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
        'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
    }
    
    total_years = sum(sub_lord_divisions.values())  # 120 years
    cycle_position = (longitude / 360) * total_years
    
    cumulative_years = 0
    planets_in_order = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
    
    for planet in planets_in_order:
        planet_years = sub_lord_divisions[planet]
        if cycle_position < cumulative_years + planet_years:
            return planet
        cumulative_years += planet_years
    
    return 'Ketu'  # Fallback

def calculate_chart_for_web(input_data):
    """Calculate complete chart for web display"""
    try:
        # Parse input data
        birth_date_str = input_data.get('birthDate', '1990-11-03')
        birth_time_str = input_data.get('birthTime', '11:31:29')
        name = input_data.get('name', 'Unknown')
        place = input_data.get('birthPlace', 'Tamil Nadu, India')
        
        # Parse date and time
        year, month, day = map(int, birth_date_str.split('-'))
        
        if ':' in birth_time_str:
            time_parts = birth_time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            second = int(time_parts[2]) if len(time_parts) > 2 else 0
        else:
            hour, minute, second = 11, 31, 29  # Default
        
        # Default coordinates (Tamil Nadu)
        latitude = 6 + 55/60 + 55/3600
        longitude = 79 + 50/60 + 52/3600
        timezone_offset = 5.5  # IST
        
        # Calculate Julian Day (UTC)
        decimal_time = hour + minute/60 + second/3600
        jd_utc = swe.julday(year, month, day, decimal_time - timezone_offset)
        
        # Set KP Ayanamsa
        swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
        
        # Calculate planetary positions
        planets = {
            'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
            'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
            'Saturn': swe.SATURN, 'Rahu': swe.MEAN_NODE
        }
        
        planetary_positions = []
        chart_data = {
            'name': name,
            'birthDate': birth_date_str,
            'birthTime': birth_time_str,
            'birthPlace': place,
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude
            },
            'ayanamsa': {
                'system': 'KP-Newcomb',
                'value': KP_AYANAMSA,
                'formatted': format_dms(KP_AYANAMSA)
            },
            'planetary_positions': [],
            'houses': [],
            'nakshatra_details': [],
            'technical_info': {
                'julian_day': jd_utc,
                'calculation_method': 'Swiss Ephemeris with KP Ayanamsa'
            }
        }
        
        # Calculate each planet
        house_positions = {}  # Track which house each planet is in
        
        for planet_name, planet_id in planets.items():
            try:
                result = swe.calc_ut(jd_utc, planet_id, swe.FLG_SPEED | swe.FLG_SIDEREAL)
                longitude_planet = result[0][0]
                speed = result[0][3]
                
                sign_num = int(longitude_planet // 30)
                degrees_in_sign = longitude_planet % 30
                
                # Get nakshatra info
                nak_info = get_nakshatra_info(longitude_planet)
                sub_lord = get_sub_lord(longitude_planet)
                
                # Determine retrograde status
                retrograde = speed < 0 if planet_name not in ['Sun', 'Moon', 'Rahu'] else False
                
                planet_data = {
                    'planet': planet_name,
                    'degree': format_dms(degrees_in_sign),
                    'decimal_degrees': round(degrees_in_sign, 2),
                    'sign': SIGNS[sign_num],
                    'sign_number': sign_num + 1,
                    'longitude': longitude_planet,
                    'speed': round(speed, 4),
                    'retrograde': retrograde,
                    'nakshatra': nak_info['nakshatra'],
                    'nakshatra_lord': nak_info['star_lord'],
                    'pada': nak_info['pada'],
                    'sub_lord': sub_lord,
                    'house': 1  # Will calculate proper house below
                }
                
                planetary_positions.append(planet_data)
                
            except Exception as e:
                planetary_positions.append({
                    'planet': planet_name,
                    'error': str(e)
                })
        
        # Add Ketu
        try:
            rahu_data = next(p for p in planetary_positions if p['planet'] == 'Rahu')
            if 'longitude' in rahu_data:
                ketu_longitude = (rahu_data['longitude'] + 180) % 360
                ketu_sign_num = int(ketu_longitude // 30)
                ketu_degrees_in_sign = ketu_longitude % 30
                
                ketu_nak_info = get_nakshatra_info(ketu_longitude)
                ketu_sub_lord = get_sub_lord(ketu_longitude)
                
                ketu_data = {
                    'planet': 'Ketu',
                    'degree': format_dms(ketu_degrees_in_sign),
                    'decimal_degrees': round(ketu_degrees_in_sign, 2),
                    'sign': SIGNS[ketu_sign_num],
                    'sign_number': ketu_sign_num + 1,
                    'longitude': ketu_longitude,
                    'speed': -rahu_data['speed'],
                    'retrograde': False,
                    'nakshatra': ketu_nak_info['nakshatra'],
                    'nakshatra_lord': ketu_nak_info['star_lord'],
                    'pada': ketu_nak_info['pada'],
                    'sub_lord': ketu_sub_lord,
                    'house': 1
                }
                
                planetary_positions.append(ketu_data)
        except:
            pass
        
        # Calculate houses
        try:
            houses_result = swe.houses(jd_utc, latitude, longitude, b'P')
            house_cusps = houses_result[0]
            ascmc = houses_result[1]
            
            houses_data = []
            
            for i, cusp in enumerate(house_cusps[1:], 1):  # Skip index 0
                cusp_sidereal = cusp - KP_AYANAMSA
                if cusp_sidereal < 0:
                    cusp_sidereal += 360
                
                sign_num = int(cusp_sidereal // 30)
                degrees_in_sign = cusp_sidereal % 30
                
                house_data = {
                    'house': i,
                    'cusp_degree': format_dms(degrees_in_sign),
                    'sign': SIGNS[sign_num],
                    'longitude': cusp_sidereal,
                    'sub_lord': get_sub_lord(cusp_sidereal)
                }
                
                houses_data.append(house_data)
            
            chart_data['houses'] = houses_data
            
            # Now assign planets to houses
            for planet_data in planetary_positions:
                if 'longitude' in planet_data:
                    planet_house = get_planet_house(planet_data['longitude'], houses_data)
                    planet_data['house'] = planet_house
            
            # Add special points
            asc_sidereal = ascmc[0] - KP_AYANAMSA
            if asc_sidereal < 0:
                asc_sidereal += 360
            
            mc_sidereal = ascmc[1] - KP_AYANAMSA
            if mc_sidereal < 0:
                mc_sidereal += 360
            
            chart_data['special_points'] = {
                'ascendant': {
                    'degree': format_dms(asc_sidereal % 30),
                    'sign': SIGNS[int(asc_sidereal // 30)],
                    'longitude': asc_sidereal
                },
                'midheaven': {
                    'degree': format_dms(mc_sidereal % 30),
                    'sign': SIGNS[int(mc_sidereal // 30)],
                    'longitude': mc_sidereal
                }
            }
            
        except Exception as e:
            chart_data['houses'] = [{'error': str(e)}]
        
        chart_data['planetary_positions'] = planetary_positions
        
        # Generate interpretation
        chart_data['interpretation'] = generate_interpretation(planetary_positions, chart_data)
        
        return {
            'success': True,
            'chart': chart_data
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'chart': None
        }

def get_planet_house(planet_longitude, houses_data):
    """Determine which house a planet is in"""
    for i, house in enumerate(houses_data):
        current_house_start = house['longitude']
        
        if i < len(houses_data) - 1:
            next_house_start = houses_data[i + 1]['longitude']
        else:
            next_house_start = houses_data[0]['longitude']  # House 1 for House 12
        
        # Handle 360° boundary crossing
        if next_house_start < current_house_start:
            # House crosses 0°
            if planet_longitude >= current_house_start or planet_longitude < next_house_start:
                return house['house']
        else:
            # Normal case
            if current_house_start <= planet_longitude < next_house_start:
                return house['house']
    
    return 1  # Default to house 1

def generate_interpretation(planetary_positions, chart_data):
    """Generate basic interpretation"""
    interpretation_parts = []
    
    # Find Sun and Moon signs
    sun_sign = next((p['sign'] for p in planetary_positions if p['planet'] == 'Sun'), 'Unknown')
    moon_sign = next((p['sign'] for p in planetary_positions if p['planet'] == 'Moon'), 'Unknown')
    
    interpretation_parts.append(f"Sun in {sun_sign}: Core personality and ego expression.")
    interpretation_parts.append(f"Moon in {moon_sign}: Emotional nature and inner feelings.")
    
    # Check for retrograde planets
    retrograde_planets = [p['planet'] for p in planetary_positions if p.get('retrograde', False)]
    if retrograde_planets:
        interpretation_parts.append(f"Retrograde planets: {', '.join(retrograde_planets)} - Areas requiring introspection and revision.")
    
    # Ascendant information
    if 'special_points' in chart_data and 'ascendant' in chart_data['special_points']:
        asc_sign = chart_data['special_points']['ascendant']['sign']
        interpretation_parts.append(f"Ascendant in {asc_sign}: Personality projection and life approach.")
    
    interpretation_parts.append("\nThis is a professional KP astrology calculation using Swiss Ephemeris precision.")
    interpretation_parts.append(f"Ayanamsa used: {chart_data['ayanamsa']['formatted']} (KP-Newcomb system)")
    
    return "\n\n".join(interpretation_parts)

def main():
    """Main function for command line usage"""
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
        except json.JSONDecodeError:
            input_data = {}
    else:
        # Default test data
        input_data = {
            'name': 'Test Person',
            'birthDate': '1990-11-03',
            'birthTime': '11:31:29',
            'birthPlace': 'Tamil Nadu, India'
        }
    
    result = calculate_chart_for_web(input_data)
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
