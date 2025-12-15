from datetime import datetime
import swisseph as swe

def find_zero_year():
    # Target: 24 deg 12 min 28 sec
    target_deg = 24 + 12/60.0 + 28/3600.0
    print(f"Target Degrees: {target_deg}")

    # Current Date: 2025-12-12
    # JD for noon
    jd_now = swe.julday(2025, 12, 12, 12.0)
    
    # Julian Year 
    julian_year_now = (jd_now - 2451545.0) / 365.25 + 2000.0
    print(f"Current Julian Year: {julian_year_now}")
    
    # Formula: A = (T - Z) * Rate
    # Z = T - (A / Rate)
    
    kp_newcomb_rate = 50.2388475 / 3600.0 # deg per year
    
    zero_year = julian_year_now - (target_deg / kp_newcomb_rate)
    
    print(f"Calculated Zero Year: {zero_year}")
    
    # Verify
    calc_val = (julian_year_now - zero_year) * kp_newcomb_rate
    print(f"Verification Check: {calc_val} (Target: {target_deg})")
    
    d = int(calc_val)
    m = int((calc_val - d) * 60)
    s = (calc_val - d - m/60) * 3600
    print(f"Formatted: {d} {m} {s:.2f}")

if __name__ == "__main__":
    find_zero_year()
