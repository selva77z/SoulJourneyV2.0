#!/usr/bin/env python3
"""
Authentic KP Chart Generator with Swiss Ephemeris
Features:
- Placidus House System (Standard for KP)
- KP Newcomb Ayanamsa
- Full Sub-Lord Calculation (Sign, Star, Sub, Sub-Sub)
- Planetary Significators (A, B, C, D)
- Vimshottari Dasa Balance calculation
"""

from datetime import datetime, timedelta
import swisseph as swe
import json
import sys
import math

# KP-Newcomb Ayanamsa value (Approximate for modern usage, customized logic below if needed)
# Standard KP uses traditional values, but we can stick to a fixed offset or calculated one.
# For this implementation we will use swe.set_sid_mode with a custom ayanamsa or standard Lahiri/KP.
# Note: swiss ephemeris has built-in ayanamsas. KP is often associated with Krishnamurti (swe.SIDM_KRISHNAMURTI).
# However, the previous code used a fixed value. We will use the built-in Swiss Eph KP mode for accuracy.

# Constants
NAK_LENGTH = 13.333333333333334
VIMSHOTTARI_DASA = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17
}
DASA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
TOTAL_DASA_YEARS = 120

SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
              'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

RASI_LORDS = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
    'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
}

NAKSHATRAS = [
    ("Ashwini", "Ketu"), ("Bharani", "Venus"), ("Krittika", "Sun"), ("Rohini", "Moon"),
    ("Mrigashira", "Mars"), ("Ardra", "Rahu"), ("Punarvasu", "Jupiter"), ("Pushya", "Saturn"),
    ("Ashlesha", "Mercury"), ("Magha", "Ketu"), ("Purva Phalguni", "Venus"), ("Uttara Phalguni", "Sun"),
    ("Hasta", "Moon"), ("Chitra", "Mars"), ("Swati", "Rahu"), ("Vishakha", "Jupiter"),
    ("Anuradha", "Saturn"), ("Jyeshtha", "Mercury"), ("Mula", "Ketu"), ("Purva Ashadha", "Venus"),
    ("Uttara Ashadha", "Sun"), ("Shravana", "Moon"), ("Dhanishta", "Mars"), ("Shatabhisha", "Rahu"),
    ("Purva Bhadrapada", "Jupiter"), ("Uttara Bhadrapada", "Saturn"), ("Revati", "Mercury")
]

PLANET_IDS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, "Venus": swe.VENUS,
    "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN,
    "Rahu": swe.MEAN_NODE, "Ketu": swe.MEAN_NODE # KP uses the Mean lunar node; Ketu handled separately
}

def to_dms_str(deg):
    d = int(deg)
    m = int((deg - d) * 60)
    s = int(((deg - d) * 60 - m) * 60)
    return f"{d}° {m}' {s}\""

def get_sub_divisions():
    subs = {}
    for planet in DASA_SEQUENCE:
        subs[planet] = (VIMSHOTTARI_DASA[planet] / TOTAL_DASA_YEARS) * NAK_LENGTH
    return subs

SUB_DIVISIONS = get_sub_divisions()

def get_padham(longitude, nak_start):
    # Padham span is 3deg 20min = 3.3333333333333335 deg
    padham_length = 3.3333333333333335
    
    # Position within Nakshatra
    pos_in_nak = longitude - nak_start
    padham = int(pos_in_nak / padham_length) + 1
    return padham

