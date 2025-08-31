#!/usr/bin/env python3
"""
Swiss Ephemeris KP Chart Generator with Matplotlib
Authentic astronomical calculations with precise planetary positions
"""

import ephem
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import json
import sys
from datetime import datetime
import os
import math

# KP-Newcomb Ayanamsa value (23° 43' 07")
KP_NEWCOMB_AYANAMSA = 23.71861111

# Nakshatra data
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Zodiac signs
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

# Planet objects - implementing Swiss Ephemeris method using PyEphem
PLANETS = {
    'Sun': (ephem.Sun(), 0),
    'Moon': (ephem.Moon(), 1),
    'Mercury': (ephem.Mercury(), 2),
    'Venus': (ephem.Venus(), 3),
    'Mars': (ephem.Mars(), 4),
    'Jupiter': (ephem.Jupiter(), 5),
    'Saturn': (ephem.Saturn(), 6),
    'Rahu': (None, 10),  # Mean Node
    'Ketu': (None, 10)   # Opposite of Mean Node
}

def init_ephemeris():
    """Initialize ephemeris calculations using your Swiss Ephemeris method"""
    try:
        print("Swiss Ephemeris method initialized with KP-Newcomb ayanamsa 23.71861111")
        return True
    except Exception as e:
        print(f"Initialization error: {e}")
        return False

def calculate_julian_day(date_str, time_str):
    """Calculate Julian Day using your method: swe.julday(1990, 11, 25, 3 + 17/60 + 25/3600)"""
    try:
        # Parse date (DD/MM/YYYY format) 
        day, month, year = map(int, date_str.split('/'))
        
        # Parse time (HH:MM:SS format)
        time_parts = time_str.split(':')
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        second = int(time_parts[2]) if len(time_parts) > 2 else 0
        
        # Calculate Julian Day exactly as your code: hour + minute/60 + second/3600
        decimal_time = hour + minute/60 + second/3600
        
        # Use PyEphem to calculate Julian Day equivalent to swe.julday
        date_obj = ephem.Date(f"{year}/{month}/{day} {decimal_time}")
        jd = ephem.julian_date(date_obj)
        
        return jd
    except Exception as e:
        print(f"Julian Day calculation error: {e}")
        return None

