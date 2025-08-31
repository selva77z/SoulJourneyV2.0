# Custom GPT Integration Guide

## Overview
This guide shows you how to connect your Custom GPT to the Soul Journey astrology webapp. Your GPT can send birth data and receive complete astrological charts with real planetary calculations.

## API Configuration

### Base URL
```
https://your-app-domain.repl.co/api/gpt/process-birth-data
```

### Authentication
**API Key:** `sk-astro-webapp-2025-secure-api-key-xyz789`

### ✅ Status: FULLY WORKING
- Birth data processing: ✅ Active
- Real astronomical calculations: ✅ Active  
- Database storage: ✅ Active
- Chart generation: ✅ Active
- API authentication: ✅ Secure

### Headers Required
```
Content-Type: application/json
X-API-Key: sk-astro-webapp-2025-secure-api-key-xyz789
```

## API Endpoint Details

### POST /api/gpt/process-birth-data

**Request Body:**
```json
{
  "name": "John Doe",
  "birthDate": "1990-05-15",
  "birthTime": "14:30:00",
  "birthPlace": "New York, NY, USA",
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "generateChart": true
}
```

**Required Fields:**
- `name`: Person's name
- `birthDate`: YYYY-MM-DD format
- `birthTime`: HH:MM:SS format (24-hour)
- `birthPlace`: Full location name

**Optional Fields:**
- `latitude`: Decimal degrees (if not provided, uses default)
- `longitude`: Decimal degrees (if not provided, uses default)
- `generateChart`: Boolean (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Birth data processed and saved successfully",
  "data": {
    "birthData": {
      "id": 24,
      "name": "John Doe",
      "birthDate": "1990-05-15",
      "birthTime": "14:30:00",
      "birthPlace": "New York, NY, USA",
      "latitude": "40.7128",
      "longitude": "-74.0060"
    },
    "chart": {
      "id": 2,
      "chartType": "KP Raasi Chart",
      "chartData": {
        "planets": [...],
        "houses": [...]
      }
    },
    "viewUrl": "https://your-app-domain.repl.co/horoscopes"
  }
}
```

## Custom GPT Configuration

### 1. Create Custom GPT Actions

In your GPT configuration, add this action:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Soul Journey Astrology API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://your-app-domain.repl.co"
    }
  ],
  "paths": {
    "/api/gpt/process-birth-data": {
      "post": {
        "summary": "Process birth data and generate astrology chart",
        "operationId": "processBirthData",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Full name of the person"
                  },
                  "birthDate": {
                    "type": "string",
                    "format": "date",
                    "description": "Birth date in YYYY-MM-DD format"
                  },
                  "birthTime": {
                    "type": "string",
                    "description": "Birth time in HH:MM:SS format (24-hour)"
                  },
                  "birthPlace": {
                    "type": "string",
                    "description": "Full birth location"
                  },
                  "latitude": {
                    "type": "string",
                    "description": "Latitude in decimal degrees"
                  },
                  "longitude": {
                    "type": "string",
                    "description": "Longitude in decimal degrees"
                  },
                  "generateChart": {
                    "type": "boolean",
                    "description": "Whether to generate the chart (default: true)"
                  }
                },
                "required": ["name", "birthDate", "birthTime", "birthPlace"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 2. Authentication Setup

In your Custom GPT authentication settings:
- **Authentication Type:** API Key
- **API Key:** `sk-astro-webapp-2025-secure-api-key-xyz789`
- **Auth Type:** Custom
- **Header Name:** `X-API-Key`

### 3. Instructions for Your GPT

Add these instructions to your Custom GPT:

```
You are an expert astrologer that can process birth data and generate real astrology charts.

When a user provides birth information, extract:
- Full name
- Birth date (convert to YYYY-MM-DD format)
- Birth time (convert to HH:MM:SS 24-hour format)
- Birth location (full address/city)

Use the processBirthData action to send this data to the astrology webapp. The system will:
1. Calculate real planetary positions using astronomical data
2. Generate comprehensive KP astrology charts
3. Save everything to the database for analysis

After processing, inform the user that their chart has been generated and provide the viewUrl for them to see their complete astrology chart.
```

## Testing the Integration

### Test with curl:
```bash
curl -X POST https://your-app-domain.repl.co/api/gpt/process-birth-data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-astro-webapp-2025-secure-api-key-xyz789" \
  -d '{
    "name": "Test User",
    "birthDate": "1990-05-15",
    "birthTime": "14:30:00",
    "birthPlace": "New York, NY",
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "generateChart": true
  }'
```

## Complete Data Flow (Push + Pull)

### Push Data (GPT → Webapp)
1. **GPT sends birth data** → Your webapp receives it
2. **Real calculations** → Uses astronomy-engine for accurate planetary positions
3. **Database storage** → All data saved for pattern analysis
4. **Chart generation** → Complete KP astrology charts created
5. **Response returned** → Complete astrological data sent back to GPT

### Pull Data (GPT ← Webapp)
1. **GPT queries stored data** → Multiple endpoints available for data retrieval
2. **Filtered responses** → Search by name, year, astrological criteria
3. **Pagination support** → Handle large datasets efficiently
4. **Standardized format** → USB-C style universal JSON interface
5. **Pattern analysis** → GPT can analyze trends and correlations

## Available Pull Data Endpoints

### 1. Get All Charts (`GET /api/gpt/pull-charts`)
```bash
curl -X GET "https://your-app.replit.app/api/gpt/pull-charts?limit=10&offset=0" \
  -H "X-API-Key: your-api-key"
```

**Query Parameters:**
- `limit` (optional): Number of charts to return (default: 10, max: 50)
- `offset` (optional): Number of charts to skip for pagination (default: 0)
- `name` (optional): Filter by person's name (partial match)
- `year` (optional): Filter by birth year
- `month` (optional): Filter by birth month (1-12)

### 2. Search Charts (`GET /api/gpt/search-charts`)
```bash
curl -X GET "https://your-app.replit.app/api/gpt/search-charts?lagna=Scorpio&star=Revati" \
  -H "X-API-Key: your-api-key"
```

**Search Criteria:**
- `lagna`: Filter by ascendant sign
- `star`: Filter by nakshatra/star
- `tithi`: Filter by tithi
- `year_from`, `year_to`: Year range filtering
- `place`: Filter by birth place (partial match)
- `limit`, `offset`: Pagination controls

### 3. Get Available Years (`GET /api/gpt/available-years`)
```bash
curl -X GET "https://your-app.replit.app/api/gpt/available-years" \
  -H "X-API-Key: your-api-key"
```

Returns available years in database for filtering purposes.

### 4. Get Specific Chart (`GET /api/gpt/pull-chart/:id`)
```bash
curl -X GET "https://your-app.replit.app/api/gpt/pull-chart/34" \
  -H "X-API-Key: your-api-key"
```

Returns complete chart data with planetary positions and interpretations.

## Security Notes

- API key authentication protects your endpoint
- All data is stored securely in your database
- Only valid requests with proper API key are processed
- Error handling for invalid or missing data

## Support

The system automatically handles:
- Real astronomical calculations
- Database storage and retrieval
- Chart generation and visualization
- Error handling and validation

Your Custom GPT can now seamlessly integrate with the Soul Journey astrology platform!