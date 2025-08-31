#!/usr/bin/env python3
"""
Swiss Ephemeris - Key Features for KP Astrology
Clean working demonstration
"""

import swisseph as swe

# KP-Newcomb Ayanamsa value: 23° 43' 04"
KP_AYANAMSA = 23 + 43/60 + 4/3600

def format_degrees(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds format"""
    deg = int(decimal_degrees)
    min_val = int((decimal_degrees - deg) * 60)
    sec_val = int(((decimal_degrees - deg) * 60 - min_val) * 60)
    return f"{deg:2d}° {min_val:2d}' {sec_val:2d}\""

def main():
    print("SWISS EPHEMERIS - KEY FEATURES FOR KP ASTROLOGY")
    print("=" * 60)
    
    # Birth details
    year, month, day = 1990, 11, 3
    hour, minute, second = 11, 31, 29
    decimal_time = hour + minute/60 + second/3600
    ist_offset = 5.5
    jd_utc = swe.julday(year, month, day, decimal_time - ist_offset)
    
    print(f"Birth: {year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d} IST")
    print(f"Julian Day (UTC): {jd_utc:.6f}")
    print()
    
    # Set KP Ayanamsa
    swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
    
    print("1. PLANETARY POSITIONS WITH ADVANCED DATA")
    print("-" * 60)
    
    planets = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
        'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN, 'Rahu': swe.MEAN_NODE
    }
    
    for name, planet_id in planets.items():
        # Get position with speed data
        result = swe.calc_ut(jd_utc, planet_id, swe.FLG_SPEED | swe.FLG_SIDEREAL)
        
        longitude = result[0][0]
        latitude = result[0][1]
        distance = result[0][2]
        speed = result[0][3]
        
        # Calculate sign position
        sign_num = int(longitude // 30)
        degrees_in_sign = longitude % 30
        signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
        
        status = ""
        if name not in ['Sun', 'Moon', 'Rahu']:
            status = " (R)" if speed < 0 else " (D)"
        
        print(f"{name:8}: {format_degrees(degrees_in_sign)} {signs[sign_num]:12}{status}")
        print(f"         Speed: {speed:+7.4f}°/day")
        if name != 'Sun' and name != 'Rahu':
            print(f"         Distance: {distance:.2f} AU")
        print()
    
    print("2. DIFFERENT AYANAMSA SYSTEMS COMPARISON")
    print("-" * 60)
    
    ayanamsa_systems = [
        (swe.SIDM_LAHIRI, "Lahiri (Chitrapaksha)"),
        (swe.SIDM_KRISHNAMURTI, "Krishnamurti"),
        (swe.SIDM_RAMAN, "Raman"),
        (swe.SIDM_FAGAN_BRADLEY, "Fagan-Bradley")
    ]
    
    for system_id, system_name in ayanamsa_systems:
        swe.set_sid_mode(system_id)
        ayanamsa_value = swe.get_ayanamsa_ut(jd_utc)
        print(f"{system_name:20}: {format_degrees(ayanamsa_value)}")
    
    # Reset to KP
    swe.set_sid_mode(swe.SIDM_USER, 0, KP_AYANAMSA)
    print(f"{'KP (Custom)':20}: {format_degrees(KP_AYANAMSA)}")
    
    print("\n3. HOUSE SYSTEMS (Placidus)")
    print("-" * 60)
    
    latitude = 6 + 55/60 + 55/3600
    longitude = 79 + 50/60 + 52/3600
    
    try:
        houses_result = swe.houses(jd_utc, latitude, longitude, b'P')
        house_cusps = houses_result[0]
        ascmc = houses_result[1]
        
        for i, cusp in enumerate(house_cusps[1:], 1):
            cusp_sidereal = cusp - KP_AYANAMSA
            if cusp_sidereal < 0:
                cusp_sidereal += 360
            
            sign_num = int(cusp_sidereal // 30)
            degrees_in_sign = cusp_sidereal % 30
            signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
            
            print(f"House {i:2d}: {format_degrees(degrees_in_sign)} {signs[sign_num]}")
        
        # Ascendant and MC
        asc_sidereal = ascmc[0] - KP_AYANAMSA
        if asc_sidereal < 0:
            asc_sidereal += 360
        mc_sidereal = ascmc[1] - KP_AYANAMSA  
        if mc_sidereal < 0:
            mc_sidereal += 360
        
        asc_sign = int(asc_sidereal // 30)
        mc_sign = int(mc_sidereal // 30)
        
        print(f"\nAscendant: {format_degrees(asc_sidereal % 30)} {signs[asc_sign]}")
        print(f"Midheaven: {format_degrees(mc_sidereal % 30)} {signs[mc_sign]}")
        
    except Exception as e:
        print(f"House calculation error: {e}")
    
    print("\n4. COORDINATE SYSTEMS")
    print("-" * 60)
    
    # Sun in different coordinate systems
    sun_tropical = swe.calc_ut(jd_utc, swe.SUN)[0][0]
    sun_sidereal = swe.calc_ut(jd_utc, swe.SUN, swe.FLG_SIDEREAL)[0][0]
    sun_equatorial = swe.calc_ut(jd_utc, swe.SUN, swe.FLG_EQUATORIAL)[0]
    
    print(f"Sun Tropical:        {format_degrees(sun_tropical)}")
    print(f"Sun Sidereal (KP):   {format_degrees(sun_sidereal)}")
    print(f"Right Ascension:     {format_degrees(sun_equatorial[0])}")
    print(f"Declination:         {sun_equatorial[1]:+7.3f}°")
    
    print("\n5. TIME CALCULATIONS")
    print("-" * 60)
    
    sidereal_time = swe.sidtime(jd_utc)
    local_sidereal = (sidereal_time + longitude/15) % 24
    delta_t = swe.deltat(jd_utc)
    
    print(f"Greenwich Sidereal Time: {sidereal_time:.4f} hours")
    print(f"Local Sidereal Time:     {local_sidereal:.4f} hours")  
    print(f"Delta T:                 {delta_t:.1f} seconds")
    
    print("\n" + "=" * 60)
    print("AMAZING CAPABILITIES AVAILABLE:")
    print("=" * 60)
    print("✓ Ultra-precise planetary positions (Swiss Ephemeris accuracy)")
    print("✓ All planets + asteroids (Ceres, Pallas, Juno, Vesta, Chiron)")
    print("✓ Multiple house systems (Placidus, Koch, Equal, Whole Sign, etc.)")
    print("✓ 30+ different Ayanamsa systems")
    print("✓ Planetary speeds and retrograde detection")
    print("✓ Exact distances in Astronomical Units")
    print("✓ Multiple coordinate systems (Tropical, Sidereal, Equatorial)")
    print("✓ Topocentric calculations (observer's exact location)")
    print("✓ Heliocentric calculations (Sun-centered)")
    print("✓ Time calculations (Sidereal time, Delta T)")
    print("✓ Angular calculations (aspects, midpoints)")
    print("✓ Eclipse calculations (with proper ephemeris files)")
    print("✓ Fixed star positions (with star catalog)")
    print("✓ Rise/set times for any celestial body")
    print("✓ Custom Ayanamsa values (your exact KP value)")
    print("✓ High precision ephemeris (JPL DE431 compatible)")

if __name__ == "__main__":
    main()