def get_lord_info(longitude):
    """Calculate Sign, Star, Sub, Sub-Sub, Sub-Sub-Sub lords based on longitude"""
    # Normalize longitude
    longitude = longitude % 360
    
    # Sign
    sign_idx = int(longitude / 30)

    sign_name = SIGN_NAMES[sign_idx]
    sign_lord = RASI_LORDS[sign_name]
    
    # Nakshatra (Star)
    nak_idx = int(longitude / NAK_LENGTH)
    nak_name, star_lord = NAKSHATRAS[nak_idx]
    
    # Degrees traversed in Nakshatra
    nak_start = nak_idx * NAK_LENGTH
    deg_in_nak = longitude - nak_start
    
    # Sub Lord calculation
    # Sequence of subs always starts from the Star Lord itself
    star_lord_idx = DASA_SEQUENCE.index(star_lord)
    
    cumulative = 0
    sub_lord = None
    sub_sub_lord = None
    
    # Cycle through Dasa sequence starting from Star Lord
    for i in range(9):
        current_planet = DASA_SEQUENCE[(star_lord_idx + i) % 9]
        sub_span = SUB_DIVISIONS[current_planet]
        
        if deg_in_nak < (cumulative + sub_span):
            sub_lord = current_planet
            
            # Sub-Sub Lord calculation (nested logic)
            deg_in_sub = deg_in_nak - cumulative
            sub_lord_idx = DASA_SEQUENCE.index(sub_lord)
            
            cumulative_ss = 0
            for j in range(9):
                current_ss_planet = DASA_SEQUENCE[(sub_lord_idx + j) % 9]
                # Proportion of sub span
                ss_span = (VIMSHOTTARI_DASA[current_ss_planet] / TOTAL_DASA_YEARS) * sub_span
                
                if deg_in_sub < (cumulative_ss + ss_span):
                    sub_sub_lord = current_ss_planet
                    
                    # Sub-Sub-Sub Lord calculation (nested logic level 3)
                    deg_in_ss = deg_in_sub - cumulative_ss
                    ss_lord_idx = DASA_SEQUENCE.index(sub_sub_lord)
                    
                    cumulative_sss = 0
                    sub_sub_sub_lord = None
                    for k in range(9):
                        current_sss_planet = DASA_SEQUENCE[(ss_lord_idx + k) % 9]
                        sss_span = (VIMSHOTTARI_DASA[current_sss_planet] / TOTAL_DASA_YEARS) * ss_span
                        
                        if deg_in_ss < (cumulative_sss + sss_span):
                            sub_sub_sub_lord = current_sss_planet
                            break
                        cumulative_sss += sss_span
                    
                    break
                cumulative_ss += ss_span
            break
        cumulative += sub_span
        
    padham = get_padham(longitude, nak_start)
    
    return {
        "sign": sign_name,
        "signLord": sign_lord,
        "nakshatra": nak_name,
        "padham": padham,
        "starLord": star_lord,
        "subLord": sub_lord,
        "subSubLord": sub_sub_lord,
        "subSubSubLord": sub_sub_sub_lord
    }

