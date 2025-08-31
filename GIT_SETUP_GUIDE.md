# Git Setup Guide for Mac Mini Development

## Overview
This guide will help you set up the Soul Journey astrology app on your Mac mini with Git synchronization for seamless development between Replit and your local environment.

## Prerequisites
- Mac mini with macOS
- Visual Studio Code installed
- Node.js 20+ installed
- Git installed
- PostgreSQL installed (or Docker for database)

## Step 1: Initialize Git Repository in Replit

```bash
# Run these commands in Replit terminal
git init
git add .
git commit -m "Initial commit: Soul Journey astrology app with Vedic calculations"
```

## Step 2: Create GitHub Repository
1. Go to GitHub and create a new repository called `soul-journey-astrology`
2. Don't initialize with README (we already have files)
3. Copy the repository URL

## Step 3: Connect Replit to GitHub

```bash
# In Replit terminal, add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/soul-journey-astrology.git
git branch -M main
git push -u origin main
```

## Step 4: Clone to Mac Mini

```bash
# On your Mac mini terminal
git clone https://github.com/YOUR_USERNAME/soul-journey-astrology.git
cd soul-journey-astrology
```

## Step 5: Environment Setup on Mac Mini

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create `.env` file:
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/soul_journey

# OpenAI (get from OpenAI dashboard)
OPENAI_API_KEY=your_openai_api_key_here

# Replit Auth (for local development, you can disable auth)
REPLIT_DOMAINS=localhost:5000
REPL_ID=your_repl_id
SESSION_SECRET=your_session_secret_here
```

### Database Setup
```bash
# Option 1: PostgreSQL locally
brew install postgresql
brew services start postgresql
createdb soul_journey

# Option 2: Use Docker
docker run --name soul_journey_db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Push schema to database
npm run db:push
```

## Step 6: Development Workflow

### Running the App
```bash
# Start development server
npm run dev
```

### Git Workflow
```bash
# Make changes on Mac mini
git add .
git commit -m "Your changes description"
git push origin main

# Pull changes in Replit
git pull origin main
```

### Sync Changes Back to Replit
```bash
# In Replit terminal
git pull origin main
```

## Step 7: Optional - Disable Auth for Local Development

If you want to run without Replit Auth on Mac mini, you can modify `server/index.ts`:

```typescript
// Add this check in registerRoutes function
if (process.env.NODE_ENV === 'development' && !process.env.REPLIT_DOMAINS) {
  // Skip auth setup for local development
  console.log('Running in local mode without auth');
} else {
  await setupAuth(app);
}
```

## Key Files to Understand

### Configuration Files
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Database configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration

### Backend Structure
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API endpoints
- `server/services/astrology.ts` - Astronomical calculations
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Database schema and types

### Frontend Structure
- `client/src/App.tsx` - Main React app
- `client/src/pages/` - Page components
- `client/src/components/` - UI components

## Development Tips

### Hot Reload
Both environments support hot reload:
- Replit: Automatic with workflow
- Mac mini: `npm run dev` starts Vite dev server

### Database Changes
```bash
# After modifying shared/schema.ts
npm run db:push
```

### Testing API Endpoints
```bash
# Test GPT integration
curl -X POST "http://localhost:5000/api/gpt/process-birth-data" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-astro-webapp-2025-secure-api-key-xyz789" \
  -d '{"name": "Test", "birthDate": "1990-01-01", "birthTime": "12:00:00", "birthPlace": "New York"}'
```

## Troubleshooting

### Port Conflicts
If port 5000 is in use:
```bash
# Change port in server/index.ts
const PORT = process.env.PORT || 3000;
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql -h localhost -U postgres -d soul_journey
```

### Authentication Issues
For local development, you can temporarily disable auth by setting:
```bash
export SKIP_AUTH=true
```

## Sync Strategy

### Replit → Mac Mini
1. Make changes in Replit
2. Git commit and push
3. Pull on Mac mini

### Mac Mini → Replit
1. Make changes on Mac mini
2. Git commit and push
3. Pull in Replit

This setup gives you the flexibility to develop on both platforms while maintaining code synchronization through Git.