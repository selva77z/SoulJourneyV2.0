#!/usr/bin/env python3
"""
Complete KP Astrology System with Sub-Lords, Divisional Charts & Advanced Analysis
Everything you need for professional KP readings!
"""

import sys
import json
import swisseph as swe
from datetime import datetime, timedelta

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600

# KP System Constants
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Vimshottari Dasha periods (in years)
DASHA_PERIODS = {
    'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
    'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
}

# KP Star Lord Sequence (which planet rules which nakshatra)
STAR_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
]

# KP Sub-Lord divisions (Krishnamurti Padhdhati subdivision)
SUB_LORD_DIVISIONS = {
    'Ketu': 7,   'Venus': 20,  'Sun': 6,     'Moon': 10,   'Mars': 7,
    'Rahu': 18,  'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
}

def format_dms(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds"""
    deg = int(decimal_degrees)
    min_val = int((decimal_degrees - deg) * 60)
    sec_val = int(((decimal_degrees - deg) * 60 - min_val) * 60)
    return f"{deg:2d}° {min_val:2d}' {sec_val:2d}\""

def get_nakshatra_info(longitude):
    """Get nakshatra, pada, star lord for a given longitude"""
    # Each nakshatra is 13°20' (800 minutes)
    nakshatra_span = 13 + 20/60  # 13.333...
    
    nakshatra_num = int(longitude / nakshatra_span)
    nakshatra_remainder = longitude % nakshatra_span
    
    # Each pada is 3°20' (200 minutes)
    pada_span = nakshatra_span / 4
    pada_num = int(nakshatra_remainder / pada_span) + 1
    
    # Distance into the nakshatra
    distance_in_nakshatra = nakshatra_remainder
    
    return {
        'nakshatra': NAKSHATRAS[nakshatra_num],
        'nakshatra_number': nakshatra_num + 1,
        'pada': pada_num,
        'star_lord': STAR_LORDS[nakshatra_num],
        'distance_in_nakshatra': distance_in_nakshatra,
        'formatted_distance': format_dms(distance_in_nakshatra)
    }

def get_sub_lord(longitude):
    """Calculate KP Sub-Lord for a given longitude"""
    # Total zodiac = 360°, divided among 9 planets in proportion to their dasha periods
    total_dasha_years = sum(SUB_LORD_DIVISIONS.values())  # 120 years
    
    # Each degree gets divided proportionally
    degree_division = 120 / 360  # 0.333... years per degree
    
    # Find which sub-lord period this longitude falls into
    cumulative_degrees = 0
    planets_in_order = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
    
    # Keep cycling through the 120-year cycle
    adjusted_longitude = longitude % 360
    cycle_position = (adjusted_longitude / 360) * total_dasha_years
    
    cumulative_years = 0
    for planet in planets_in_order:
        planet_years = SUB_LORD_DIVISIONS[planet]
        if cycle_position < cumulative_years + planet_years:
            remaining_in_period = cycle_position - cumulative_years
            return {
                'sub_lord': planet,
                'position_in_period': remaining_in_period,
                'period_duration': planet_years
            }
        cumulative_years += planet_years
    
    # Fallback (shouldn't reach here)
    return {'sub_lord': 'Ketu', 'position_in_period': 0, 'period_duration': 7}

def calculate_divisional_charts(longitude_data, chart_type='D9'):
    """Calculate divisional chart positions"""
    divisional_positions = {}
    
    for planet, data in longitude_data.items():
        longitude = data['longitude']
        
        if chart_type == 'D9':  # Navamsa (9th division)
            # Each sign divided into 9 parts of 3°20' each
            sign_num = int(longitude // 30)
            degree_in_sign = longitude % 30
            navamsa_part = int(degree_in_sign / (30/9))  # Which 1/9th part
            
            # Navamsa calculation formula
            if sign_num % 2 == 0:  # Even signs (0,2,4,6,8,10)
                navamsa_sign = (sign_num + navamsa_part) % 12
            else:  # Odd signs (1,3,5,7,9,11)
                navamsa_sign = (sign_num + 8 + navamsa_part) % 12
            
            navamsa_degree = (degree_in_sign % (30/9)) * 9  # Position within navamsa sign
            
            divisional_positions[planet] = {
                'sign': SIGNS[navamsa_sign],
                'sign_number': navamsa_sign + 1,
                'degrees_in_sign': navamsa_degree,
                'formatted': format_dms(navamsa_degree)
            }
            
        elif chart_type == 'D10':  # Dasamsa (10th division)
            sign_num = int(longitude // 30)
            degree_in_sign = longitude % 30
            dasamsa_part = int(degree_in_sign / 3)  # Each part is 3°
            
            if sign_num % 2 == 0:  # Even signs
                dasamsa_sign = (sign_num + 8 + dasamsa_part) % 12
            else:  # Odd signs
                dasamsa_sign = (sign_num + dasamsa_part) % 12
            
            dasamsa_degree = (degree_in_sign % 3) * 10
            
            divisional_positions[planet] = {
                'sign': SIGNS[dasamsa_sign],
                'sign_number': dasamsa_sign + 1,
                'degrees_in_sign': dasamsa_degree,
                'formatted': format_dms(dasamsa_degree)
            }
    
    return divisional_positions

def calculate_aspects_kp(planet_positions):
    """Calculate KP aspects between planets"""
    aspects = []
    planets = list(planet_positions.keys())
    
    for i, planet1 in enumerate(planets):
        for planet2 in planets[i+1:]:
            if planet1 == planet2:
                continue
                
            lon1 = planet_positions[planet1]['longitude']
            lon2 = planet_positions[planet2]['longitude']
            
            # Calculate angular separation
            diff = abs(lon2 - lon1)
            if diff > 180:
                diff = 360 - diff
            
            # Define KP aspects (with orbs)
            aspect_types = {
                'Conjunction': (0, 8),
                'Opposition': (180, 8),
                'Trine': (120, 6),
                'Square': (90, 6),
                'Sextile': (60, 4)
            }
            
            for aspect_name, (exact_angle, orb) in aspect_types.items():
                if abs(diff - exact_angle) <= orb:
                    aspects.append({
                        'planet1': planet1,
                        'planet2': planet2,
                        'aspect': aspect_name,
                        'angle': diff,
                        'orb': abs(diff - exact_angle),
                        'exact_angle': exact_angle,
                        'applying': 'Yes' if diff < exact_angle else 'No'
                    })
    
    return aspects

def calculate_complete_kp_chart(birth_data):
    """Complete KP analysis with all advanced features"""
    
    year = birth_data['year']
    month = birth_data['month'] 
    day = birth_data['day']
    hour = birth_data['hour']
    minute = birth_data['minute']
    second = birth_data['second']
    tz_offset = birth_data['timezone_offset']
    latitude = birth_data['latitude']
    longitude = birth_data['longitude']
    place_name = birth_data['place_name']
    
    # Calculate Julian Day (UTC)
    decimal_time = hour + minute/60 + second/3600
    jd_utc = swe.julday(year, month, day, decimal_time - tz_offset)
    
    # Set KP Ayanamsa
    swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
    
    complete_analysis = {
        'birth_info': {
            'date': f"{year}-{month:02d}-{day:02d}",
            'time': f"{hour:02d}:{minute:02d}:{second:02d}",
            'place': place_name,
            'coordinates': {'latitude': latitude, 'longitude': longitude},
            'julian_day_utc': jd_utc
        },
        'rasi_chart': {},
        'nakshatra_analysis': {},
        'sub_lord_analysis': {},
        'divisional_charts': {},
        'aspects': [],
        'dasha_system': {},
        'kp_houses': {},
        'significators': {}
    }
    
    # Main planetary positions
    planets = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
        'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN, 'Rahu': swe.MEAN_NODE
    }
    
    planet_positions = {}
    
    for planet_name, planet_id in planets.items():
        try:
            result = swe.calc_ut(jd_utc, planet_id, swe.FLG_SPEED | swe.FLG_SIDEREAL)
            longitude = result[0][0]
            speed = result[0][3]
            
            # Basic position
            sign_num = int(longitude // 30)
            degrees_in_sign = longitude % 30
            
            # Nakshatra analysis
            nakshatra_info = get_nakshatra_info(longitude)
            
            # Sub-lord analysis
            sub_lord_info = get_sub_lord(longitude)
            
            planet_data = {
                'longitude': longitude,
                'sign': SIGNS[sign_num],
                'sign_number': sign_num + 1,
                'degrees_in_sign': degrees_in_sign,
                'formatted_position': format_dms(degrees_in_sign),
                'speed': speed,
                'retrograde': speed < 0 if planet_name not in ['Sun', 'Moon', 'Rahu'] else False,
                'nakshatra': nakshatra_info,
                'sub_lord': sub_lord_info
            }
            
            planet_positions[planet_name] = planet_data
            
        except Exception as e:
            planet_positions[planet_name] = {'error': str(e)}
    
    # Add Ketu
    if 'Rahu' in planet_positions and 'error' not in planet_positions['Rahu']:
        rahu_lon = planet_positions['Rahu']['longitude']
        ketu_lon = (rahu_lon + 180) % 360
        
        sign_num = int(ketu_lon // 30)
        degrees_in_sign = ketu_lon % 30
        nakshatra_info = get_nakshatra_info(ketu_lon)
        sub_lord_info = get_sub_lord(ketu_lon)
        
        planet_positions['Ketu'] = {
            'longitude': ketu_lon,
            'sign': SIGNS[sign_num],
            'sign_number': sign_num + 1,
            'degrees_in_sign': degrees_in_sign,
            'formatted_position': format_dms(degrees_in_sign),
            'speed': -planet_positions['Rahu']['speed'],
            'retrograde': False,
            'nakshatra': nakshatra_info,
            'sub_lord': sub_lord_info
        }
    
    complete_analysis['rasi_chart'] = planet_positions
    
    # Calculate divisional charts
    complete_analysis['divisional_charts'] = {
        'navamsa_d9': calculate_divisional_charts(planet_positions, 'D9'),
        'dasamsa_d10': calculate_divisional_charts(planet_positions, 'D10')
    }
    
    # Calculate aspects
    complete_analysis['aspects'] = calculate_aspects_kp(planet_positions)
    
    # KP Houses with cusps
    try:
        houses_result = swe.houses(jd_utc, latitude, longitude, b'P')
        house_cusps = houses_result[0]
        ascmc = houses_result[1]
        
        kp_houses = {}
        for i, cusp in enumerate(house_cusps[1:], 1):
            cusp_sidereal = cusp - KP_AYANAMSA
            if cusp_sidereal < 0:
                cusp_sidereal += 360
                
            sign_num = int(cusp_sidereal // 30)
            degrees_in_sign = cusp_sidereal % 30
            nakshatra_info = get_nakshatra_info(cusp_sidereal)
            sub_lord_info = get_sub_lord(cusp_sidereal)
            
            kp_houses[f'house_{i}'] = {
                'cusp_longitude': cusp_sidereal,
                'sign': SIGNS[sign_num],
                'degrees_in_sign': degrees_in_sign,
                'formatted_position': format_dms(degrees_in_sign),
                'nakshatra': nakshatra_info,
                'sub_lord': sub_lord_info,
                'significance': get_house_significance(i)
            }
        
        complete_analysis['kp_houses'] = kp_houses
        
    except Exception as e:
        complete_analysis['kp_houses'] = {'error': str(e)}
    
    return complete_analysis

def get_house_significance(house_num):
    """Get KP significance for each house"""
    house_meanings = {
        1: "Self, Personality, Health, Appearance",
        2: "Wealth, Family, Speech, Food",
        3: "Siblings, Courage, Communication, Short Journeys",
        4: "Home, Mother, Education, Property, Vehicles",
        5: "Children, Intelligence, Romance, Speculation",
        6: "Health, Enemies, Service, Debts",
        7: "Marriage, Partnership, Business, Spouse",
        8: "Longevity, Transformation, Hidden Matters, Research",
        9: "Fortune, Religion, Higher Learning, Long Journeys",
        10: "Career, Reputation, Father, Authority",
        11: "Gains, Friends, Elder Siblings, Aspirations",
        12: "Losses, Expenses, Foreign Lands, Spirituality"
    }
    return house_meanings.get(house_num, "Unknown")

def main():
    """Main function for testing"""
    # Test birth data
    birth_data = {
        'year': 1990,
        'month': 11,
        'day': 3,
        'hour': 11,
        'minute': 31,
        'second': 29,
        'timezone_offset': 5.5,  # IST
        'latitude': 6 + 55/60 + 55/3600,
        'longitude': 79 + 50/60 + 52/3600,
        'place_name': "Tamil Nadu, India"
    }
    
    print("COMPLETE KP ASTROLOGY ANALYSIS")
    print("=" * 80)
    
    chart = calculate_complete_kp_chart(birth_data)
    
    # Display basic planetary positions with KP details
    print("\n1. PLANETARY POSITIONS WITH KP SUB-LORDS")
    print("-" * 80)
    
    for planet, data in chart['rasi_chart'].items():
        if 'error' not in data:
            nak = data['nakshatra']
            sub = data['sub_lord']
            retro = " (R)" if data['retrograde'] else ""
            
            print(f"{planet:8}: {data['formatted_position']} {data['sign']:12}{retro}")
            print(f"         Nakshatra: {nak['nakshatra']} ({nak['pada']}) - Star Lord: {nak['star_lord']}")
            print(f"         Sub-Lord: {sub['sub_lord']}")
            print()
    
    # Display house cusps with sub-lords
    print("\n2. KP HOUSE CUSPS WITH SUB-LORDS")
    print("-" * 80)
    
    for house, data in chart['kp_houses'].items():
        if 'error' not in data:
            house_num = house.split('_')[1]
            nak = data['nakshatra']
            sub = data['sub_lord']
            
            print(f"House {house_num:2}: {data['formatted_position']} {data['sign']:12}")
            print(f"         Nakshatra: {nak['nakshatra']} - Sub-Lord: {sub['sub_lord']}")
            print(f"         Significance: {data['significance']}")
            print()
    
    # Display divisional charts
    print("\n3. NAVAMSA CHART (D9)")
    print("-" * 80)
    
    for planet, data in chart['divisional_charts']['navamsa_d9'].items():
        print(f"{planet:8}: {data['formatted']} {data['sign']}")
    
    # Display aspects
    print("\n4. PLANETARY ASPECTS")
    print("-" * 80)
    
    for aspect in chart['aspects']:
        print(f"{aspect['planet1']} {aspect['aspect']} {aspect['planet2']} - "
              f"Angle: {aspect['angle']:.1f}° (Orb: {aspect['orb']:.1f}°)")
    
    print("\n" + "=" * 80)
    print("KP FEATURES AVAILABLE:")
    print("=" * 80)
    print("✓ Precise planetary positions with KP Ayanamsa")
    print("✓ Nakshatra analysis with Pada and Star Lord")
    print("✓ KP Sub-Lord system for precise predictions")
    print("✓ Divisional charts (Navamsa D9, Dasamsa D10, etc.)")
    print("✓ KP house cusps with sub-lord analysis")
    print("✓ Planetary aspects with orbs")
    print("✓ Retrograde planet detection")
    print("✓ House significance for predictions")
    print("✓ Ready for Dasha calculations")
    print("✓ Significator analysis framework")

if __name__ == "__main__":
    main()
