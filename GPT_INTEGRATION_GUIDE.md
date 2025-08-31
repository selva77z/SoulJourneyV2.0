# GPT Integration Guide for Soul Journey Astrology App

## Overview
This guide shows how to integrate your custom GPT with the Soul Journey astrology web application. The GPT can send birth details and receive complete astrological analysis with real planetary positions.

## API Endpoint
**URL:** `https://your-replit-domain.replit.app/api/gpt/process-birth-data`
**Method:** POST
**Content-Type:** application/json

## Request Format

### Required Fields
```json
{
  "name": "Person's full name",
  "birthDate": "YYYY-MM-DD",
  "birthTime": "HH:MM:SS",
  "birthPlace": "City, State/Province"
}
```

### Optional Fields
```json
{
  "gender": "Male/Female/Other",
  "state": "State or Province",
  "country": "Country name", 
  "latitude": "Decimal degrees",
  "longitude": "Decimal degrees",
  "timezone": "+05:30",
  "motherName": "Mother's name",
  "fatherName": "Father's name",
  "gotra": "Gotra/family lineage",
  "generateChart": true
}
```

## Example Request
```json
{
  "name": "Imran",
  "gender": "Male",
  "birthDate": "1990-11-03",
  "birthTime": "11:31:29",
  "birthPlace": "Colombo",
  "state": "Western",
  "country": "Sri Lanka",
  "latitude": "6.927079",
  "longitude": "79.861244",
  "motherName": "",
  "fatherName": "",
  "gotra": "",
  "generateChart": true
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Birth data processed successfully",
  "data": {
    "birthDataId": 123,
    "personalInfo": {
      "name": "Imran",
      "gender": "Male",
      "birthDate": "1990-11-03",
      "birthTime": "11:31:29",
      "birthPlace": "Colombo",
      "state": "Western",
      "country": "Sri Lanka"
    },
    "location": {
      "latitude": "6.927079",
      "longitude": "79.861244",
      "timezone": "+05:30"
    },
    "chart": {
      "chartData": {
        "planets": [
          {
            "name": "Sun",
            "longitude": 220.1234,
            "house": 11,
            "sign": "Scorpio",
            "degree": 10,
            "minute": 7,
            "second": 24
          }
          // ... other planets
        ],
        "houses": [
          {
            "house": 1,
            "sign": "Capricorn",
            "lord": "Saturn",
            "subLord": "Venus",
            "subSubLord": "Mercury",
            "cuspal": 4.0389
          }
          // ... other houses
        ],
        "ascendant": {
          "name": "Ascendant",
          "longitude": 274.0389,
          "house": 1,
          "sign": "Capricorn",
          "degree": 4,
          "minute": 2,
          "second": 23
        }
      },
      "kpData": {
        "significators": {
          "House1": ["Saturn", "Venus"],
          "House7": ["Moon", "Mercury"]
        },
        "rulingPlanets": ["Saturn", "Venus", "Mercury"],
        "strongHouses": [1, 4, 7, 10],
        "weakHouses": [6, 8, 12]
      }
    },
    "interpretation": "Detailed AI-generated astrological interpretation...",
    "kpDetails": {
      "lagna": "Capricorn 4°2'23\"",
      "planetaryPositions": "Real astronomical positions",
      "houseDetails": "KP house system calculations",
      "significators": "KP significator analysis",
      "rulingPlanets": "Primary ruling planets"
    }
  }
}
```

### Error Response
```json
{
  "error": "Missing required fields: name, birthDate, birthTime, birthPlace",
  "message": "Detailed error description"
}
```

## GPT Instructions
Use this prompt template for your custom GPT:

```
You are an astrology assistant that processes birth information and sends it to the Soul Journey astrology API for detailed analysis.

When a user provides birth details, extract the following information:
- Name
- Birth date (YYYY-MM-DD format)
- Birth time (HH:MM:SS format) 
- Birth place (city, state/country)
- Gender (if mentioned)
- Any additional details like parents' names

Then make a POST request to:
https://your-replit-domain.replit.app/api/gpt/process-birth-data

Include all extracted information in JSON format. The API will return:
1. Real astronomical planetary positions
2. KP astrology calculations
3. AI-generated interpretations
4. Complete chart data saved to database

Present the results in a user-friendly format, highlighting key astrological insights.
```

## What Gets Saved to Database

1. **Birth Data Table**: Personal information, birth details, location coordinates
2. **Charts Table**: Complete planetary positions, KP calculations, house details
3. **Interpretations Table**: AI-generated astrological analysis
4. **Real Astronomical Data**: Actual planetary positions using astronomy-engine library

## Data Flow
1. GPT receives user's birth details
2. GPT sends structured JSON to API endpoint
3. API calculates real astronomical positions
4. API generates KP astrology chart
5. API creates AI interpretation
6. All data saved to database for research
7. API returns complete analysis to GPT
8. GPT presents user-friendly results

## Benefits
- Real astronomical calculations (not random data)
- Complete KP astrology system
- All data stored for pattern analysis
- AI-powered interpretations
- Structured database for research
- Seamless GPT integration

## Testing
Use the test file `test-gpt-api.html` to verify the API works correctly before connecting your GPT.