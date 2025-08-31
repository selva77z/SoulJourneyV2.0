#!/usr/bin/env python3
"""
Advanced KP Astrology Calculator for Web Application
Integration-ready script with comprehensive features
"""

import json
import sys
import swisseph as swe
from datetime import datetime

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600

def format_degrees_dms(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds"""
    deg = int(decimal_degrees)
    min_val = int((decimal_degrees - deg) * 60)
    sec_val = int(((decimal_degrees - deg) * 60 - min_val) * 60)
    return {
        'degrees': deg,
        'minutes': min_val,
        'seconds': sec_val,
        'formatted': f"{deg:2d}° {min_val:2d}' {sec_val:2d}\""
    }

def calculate_comprehensive_chart(birth_data):
    """
    Calculate comprehensive KP chart with all advanced features
    
    Args:
        birth_data: {
            'year': int,
            'month': int, 
            'day': int,
            'hour': int,
            'minute': int,
            'second': int,
            'timezone_offset': float,  # Hours from UTC (e.g., 5.5 for IST)
            'latitude': float,
            'longitude': float,
            'place_name': str
        }
    
    Returns:
        Complete chart data as JSON
    """
    
    # Extract birth data
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
    
    chart_data = {
        'birth_info': {
            'date': f"{year}-{month:02d}-{day:02d}",
            'time': f"{hour:02d}:{minute:02d}:{second:02d}",
            'place': place_name,
            'latitude': latitude,
            'longitude': longitude,
            'timezone_offset': tz_offset,
            'julian_day_utc': jd_utc
        },
        'ayanamsa': {
            'system': 'KP-Newcomb',
            'value_degrees': KP_AYANAMSA,
            'formatted': format_degrees_dms(KP_AYANAMSA)['formatted']
        },
        'planets': {},
        'houses': {},
        'special_points': {},
        'planetary_phenomena': {},
        'technical_data': {}
    }
    
    # Planet calculations
    planets = {
        'Sun': swe.SUN,
        'Moon': swe.MOON, 
        'Mercury': swe.MERCURY,
        'Venus': swe.VENUS,
        'Mars': swe.MARS,
        'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN,
        'Rahu': swe.MEAN_NODE,
        'Uranus': swe.URANUS,
        'Neptune': swe.NEPTUNE,
        'Pluto': swe.PLUTO
    }
    
    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
             "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    
    for planet_name, planet_id in planets.items():
        try:
            # Calculate with speed and additional data
            result = swe.calc_ut(jd_utc, planet_id, swe.FLG_SPEED | swe.FLG_SIDEREAL)
            
            longitude = result[0][0]
            latitude_planet = result[0][1]
            distance = result[0][2]
            speed_longitude = result[0][3]
            speed_latitude = result[0][4] 
            speed_distance = result[0][5]
            
            # Sign calculation
            sign_num = int(longitude // 30)
            degrees_in_sign = longitude % 30
            
            # Retrograde status
            motion_status = 'Stationary'
            if planet_name not in ['Sun', 'Moon', 'Rahu']:
                if speed_longitude < -0.01:
                    motion_status = 'Retrograde'
                elif speed_longitude > 0.01:
                    motion_status = 'Direct'
            else:
                motion_status = 'N/A'
            
            chart_data['planets'][planet_name] = {
                'longitude': longitude,
                'latitude': latitude_planet,
                'sign': signs[sign_num],
                'sign_number': sign_num + 1,
                'degrees_in_sign': degrees_in_sign,
                'formatted_position': format_degrees_dms(degrees_in_sign),
                'speed': {
                    'longitude_per_day': speed_longitude,
                    'latitude_per_day': speed_latitude,
                    'distance_per_day': speed_distance
                },
                'motion_status': motion_status,
                'distance_au': distance if planet_name not in ['Sun', 'Rahu'] else None
            }
            
        except Exception as e:
            chart_data['planets'][planet_name] = {'error': str(e)}
    
    # Calculate Ketu (opposite to Rahu)
    if 'Rahu' in chart_data['planets'] and 'error' not in chart_data['planets']['Rahu']:
        rahu_lon = chart_data['planets']['Rahu']['longitude']
        ketu_lon = (rahu_lon + 180) % 360
        ketu_sign_num = int(ketu_lon // 30)
        ketu_degrees_in_sign = ketu_lon % 30
        
        chart_data['planets']['Ketu'] = {
            'longitude': ketu_lon,
            'latitude': 0.0,
            'sign': signs[ketu_sign_num],
            'sign_number': ketu_sign_num + 1,
            'degrees_in_sign': ketu_degrees_in_sign,
            'formatted_position': format_degrees_dms(ketu_degrees_in_sign),
            'speed': {
                'longitude_per_day': -chart_data['planets']['Rahu']['speed']['longitude_per_day'],
                'latitude_per_day': 0.0,
                'distance_per_day': 0.0
            },
            'motion_status': 'N/A',
            'distance_au': None
        }
    
    # House calculations (Placidus system)
    try:
        houses_result = swe.houses(jd_utc, latitude, longitude, b'P')
        house_cusps = houses_result[0]
        ascmc = houses_result[1]
        
        for i, cusp in enumerate(house_cusps[1:], 1):  # Skip index 0
            cusp_sidereal = cusp - KP_AYANAMSA
            if cusp_sidereal < 0:
                cusp_sidereal += 360
            
            sign_num = int(cusp_sidereal // 30)
            degrees_in_sign = cusp_sidereal % 30
            
            chart_data['houses'][f'house_{i}'] = {
                'cusp_longitude': cusp_sidereal,
                'sign': signs[sign_num],
                'sign_number': sign_num + 1,
                'degrees_in_sign': degrees_in_sign,
                'formatted_position': format_degrees_dms(degrees_in_sign)
            }
        
        # Special points
        asc_sidereal = ascmc[0] - KP_AYANAMSA
        if asc_sidereal < 0:
            asc_sidereal += 360
            
        mc_sidereal = ascmc[1] - KP_AYANAMSA
        if mc_sidereal < 0:
            mc_sidereal += 360
        
        chart_data['special_points'] = {
            'ascendant': {
                'longitude': asc_sidereal,
                'sign': signs[int(asc_sidereal // 30)],
                'degrees_in_sign': asc_sidereal % 30,
                'formatted_position': format_degrees_dms(asc_sidereal % 30)
            },
            'midheaven': {
                'longitude': mc_sidereal,
                'sign': signs[int(mc_sidereal // 30)],
                'degrees_in_sign': mc_sidereal % 30,
                'formatted_position': format_degrees_dms(mc_sidereal % 30)
            }
        }
        
    except Exception as e:
        chart_data['houses']['error'] = str(e)
    
    # Time calculations
    try:
        sidereal_time = swe.sidtime(jd_utc)
        local_sidereal = (sidereal_time + longitude/15) % 24
        delta_t = swe.deltat(jd_utc)
        
        chart_data['technical_data'] = {
            'greenwich_sidereal_time': sidereal_time,
            'local_sidereal_time': local_sidereal,
            'delta_t_seconds': delta_t,
            'ayanamsa_systems': {}
        }
        
        # Compare different Ayanamsa systems
        ayanamsa_systems = [
            (swe.SIDM_LAHIRI, "Lahiri"),
            (swe.SIDM_KRISHNAMURTI, "Krishnamurti"),
            (swe.SIDM_RAMAN, "Raman"),
            (swe.SIDM_FAGAN_BRADLEY, "Fagan-Bradley")
        ]
        
        for system_id, system_name in ayanamsa_systems:
            try:
                swe.set_sid_mode(system_id)
                ayanamsa_value = swe.get_ayanamsa_ut(jd_utc)
                chart_data['technical_data']['ayanamsa_systems'][system_name] = {
                    'value_degrees': ayanamsa_value,
                    'formatted': format_degrees_dms(ayanamsa_value)['formatted']
                }
            except:
                pass
        
        # Reset to KP
        swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
        
    except Exception as e:
        chart_data['technical_data']['error'] = str(e)
    
    return chart_data

def main():
    """Main function for command line usage"""
    if len(sys.argv) > 1:
        # Use command line arguments or JSON input
        try:
            birth_data = json.loads(sys.argv[1])
        except:
            print("Error: Invalid JSON input")
            return
    else:
        # Default birth data for testing
        birth_data = {
            'year': 1990,
            'month': 11,
            'day': 3,
            'hour': 11,
            'minute': 31,
            'second': 29,
            'timezone_offset': 5.5,  # IST
            'latitude': 6 + 55/60 + 55/3600,  # 6°55'55"N
            'longitude': 79 + 50/60 + 52/3600,  # 79°50'52"E
            'place_name': "Tamil Nadu, India"
        }
    
    # Calculate comprehensive chart
    chart = calculate_comprehensive_chart(birth_data)
    
    # Output as JSON
    print(json.dumps(chart, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
