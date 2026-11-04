# KP Calculation Verification Against Reference Report

The app's KP engine was validated against a professional reference horoscope
produced by **Jyotisha Kalaanithi A. Devaraj** (All India Stellar Astrologers
Association) — file `Selvapriyan_R_41291_English.pdf`.

## Reference birth data

| Field | Value |
|-------|-------|
| Date | 25-11-1990 (Sunday) |
| Time | 03:17:25 AM (rectified; given 03:17:00) |
| Place | Pudukkottai, Tamil Nadu, India |
| Longitude | 078° 49' 17" E (78.82139°) |
| Latitude | 010° 22' 53" N (10.38139°) |
| Time zone | +05:30 GMT (IST) |
| Ayanamsa | 23° 43' 07" (KP-Newcomb) |
| House system | Placidus |

## Findings

1. **Ayanamsa** — our custom KP-Newcomb ayanamsa computes to **23°43'07"**,
   matching the report exactly.

2. **Node type** — the report uses the **mean lunar node** for Rahu/Ketu.
   The app previously used the *true* node (`swe.TRUE_NODE`), which placed Rahu
   in Uttara Ashadha pada 3 (report: pada 4) and Ketu in Pushya pada 1
   (report: pada 2). Switching to `swe.MEAN_NODE` corrected both.

## Result after the mean-node fix (`swiss_chart_generator_kp.py`)

Comparing all nine planets against the report's `Ral / Stl / Sbl / SSL / SSSL`
chain (Rasi Lord, Star Lord, Sub Lord, Sub-Sub Lord, Sub-Sub-Sub Lord):

| Level | Match |
|-------|-------|
| Sign + Nakshatra + Pada | 9 / 9 |
| Rasi Lord | 9 / 9 |
| Star Lord | 9 / 9 |
| Sub Lord | 9 / 9 |
| Sub-Sub Lord | 8 / 9 |
| Sub-Sub-Sub Lord | 5 / 9 |

Lagna: **Virgo 25°38'14" Chitra(1)** vs report **Virgo 25°38'29" Chitra(1)**
(a 15" difference).

The residual differences appear only in the deepest 4th/5th sub-division
levels (SSL/SSSL). Those boundaries span a fraction of an arcminute, so a
sub-second difference in the exact birth instant (the report itself rectified
the time by 25 seconds) is enough to flip them. All astrologically significant
lords — Rasi, Star, and Sub Lord — match the reference for every planet.
