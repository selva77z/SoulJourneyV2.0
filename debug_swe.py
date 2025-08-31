#!/usr/bin/env python3
"""Debug Swiss Ephemeris"""

import swisseph as swe

# Test what calc_ut returns
jd = swe.julday(1990, 11, 25, 3.289)  # 3:17:25 in decimal hours

print("Testing swe.calc_ut return value:")

result = swe.calc_ut(jd, swe.SUN)
print(f"Sun result: {result}")
print(f"Type: {type(result)}")
print(f"Length: {len(result)}")

if isinstance(result, tuple):
    for i, val in enumerate(result):
        print(f"  [{i}]: {val} (type: {type(val)})")