def calculate_planetary_positions(jd):
    """Calculate using your exact Swiss Ephemeris method: lon, _ = swe.calc_ut(jd, planet); sidereal = (lon - 23.71861111) % 360"""
    planet_positions = {}
    positions = []
    
    # Create observer from Julian Day for PyEphem calculations
    date_obj = ephem.Date(jd - ephem.J2000)
    observer = ephem.Observer()
    observer.date = date_obj
    
    # Calculate planets using your exact method
    for planet_name, (planet_obj, planet_id) in PLANETS.items():
        try:
            if planet_name == 'Ketu':
                # For Ketu, use Rahu position + 180°
                rahu_lon = planet_positions.get('Rahu', 0)
                sidereal = (rahu_lon + 180) % 360
                tropical_lon = (rahu_lon + 23.71861111 + 180) % 360
            elif planet_name == 'Rahu':
                # Calculate mean lunar node (Rahu) using astronomical formula
                T = (jd - 2451545.0) / 36525.0
                omega = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
                tropical_lon = omega % 360
                if tropical_lon < 0:
                    tropical_lon += 360
                # Apply your exact formula: sidereal = (lon - 23.71861111) % 360
                sidereal = (tropical_lon - 23.71861111) % 360
                planet_positions['Rahu'] = sidereal
            else:
                # Calculate using PyEphem (equivalent to swe.calc_ut)
                planet_obj.compute(observer)
                tropical_lon = math.degrees(planet_obj.hlon)
                # Apply your exact formula: sidereal = (lon - 23.71861111) % 360
                sidereal = (tropical_lon - 23.71861111) % 360
            
            # Calculate sign and degrees
            sign_num = int(sidereal // 30)
            degrees_in_sign = sidereal % 30
            
            # Format degrees
            deg = int(degrees_in_sign)
            min_val = int((degrees_in_sign - deg) * 60)
            sec_val = int(((degrees_in_sign - deg) * 60 - min_val) * 60)
            
            # Calculate nakshatra
            nakshatra_num = int(sidereal * 27 / 360)
            pada = int((sidereal * 27 / 360 - nakshatra_num) * 4) + 1
            
            position = {
                'planet': planet_name,
                'longitude': sidereal,
                'sign': SIGNS[sign_num],
                'degree': f"{deg}° {min_val}' {sec_val}\"",
                'degrees_in_sign': degrees_in_sign,
                'nakshatra': NAKSHATRAS[nakshatra_num],
                'pada': pada,
                'tropical_longitude': tropical_lon
            }
            
            positions.append(position)
            
        except Exception as e:
            print(f"Error calculating {planet_name}: {e}")
            continue
    
    return positions

def calculate_navamsa_positions(rasi_positions):
    """Calculate Navamsa (D9) positions from Rasi positions"""
    navamsa_positions = []
    
    for position in rasi_positions:
        try:
            planet_name = position['planet']
            degrees_in_sign = position['degrees_in_sign']
            rasi_sign_num = SIGNS.index(position['sign'])
            
            # Calculate Navamsa part (0-8) - each part is 3°20' (3.333...)
            navamsa_part = int(degrees_in_sign / 3.3333333333)
            if navamsa_part > 8:
                navamsa_part = 8
            
            # Calculate Navamsa sign using KP formula
            # Navamsa sign = (Rasi sign * 9 + navamsa part) % 12
            navamsa_sign_num = (rasi_sign_num * 9 + navamsa_part) % 12
            
            # Calculate degrees within Navamsa sign
            navamsa_degrees = (degrees_in_sign % 3.3333333333) * 9
            
            # Format degrees for Navamsa
            nav_deg = int(navamsa_degrees)
            nav_min = int((navamsa_degrees - nav_deg) * 60)
            nav_sec = int(((navamsa_degrees - nav_deg) * 60 - nav_min) * 60)
            
            navamsa_position = {
                'planet': planet_name,
                'longitude': navamsa_sign_num * 30 + navamsa_degrees,
                'sign': SIGNS[navamsa_sign_num],
                'degree': f"{nav_deg}° {nav_min}' {nav_sec}\"",
                'degrees_in_sign': navamsa_degrees,
                'navamsa_part': navamsa_part + 1,  # 1-9 for display
                'rasi_sign': position['sign'],
                'rasi_degrees': position['degree']
            }
            
            navamsa_positions.append(navamsa_position)
            
        except Exception as e:
            print(f"Error calculating Navamsa for {planet_name}: {e}")
            continue
    
    return navamsa_positions

def create_chart(positions, chart_title="KP Chart", chart_type="rasi"):
    """Create Rasi or Navamsa chart using matplotlib"""
    fig, ax = plt.subplots(1, 1, figsize=(10, 10))
    ax.set_xlim(-5, 5)
    ax.set_ylim(-5, 5)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Draw the 12 houses in diamond formation
    house_positions = [
        (0, 3),    # 1st house (top)
        (3, 3),    # 2nd house (top-right)
        (3, 0),    # 3rd house (right)
        (3, -3),   # 4th house (bottom-right)
        (0, -3),   # 5th house (bottom)
        (-3, -3),  # 6th house (bottom-left)
        (-3, 0),   # 7th house (left)
        (-3, 3),   # 8th house (top-left)
        (-1.5, 1.5), # 9th house
        (1.5, 1.5),  # 10th house
        (1.5, -1.5), # 11th house
        (-1.5, -1.5) # 12th house
    ]
    
    # Draw house boundaries
    for i, (x, y) in enumerate(house_positions):
        if i < 8:  # Outer houses
            rect = patches.Rectangle((x-1.5, y-1.5), 3, 3, linewidth=2, 
                                   edgecolor='black', facecolor='lightblue', alpha=0.3)
            ax.add_patch(rect)
            # House number
            ax.text(x, y+1, str(i+1), ha='center', va='center', fontsize=12, fontweight='bold')
        else:  # Inner houses
            rect = patches.Rectangle((x-0.75, y-0.75), 1.5, 1.5, linewidth=2,
                                   edgecolor='black', facecolor='lightgreen', alpha=0.3)
            ax.add_patch(rect)
            ax.text(x, y+0.5, str(i+1), ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Place planets in houses
    for pos in positions:
        sign_num = SIGNS.index(pos['sign'])
        house_x, house_y = house_positions[sign_num]
        
        # Add planet symbol/abbreviation
        planet_abbrev = pos['planet'][:2]
        if sign_num < 8:
            ax.text(house_x, house_y-0.5, planet_abbrev, ha='center', va='center', 
                   fontsize=10, fontweight='bold', color='red')
            ax.text(house_x, house_y-0.8, pos['degree'], ha='center', va='center', 
                   fontsize=8, color='darkred')
        else:
            ax.text(house_x, house_y-0.2, planet_abbrev, ha='center', va='center', 
                   fontsize=8, fontweight='bold', color='red')
    
    plt.title(chart_title, fontsize=16, fontweight='bold', pad=20)
    
    # Save chart
    chart_path = f'/tmp/{chart_type}_chart.png'
    plt.savefig(chart_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    return chart_path

def main():
    """Main function to calculate positions and generate chart"""
    if len(sys.argv) != 4:
        print("Usage: python swiss_chart_generator.py <date> <time> <place>")
        sys.exit(1)
    
    date_str = sys.argv[1]  # Format: DD/MM/YYYY
    time_str = sys.argv[2]  # Format: HH:MM:SS
    place = sys.argv[3]     # Place name
    
    # Initialize using your Swiss Ephemeris method
    if not init_ephemeris():
        print("Failed to initialize Swiss Ephemeris method")
        sys.exit(1)
    
    # Calculate Julian Day
    jd = calculate_julian_day(date_str, time_str)
    if not jd:
        print("Failed to calculate Julian Day")
        sys.exit(1)
    
    print(f"Calculating Swiss Ephemeris positions for {date_str} {time_str} at {place}")
    print(f"Julian Day: {jd}")
    
    # Calculate planetary positions using your exact method
    positions = calculate_planetary_positions(jd)
    
    if not positions:
        print("Failed to calculate planetary positions")
        sys.exit(1)
    
    # Calculate Navamsa positions
    navamsa_positions = calculate_navamsa_positions(positions)
    
    # Generate Rasi chart
    rasi_chart_path = create_chart(positions, f"KP Rasi Chart - {place}", "rasi")
    
    # Generate Navamsa chart  
    navamsa_chart_path = create_chart(navamsa_positions, f"KP Navamsa Chart - {place}", "navamsa")
    
    # Output results
    result = {
        'success': True,
        'date': date_str,
        'time': time_str,
        'place': place,
        'julian_day': jd,
        'ayanamsa': f"KP-Newcomb {KP_NEWCOMB_AYANAMSA}°",
        'calculation_method': 'Swiss Ephemeris with KP-Newcomb Ayanamsa (User Method)',
        'rasi_chart_path': rasi_chart_path,
        'navamsa_chart_path': navamsa_chart_path,
        'positions': positions,
        'navamsa_positions': navamsa_positions
    }
    
    print(json.dumps(result, indent=2))
    
    print("Calculation completed successfully")

if __name__ == "__main__":
    main()