def calculate_full_dasa(moon_long, birth_dt):
    """
    Calculate full Vimshottari Dasa system (Dasa -> Bhukti -> Anthara)
    """
    nak_span = NAK_LENGTH
    
    # 1. Find Birth Nakshatra and Balance
    nak_index = int(moon_long / nak_span)
    nak_name, star_lord = NAKSHATRAS[nak_index]
    
    # Balance Calculation
    nak_start = nak_index * nak_span
    moon_elapsed = moon_long - nak_start
    moon_remaining = nak_span - moon_elapsed
    balance_fraction = moon_remaining / nak_span
    
    # 2. Generate Dasa Sequence
    # Standard Sequence: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
    # We find the index of the star_lord in this sequence
    try:
        start_idx = DASA_SEQUENCE.index(star_lord)
    except ValueError:
        # Fallback if star_lord name mismatch
        start_idx = 0

    full_system = []
    
    # Initial Dasa (The one running at birth)
    # The duration is shortened by the balance factor
    curr_date = birth_dt
    
    # We will generate Dasas for roughly 120 years or until 9 cycles
    # But strictly speaking, it goes cyclically. Let's do 1 full cycle of 9 Dasas (120 years total coverage usually sufficient for life)
    
    for i in range(9):
        p_idx = (start_idx + i) % 9
        dasa_lord = DASA_SEQUENCE[p_idx]
        total_dasa_duration = VIMSHOTTARI_DASA[dasa_lord]
        
        # Duration of this Dasa
        # If it's the first one, use balance
        if i == 0:
            duration_years = total_dasa_duration * balance_fraction
        else:
            duration_years = total_dasa_duration
            
        start_date = curr_date
        dasa_days = duration_years * 365.25
        end_date = start_date + timedelta(days=dasa_days)
        
        # Calculate Bhuktis (Sub-periods)
        bhuktis = []
        # Bhukti starts from Dasa Lord index
        # 9 Bhuktis in total
        curr_bhukti_date = start_date
        bhukti_start_idx = DASA_SEQUENCE.index(dasa_lord) # Bhukti always starts with Dasa Lord
        
        for j in range(9):
            b_idx = (bhukti_start_idx + j) % 9
            bhukti_lord = DASA_SEQUENCE[b_idx]
            
            # Bhukti duration formula: (Dasa Years * Bhukti Years) / 120
            bhukti_total_years = VIMSHOTTARI_DASA[bhukti_lord]
            # Standard duration in years
            bhukti_std_duration = (total_dasa_duration * bhukti_total_years) / 120.0
            
            # If this is the very first Dasa (Birth Dasa), we need to adjust the First Bhuktis?
            # Actually, standard practice: 
            # If Balance is X years, we need to find WHICH Bhukti we are currently in at birth?
            # Or simpler: The "Balance" is treated as the REMAINING time of the CURRENT Dasa.
            # But accurately, we should know per Bhukti.
            # Simplified approach for "everything": List the Dasas starting from Birth.
            # For the First Dasa, we just show "Balance". Expanding Bhuktis for the *remaining* balance is complex logic.
            # Let's keep it clean: 
            # List Maha Dasas with Start/End dates.
            # Only expand Bhuktis for the Current Running Dasa? Or all?
            # User said "everything". Let's expand all Bhuktis for the 9 Dasas.
            
            # Precise Handling for First Dasa's Bhuktis:
            # We skip Bhuktis that passed before birth.
            # Calculate total span of all Bhuktis normaly.
            
            # Let's do a simplified approach first to ensure robustness:
            # Generate Std Bhuktis.
            # Cut off those before Birth Date (for the first Dasa).
            
            bhukti_days = bhukti_std_duration * 365.25
            bhukti_end = curr_bhukti_date + timedelta(days=bhukti_days)
            
            # Adjust for first Dasa fractional start?
            # Actually, the "Dasa Start Date" calculated above (curr_date) IS Birth Date for the first Dasa.
            # So the First Dasa's logic is:
            # Start: Birth Date.
            # End: Birth + Balance.
            # We need to map this Balance to the correct LAST Bhuktis of the Dasa.
            
            # Let's execute logic:
            # 1. Calculate FULL Standard Dasa End Date (Theoretical) = Birth + Balance + (Elapsed Dasa Part)
            # Theoretical Start = Birth - (Total Dasa - Balance)
            pass

        # REVISED LOGIC for robust sequence:
        # 1. Theoretical Start of the First Dasa = Birth Date - (Total_Years_Of_Lord * (1 - balance_fraction))
        # 2. Then proceed linearly adding durations.
        pass

    # Correct Revised Implementation inside this function scope:
    full_system = []
    
    # 1. Determine Theoretical Start of the First Dasa
    first_lord_years = VIMSHOTTARI_DASA[star_lord]
    years_elapsed = first_lord_years * (1.0 - balance_fraction)
    days_elapsed = years_elapsed * 365.25
    theoretical_start = birth_dt - timedelta(days=days_elapsed)
    
    current_cursor = theoretical_start
    
    # Generate 9 Maha Dasas (120 years cycle)
    for i in range(9):
        p_idx = (start_idx + i) % 9
        dasa_lord = DASA_SEQUENCE[p_idx]
        dasa_years = VIMSHOTTARI_DASA[dasa_lord]
        
        dasa_start = current_cursor
        dasa_end = dasa_start + timedelta(days=dasa_years * 365.25)
        
        # Bhuktis
        bhuktis = []
        bhukti_cursor = dasa_start
        bhukti_start_seq_idx = DASA_SEQUENCE.index(dasa_lord)
        
        for j in range(9):
            b_idx = (bhukti_start_seq_idx + j) % 9
            bhukti_lord = DASA_SEQUENCE[b_idx]
            bhukti_years = VIMSHOTTARI_DASA[bhukti_lord]
            
            # Year fraction relative to Dasa
            sub_duration_years = (dasa_years * bhukti_years) / 120.0
            sub_end = bhukti_cursor + timedelta(days=sub_duration_years * 365.25)
            
            # Antharas (Level 3) - Optional for "everything" but detailed
            anthras = []
            anthra_cursor = bhukti_cursor
            anthra_start_seq_idx = DASA_SEQUENCE.index(bhukti_lord)
            
            for k in range(9):
                a_idx = (anthra_start_seq_idx + k) % 9
                anthra_lord = DASA_SEQUENCE[a_idx]
                anthra_years = VIMSHOTTARI_DASA[anthra_lord]
                
                # Anthra duration: (Bhukti Years * Anthra Years) / 120
                # Using sub_duration_years as base
                anthra_duration_years = (sub_duration_years * anthra_years) / 120.0
                anthra_end = anthra_cursor + timedelta(days=anthra_duration_years * 365.25)
                
                # Filter Antras before birth? User might want to see the whole Dasa structure.
                # But typically we filter only to show valid ones post-birth?
                # "Everything" usually implies the schedule.
                # Let's keep all, but mark them?
                # For UI performance, maybe only send Antras for current/future?
                # Let's send ALL. JSON size is small enough.
                
                anthras.append({
                    "lord": anthra_lord,
                    "start": anthra_cursor.strftime("%Y-%m-%d"),
                    "end": anthra_end.strftime("%Y-%m-%d")
                })
                anthra_cursor = anthra_end

            bhuktis.append({
                "lord": bhukti_lord,
                "start": bhukti_cursor.strftime("%Y-%m-%d"),
                "end": sub_end.strftime("%Y-%m-%d"),
                "anthras": anthras
            })
            bhukti_cursor = sub_end
            
        full_system.append({
            "lord": dasa_lord,
            "start": dasa_start.strftime("%Y-%m-%d"),
            "end": dasa_end.strftime("%Y-%m-%d"),
            "bhuktis": bhuktis
        })
        
        current_cursor = dasa_end

    # Current Dasa Information (Summary)
    # Find active Dasa/Bhukti at Birth (roughly) -> Actually user wants Current as of NOW?
    # Or just the Birth Balance?
    # The user asked for "everything", implies the schedule.
    # We still return the simplified 'currentDasa' for the header card.
    
    return {
        "currentDasa": star_lord, # Lord at birth
        "balanceYears": round(balance_fraction * first_lord_years, 2),
        "dasaEndDate": (birth_dt + timedelta(days=(balance_fraction * first_lord_years * 365.25))).strftime("%Y-%m-%d"),
        "fullSystem": full_system
    }

