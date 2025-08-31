#!/usr/bin/env python3
"""
Advanced Swiss Ephemeris Features Demo for KP Astrology
Showcasing the powerful capabilities beyond basic planetary positions
"""

import sys
import json
import swisseph as swe
from datetime import datetime, timezone, timedelta

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600

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
    'Uranus': swe.URANUS,
    'Neptune': swe.NEPTUNE,
    'Pluto': swe.PLUTO
}

# Additional bodies available
ASTEROIDS = {
    'Ceres': swe.CERES,
    'Pallas': swe.PALLAS,
    'Juno': swe.JUNO,
    'Vesta': swe.VESTA,
    'Chiron': swe.CHIRON
}

# Zodiac signs
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

def format_degrees(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds format"""
    deg = int(decimal_degrees)
    min_val = int((decimal_degrees - deg) * 60)
    sec_val = int(((decimal_degrees - deg) * 60 - min_val) * 60)
    return f"{deg:2d}° {min_val:2d}' {sec_val:2d}\""

def get_sidereal_position(tropical_lon):
    """Convert tropical longitude to sidereal using KP Ayanamsa"""
    sidereal_lon = tropical_lon - KP_AYANAMSA
    if sidereal_lon < 0:
        sidereal_lon += 360
    
    sign_num = int(sidereal_lon // 30)
    degrees_in_sign = sidereal_lon % 30
    
    return {
        'sign': SIGNS[sign_num],
        'degrees_in_sign': degrees_in_sign,
        'formatted': format_degrees(degrees_in_sign),
        'sidereal_longitude': sidereal_lon
    }

def demo_basic_calculations():
    """Demo 1: Enhanced planetary calculations with additional details"""
    print("=" * 80)
    print("DEMO 1: ENHANCED PLANETARY CALCULATIONS")
    print("=" * 80)
    
    # Birth details: 03/11/1990, 11:31:29 AM, Tamil Nadu
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    
    # Location coordinates
    latitude = 6 + 55/60 + 55/3600   # 6° 55' 55" N
    longitude = 79 + 50/60 + 52/3600  # 79° 50' 52" E
    
    # Calculate Julian Day (UTC)
    decimal_time = hour + minute/60 + second/3600
    ist_offset = 5.5  # IST is UTC+5:30
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    print(f"Birth Date: {year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d} IST")
    print(f"Julian Day (UTC): {jd_utc}")
    print(f"KP Ayanamsa: {KP_AYANAMSA:.10f}° (23° 43' 04\")")
    print()
    
    # Enhanced planetary calculations with speed and additional data
    for planet_name, planet_id in PLANETS.items():
        try:
            # Calculate with speed (FLG_SPEED flag)
            result = swe.calc_ut(jd_utc, planet_id, swe.FLG_SPEED)
            
            tropical_lon = result[0][0]  # Longitude
            tropical_lat = result[0][1]  # Latitude  
            distance = result[0][2]      # Distance from Earth
            speed_lon = result[0][3]     # Daily motion in longitude
            speed_lat = result[0][4]     # Daily motion in latitude
            speed_dist = result[0][5]    # Daily motion in distance
            
            # Get sidereal position
            pos = get_sidereal_position(tropical_lon)
            
            print(f"{planet_name:8}: {pos['formatted']} in {pos['sign']:12}")
            print(f"         Speed: {speed_lon:+7.4f}°/day  Distance: {distance:8.2f} AU")
            if planet_name != 'Sun':  # Sun's latitude is always 0
                print(f"         Latitude: {tropical_lat:+6.3f}°")
            print()
            
        except Exception as e:
            print(f"Error calculating {planet_name}: {e}")

def demo_house_calculations():
    """Demo 2: House calculations with different systems"""
    print("=" * 80)
    print("DEMO 2: HOUSE CALCULATIONS (Multiple Systems)")
    print("=" * 80)
    
    # Birth details
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    latitude = 6 + 55/60 + 55/3600
    longitude = 79 + 50/60 + 52/3600
    
    decimal_time = hour + minute/60 + second/3600
    ist_offset = 5.5
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    # Different house systems
    house_systems = {
        'P': 'Placidus',
        'K': 'Koch',
        'O': 'Porphyrius', 
        'R': 'Regiomontanus',
        'C': 'Campanus',
        'W': 'Whole Sign',
        'E': 'Equal House'
    }
    
    for system_code, system_name in house_systems.items():
        try:
            houses_result = swe.houses(jd_utc, latitude, longitude, system_code.encode('ascii'))
            house_cusps = houses_result[0]  # House cusps
            ascmc = houses_result[1]        # Ascendant, MC, etc.
            
            print(f"\n{system_name} House System:")
            print("-" * 40)
            
            # Show house cusps
            for i, cusp in enumerate(house_cusps[1:], 1):  # Skip index 0
                pos = get_sidereal_position(cusp)
                print(f"House {i:2d}: {pos['formatted']} {pos['sign']}")
            
            # Show important points
            asc_pos = get_sidereal_position(ascmc[0])  # Ascendant
            mc_pos = get_sidereal_position(ascmc[1])   # Midheaven
            
            print(f"\nAscendant: {asc_pos['formatted']} {asc_pos['sign']}")
            print(f"Midheaven: {mc_pos['formatted']} {mc_pos['sign']}")
            
        except Exception as e:
            print(f"Error calculating {system_name}: {e}")

def demo_eclipse_calculations():
    """Demo 3: Eclipse calculations"""
    print("\n" + "=" * 80)
    print("DEMO 3: ECLIPSE CALCULATIONS")
    print("=" * 80)
    
    # Find next few solar eclipses after birth date
    year, month, day = 1990, 11, 3
    start_jd = swe.julday(year, month, day, 0)
    
    print("Next Solar Eclipses after birth date:")
    print("-" * 50)
    
    jd_eclipse = start_jd
    for i in range(5):  # Find next 5 eclipses
        try:
            eclipse_data = swe.sol_eclipse_when_glob(jd_eclipse, swe.FLG_SWIEPH, swe.ECL_TOTAL | swe.ECL_ANNULAR | swe.ECL_PARTIAL)
            jd_eclipse = eclipse_data[1][0]  # Maximum eclipse time
            
            # Convert back to calendar date
            cal_date = swe.revjul(jd_eclipse)
            year_e, month_e, day_e, hour_e = cal_date
            
            print(f"Eclipse {i+1}: {year_e}-{month_e:02d}-{day_e:02d} {hour_e:05.2f} UT")
            
            jd_eclipse += 1  # Start search from next day
            
        except Exception as e:
            print(f"Error finding eclipse {i+1}: {e}")
            break

def demo_planetary_phenomena():
    """Demo 4: Planetary phenomena (rising, setting, etc.)"""
    print("\n" + "=" * 80)
    print("DEMO 4: PLANETARY PHENOMENA")
    print("=" * 80)
    
    # Birth details
    year, month, day = 1990, 11, 3
    latitude = 6 + 55/60 + 55/3600
    longitude = 79 + 50/60 + 52/3600
    
    start_jd = swe.julday(year, month, day, 0)
    
    print(f"Planetary events around birth date ({year}-{month:02d}-{day:02d}):")
    print("-" * 60)
    
    # Check rise/set times for visible planets
    visible_planets = {'Sun': swe.SUN, 'Moon': swe.MOON, 'Venus': swe.VENUS, 'Jupiter': swe.JUPITER}
    
    for planet_name, planet_id in visible_planets.items():
        try:
            # Calculate rise time
            rise_data = swe.rise_trans(start_jd, planet_id, longitude, latitude, 0, 0, swe.CALC_RISE)
            if rise_data[0] == 1:  # Success
                rise_jd = rise_data[1][0]
                rise_cal = swe.revjul(rise_jd)
                rise_time = f"{int(rise_cal[3]):02d}:{int((rise_cal[3] % 1) * 60):02d}"
                
                # Calculate set time  
                set_data = swe.rise_trans(start_jd, planet_id, longitude, latitude, 0, 0, swe.CALC_SET)
                if set_data[0] == 1:
                    set_jd = set_data[1][0]
                    set_cal = swe.revjul(set_jd)
                    set_time = f"{int(set_cal[3]):02d}:{int((set_cal[3] % 1) * 60):02d}"
                    
                    print(f"{planet_name:8}: Rise {rise_time} IST, Set {set_time} IST")
                
        except Exception as e:
            print(f"Error calculating {planet_name} rise/set: {e}")

def demo_ayanamsa_systems():
    """Demo 5: Different Ayanamsa systems"""
    print("\n" + "=" * 80)
    print("DEMO 5: DIFFERENT AYANAMSA SYSTEMS")
    print("=" * 80)
    
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    decimal_time = hour + minute/60 + second/3600
    ist_offset = 5.5
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    # Popular Ayanamsa systems
    ayanamsa_systems = {
        swe.SIDM_LAHIRI: "Lahiri (Chitrapaksha)",
        swe.SIDM_KRISHNAMURTI: "Krishnamurti (KP)",
        swe.SIDM_RAMAN: "Raman",
        swe.SIDM_FAGAN_BRADLEY: "Fagan-Bradley",
        swe.SIDM_TRUE_CITRA: "True Citra",
        swe.SIDM_TRUE_REVATI: "True Revati"
    }
    
    print("Ayanamsa values for birth date:")
    print("-" * 40)
    
    for system_id, system_name in ayanamsa_systems.items():
        try:
            swe.set_sid_mode(system_id)
            ayanamsa_value = swe.get_ayanamsa_ut(jd_utc)
            print(f"{system_name:20}: {ayanamsa_value:10.6f}° ({format_degrees(ayanamsa_value)})")
        except Exception as e:
            print(f"Error calculating {system_name}: {e}")
    
    # Reset to our KP system
    swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)

def demo_fixed_stars():
    """Demo 6: Fixed stars calculations"""
    print("\n" + "=" * 80)
    print("DEMO 6: FIXED STARS")
    print("=" * 80)
    
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    decimal_time = hour + minute/60 + second/3600
    ist_offset = 5.5
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    # Important fixed stars
    important_stars = [
        "Aldebaran",    # Alpha Tauri
        "Regulus",      # Alpha Leonis  
        "Spica",        # Alpha Virginis
        "Antares",      # Alpha Scorpii
        "Sirius",       # Alpha Canis Majoris
        "Vega",         # Alpha Lyrae
        "Arcturus",     # Alpha Bootis
        "Polaris"       # Alpha Ursae Minoris
    ]
    
    print("Fixed star positions for birth date:")
    print("-" * 50)
    
    for star_name in important_stars:
        try:
            star_data = swe.fixstar_ut(star_name, jd_utc)
            if star_data[0] != -1:  # Success
                tropical_lon = star_data[0]
                pos = get_sidereal_position(tropical_lon)
                print(f"{star_name:12}: {pos['formatted']} {pos['sign']}")
        except Exception as e:
            print(f"Error calculating {star_name}: {e}")

def main():
    """Main function to run all demos"""
    print("ADVANCED SWISS EPHEMERIS FEATURES FOR KP ASTROLOGY")
    print("=" * 80)
    print("Birth Data: 03/11/1990, 11:31:29 AM IST, Tamil Nadu (6°55'55\"N, 79°50'52\"E)")
    
    # Set ephemeris path (optional, but recommended)
    swe.set_ephe_path('/usr/share/swisseph')
    
    # Set our custom KP Ayanamsa
    swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
    
    # Run all demos
    demo_basic_calculations()
    demo_house_calculations()
    demo_eclipse_calculations()
    demo_planetary_phenomena()
    demo_ayanamsa_systems()
    demo_fixed_stars()
    
    print("\n" + "=" * 80)
    print("ADDITIONAL CAPABILITIES AVAILABLE:")
    print("=" * 80)
    print("• Asteroid positions (Ceres, Pallas, Juno, Vesta, Chiron)")
    print("• Lunar phases and New/Full Moon calculations")
    print("• Planetary aspects and angular separations")
    print("• Retrograde motion detection")
    print("• Heliacal rising/setting calculations")
    print("• Topocentric vs Geocentric calculations")
    print("• High precision ephemeris (JPL DE431)")
    print("• Custom asteroid and comet calculations")
    print("• Galactic coordinates")
    print("• Lunar and solar eclipse predictions")
    print("• Planetary conjunctions and oppositions")
    print("• Nutation and precession calculations")

if __name__ == "__main__":
    main()
