import sys
import math
from swiss_chart_generator_kp import calculate_kp_chart

def get_padham(longitude, nakshatra_name):
    # Nakshatra span is 13deg 20min = 13.3333... deg
    # Padham span is 3deg 20min = 3.3333... deg
    # Padham = int((lon % 13.333) / 3.333) + 1
    
    # We need to be careful with boundary conditions.
    # Normalize lon to 0-360? 
    # Actually, Nakshatra starts from 0 Aries.
    # So using absolute longitude is fine.
    
    nak_length = 13.333333333333334
    padham_length = 3.3333333333333335
    
    # Position within Nakshatra
    # Find start of nakshatra
    # We can just modulus
    pos_in_nak = longitude % nak_length
    padham = int(pos_in_nak / padham_length) + 1
    return padham

def print_tables(c_date, c_time, c_lat, c_long, c_place):
    data = calculate_kp_chart(c_date, c_time, c_lat, c_long, c_place)
    
    # 9 Planet Positions
    print("**9 Planet Positions** (KP Newcomb)")
    print("| Planet Rasi | Star(Padham) | Ral | Stl | Sbl | SSL | SSSL |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    
    # Order: Sun, Moon, Mar, Mer, Jup, Ven, Sat, Rah, Ket
    order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
    planet_map = {p["name"]: p for p in data["planets"]}
    
    # Short names mapping
    short_names = {
        "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me", 
        "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke"
    }
    
    for name in order:
        p = planet_map[name]
        padham = get_padham(p["longitude"], p["nakshatra"])
        p_short = name[:3] 
        rasi = p["sign"]
        star = p["nakshatra"]
        
        ral = short_names.get(p["signLord"], p["signLord"][:2])
        stl = short_names.get(p["starLord"], p["starLord"][:2])
        sbl = short_names.get(p["subLord"], p["subLord"][:2])
        ssl = short_names.get(p["subSubLord"], p["subSubLord"][:2])
        sssl = short_names.get(p["subSubSubLord"], p["subSubSubLord"][:2])
        
        print(f"| **{p_short}** ({rasi}) | {star} ({padham}) | {ral} | {stl} | {sbl} | {ssl} | {sssl} |")
        
    print("\n**12 Bhava Cuspal Positions**")
    print("| CuRasi | Star(Padham) | Ral | Stl | Sbl | SSL | SSSL |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    
    for c in data["houses"]:
        h_num = c["house"]
        padham = get_padham(c["longitude"], c["nakshatra"])
        rasi = c["sign"]
        star = c["nakshatra"]
        
        ral = short_names.get(c["signLord"], c["signLord"][:2])
        stl = short_names.get(c["starLord"], c["starLord"][:2])
        sbl = short_names.get(c["subLord"], c["subLord"][:2])
        ssl = short_names.get(c["subSubLord"], c["subSubLord"][:2])
        sssl = short_names.get(c["subSubSubLord"], c["subSubSubLord"][:2])
        
        print(f"| **{h_num}** ({rasi}) | {star} ({padham}) | {ral} | {stl} | {sbl} | {ssl} | {sssl} |")

    # Dasa
    d = data["dasa"]
    print(f"\n**Dasa Balance**: {d['currentDasa']} balance: {d['balanceYears']:.2f} years (Ends: {d['dasaEndDate']})")

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python3 print_kp_table.py date time lat long place")
        sys.exit(1)
        
    print_tables(sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5])