def calculate_kp_chart(birth_date, birth_time, latitude, longitude, place_name):
    # Parse Date formats mostly for robust handling (YYYY-MM-DD, DD/MM/YYYY, or DDMMYYYY)
    if '-' in birth_date:
        year, month, day = map(int, birth_date.split('-'))
    elif '/' in birth_date:
        # Assume DD/MM/YYYY or MM/DD/YYYY? Standard is usually DD/MM/YYYY in India/UK
        # But let's check order. If first part > 12, it's day.
        parts = list(map(int, birth_date.split('/')))
        if parts[0] > 12:
            day, month, year = parts
        else:
            # Ambiguous, default to DD/MM/YYYY for this user context (India)
            day, month, year = parts
    elif len(birth_date) == 8 and birth_date.isdigit():
        # Assume DDMMYYYY or YYYYMMDD
        # Check if first 4 are year-ish (19xx or 20xx)
        if birth_date.startswith("19") or birth_date.startswith("20"):
            year = int(birth_date[:4])
            month = int(birth_date[4:6])
            day = int(birth_date[6:])
        else:
             # Assume DDMMYYYY
            day = int(birth_date[:2])
            month = int(birth_date[2:4])
            year = int(birth_date[4:])
    else:
        # Fallback or error
        raise ValueError(f"Unknown date format: {birth_date}")

    time_parts = list(map(int, birth_time.split(':')))
    if len(time_parts) == 3:
        hour, minute, second = time_parts
    elif len(time_parts) == 2:
        hour, minute = time_parts
        second = 0
    else:
        hour, minute, second = 12, 0, 0
    
    birth_dt = datetime(year, month, day, hour, minute, second)
    
    # Assuming input is local time, converting to UTC roughly for now
    time_offset = 5.5
    decimal_hour = hour + minute/60.0 + second/3600.0 - time_offset
    
    # Extract decimal year from birth date roughly or precise via JD
    # JD of birth
    jd = swe.julday(year, month, day, decimal_hour)
    
    # Convert JD to Julian Year (approx) or just use the formula:
    # Ayanamsa = (JulianYear - 297.0) * Rate
    # Julian Year = (JD - 2451545.0) / 365.25 + 2000.0
    
    julian_year = (jd - 2451545.0) / 365.25 + 2000.0
    kp_newcomb_rate = 50.2388475 / 3600.0
    
    # User Calibration: 24 deg 12 min 28 sec for Dec 2025
    # Calculated Zero Year: 291.273
    kp_zero_year = 291.273 
    
    custom_ayanamsa = (julian_year - kp_zero_year) * kp_newcomb_rate
    
    # Set custom ayanamsa
    # Correct usage: set_sid_mode(sid_mode, t0=..., ayan_t0=...)
    # We want to say: At time jd, the Ayanamsa is custom_ayanamsa.
    swe.set_sid_mode(swe.SIDM_USER, t0=jd, ayan_t0=custom_ayanamsa)
    
    # 1. Calculate Cusps (Placidus)

    # 'P' for Placidus, flag=swe.FLG_SIDEREAL
    # houses_ex(tjdut, lat, lon, hsys, flag) -> (cusps, ascmc)
    cusps, ascmc = swe.houses_ex(jd, latitude, longitude, b'P', swe.FLG_SIDEREAL)
    
    formatted_cusps = []
    # cusps array index 0 is always 0. Houses are 1-12.
    for i in range(1, 13):
        lon = cusps[i-1]
        info = get_lord_info(lon)
        formatted_cusps.append({
            "house": i,
            "longitude": lon,
            "degree": to_dms_str(lon % 30),
            **info
        })

    # 2. Calculate Planets
    formatted_planets = []
    
    # Helper to find house placement
    # In KP, house is determined by Cusp ranges.
    # Planet is in House X if its longitude is between Cusp X and Cusp X+1
    def get_house(p_lon, cusps_list):
        # cusps_list has 12 longitudes
        for i in range(12):
            curr_cusp = cusps_list[i]
            next_cusp = cusps_list[(i+1)%12]
            
            # Handle 360 crossing
            if curr_cusp < next_cusp:
                if curr_cusp <= p_lon < next_cusp:
                    return i + 1
            else:
                # wraps around 0/360
                if p_lon >= curr_cusp or p_lon < next_cusp:
                    return i + 1
        return 1

    for p_name, p_id in PLANET_IDS.items():
        if p_name == "Ketu":
            # Ketu is opposite Rahu
            # calc_ut(tjdut, ipl, flag) -> result
            rahu_data = swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SIDEREAL)[0]
            lon = (rahu_data[0] + 180) % 360
        else:
            p_data = swe.calc_ut(jd, p_id, swe.FLG_SIDEREAL)[0]
            lon = p_data[0]
            
        info = get_lord_info(lon)
        house = get_house(lon, cusps)
        
        formatted_planets.append({
            "name": p_name,
            "longitude": lon,
            "degree": to_dms_str(lon % 30),
            "house": house,
            **info
        })

    # 3. Calculate Significators
    # KP System Significators:
    # Level 1: Planet in the Star of Occupant (O)
    # Level 2: Planet as Occupant (O)
    # Level 3: Planet in the Star of Lord (L)
    # Level 4: Planet as Lord (L)
    
    significators = []
    
    # Map house to occupant planets
    house_occupants = {h: [] for h in range(1, 13)}
    for p in formatted_planets:
        house_occupants[p["house"]].append(p["name"])
        
    # Map house to lord (Sign lord of the Cusp)
    house_lords = {c["house"]: c["signLord"] for c in formatted_cusps}
    
    for p in formatted_planets:
        p_name = p["name"]
        star_lord = p["starLord"]
        
        # Level 1: Planet (p) is in Star of X. X is in House H.
        # So p signifies H (Level 1)
        # Find who is the star lord of p -> done (star_lord)
        # Find which house the star_lord occupies
        star_lord_obj = next((x for x in formatted_planets if x["name"] == star_lord), None)
        level_1_houses = []
        if star_lord_obj:
            level_1_houses.append(star_lord_obj["house"])
        
        # Level 2: Planet (p) occupies House H
        level_2_houses = [p["house"]]
        
        # Level 3: Planet (p) is in Star of X. X is Lord of House H.
        level_3_houses = [h for h, l in house_lords.items() if l == star_lord]
        
        # Level 4: Planet (p) is Lord of House H.
        level_4_houses = [h for h, l in house_lords.items() if l == p_name]
        
        significators.append({
            "planet": p_name,
            "level1": sorted(list(set(level_1_houses))),
            "level2": sorted(list(set(level_2_houses))),
            "level3": sorted(list(set(level_3_houses))),
            "level4": sorted(list(set(level_4_houses)))
        })

    # 4. Dasa Balance
    moon_obj = next(x for x in formatted_planets if x["name"] == "Moon")
    dasa_info = calculate_full_dasa(moon_obj["longitude"], birth_dt)

    return {
        "meta": {
            "name": place_name,
            "date": birth_date,
            "time": birth_time,
            "lat": latitude,
            "long": longitude,
            "ayanamsa_used": "KP (Krishnamurti)"
        },
        "planets": formatted_planets,
        "houses": formatted_cusps,
        "significators": significators,
        "dasa": dasa_info
    }

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print(json.dumps({"error": "Usage: python3 swiss_chart_generator_kp.py date time lat long place"}))
        sys.exit(1)
        
    try:
        # Wrap in try-catch to print clean JSON error
        c_date = sys.argv[1]
        c_time = sys.argv[2]
        c_lat = float(sys.argv[3])
        c_long = float(sys.argv[4])
        c_place = sys.argv[5]
        
        result = calculate_kp_chart(c_date, c_time, c_lat, c_long, c_place)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)