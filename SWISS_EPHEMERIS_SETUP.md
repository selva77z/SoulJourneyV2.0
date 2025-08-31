# Swiss Ephemeris Setup Guide

## Current Status
- Swiss Ephemeris library (`swisseph-v2`) is installed and initialized
- Data files are corrupted or missing, causing calculation errors
- System currently falls back to VSOP87 astronomical calculations

## Issue
```
Ephemeris file /home/runner/workspace/data/ephe/sepl_18.se1 is damaged (0)
```

## Solution Options

### Option 1: Download Official Swiss Ephemeris Data Files
1. **Visit**: https://www.astro.com/swisseph/
2. **Download**: Swiss Ephemeris compressed files (sepl_*.se1)
3. **Extract to**: `/home/runner/workspace/data/ephe/`
4. **Required files**:
   - `sepl_18.se1` - Main planetary ephemeris
   - `semo_18.se1` - Moon ephemeris
   - `seas_18.se1` - Asteroid ephemeris

### Option 2: Use Built-in Moshier Algorithm
- Swiss Ephemeris includes Moshier algorithm (no data files needed)
- Slightly less accurate than main ephemeris but still professional grade
- Good for testing and development

### Option 3: Alternative Swiss Ephemeris Package
Try different Node.js Swiss Ephemeris wrapper:
```bash
npm install swisseph
```

## Current Implementation Status

### ✅ Working Features
- KP-Newcomb ayanamsa (23°43'07") correctly implemented
- Complete Vimshottari Dasa system with STL, SBL, SSL
- Nakshatra calculations with pada divisions
- VSOP87 fallback providing authentic astronomical positions

### ⏳ Pending Swiss Ephemeris Integration
- Waiting for proper data files or Moshier-only configuration
- Code framework ready for immediate Swiss Ephemeris activation
- No changes needed to KP calculation logic

## Recommendation

**For immediate professional use**: Current VSOP87 implementation provides authentic astronomical positions with correct KP ayanamsa.

**For Swiss Ephemeris**: Download official data files from astro.com and replace corrupted files in `/data/ephe/` directory.

## Code Changes Required

Once Swiss Ephemeris data is available, simply uncomment in `server/routes.ts`:
```javascript
// Change from:
import { calculateKPPlanets } from "./kp-calculations";

// To:
import { calculateSwissEphemerisKP } from "./swiss-ephemeris-kp.js";
```

The system is ready for Swiss Ephemeris - only data files are missing.