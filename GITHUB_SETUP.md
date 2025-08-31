# GitHub Setup Guide: CosmicJourneyv1

## Quick Setup Steps

### 1. Create GitHub Repository
1. Go to **GitHub.com** and sign in
2. Click **"New repository"** (green button)
3. Repository name: `CosmicJourneyv1`
4. Description: `Professional KP Astrology Web Application with Authentic Astronomical Calculations`
5. Set to **Public** or **Private** (your choice)
6. **Do NOT** check "Initialize with README" (we have existing files)
7. Click **"Create repository"**

### 2. Get Repository URL
After creating, GitHub will show you commands. Copy the HTTPS URL:
```
https://github.com/YOUR_USERNAME/CosmicJourneyv1.git
```

### 3. Push from Replit

#### Option A: Using Replit's Git Interface
1. In Replit, click the **Version Control** tab (Git icon) in left sidebar
2. **Stage all changes** by clicking "+" next to files
3. **Commit message**: 
   ```
   Initial commit: CosmicJourney KP Astrology with authentic VSOP87 calculations
   ```
4. Click **"Commit & Push"**
5. **Connect to GitHub** and select your new `CosmicJourneyv1` repository
6. **Push** your code

#### Option B: Using Terminal Commands
If you have shell access in Replit:
```bash
# Remove any locks and set up remote
rm -f .git/index.lock
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/YOUR_USERNAME/CosmicJourneyv1.git

# Stage, commit and push
git add .
git commit -m "Initial commit: CosmicJourney KP Astrology with authentic VSOP87 calculations"
git branch -M main
git push -u origin main
```

### 4. Verify Upload
Visit your repository at:
```
https://github.com/YOUR_USERNAME/CosmicJourneyv1
```

## What You're Uploading

Your CosmicJourney project contains:

### Core Features
- **Authentic VSOP87 astronomical calculations** (no mock data)
- **KP-Newcomb ayanamsa** precision (23°43'07")
- **Complete Vimshottari Dasa system** with STL, SBL, SSL calculations
- **Swiss Ephemeris integration** framework
- **Seconds precision** birth time input (HH:MM:SS)

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Database**: Drizzle ORM with Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **AI**: OpenAI GPT-4o integration
- **Build**: Vite development and production setup

### Key Files
- `server/kp-calculations.js` - Authentic KP planetary calculations
- `server/swiss-ephemeris-kp.js` - Swiss Ephemeris integration
- `shared/schema.ts` - Database schema and types
- `client/src/components/kp-chart-table.tsx` - KP chart display
- `replit.md` - Project documentation and preferences

## Repository Description

**For GitHub repository description:**
```
Professional Krishnamurti Paddhati (KP) astrology web application featuring authentic VSOP87 astronomical calculations, precise KP-Newcomb ayanamsa, complete Vimshottari Dasa system, and modern React/Node.js architecture.
```

## Topics to Add
```
kp-astrology, vedic-astrology, astronomical-calculations, vsop87, react, nodejs, typescript, postgresql, astrology-app, krishnamurti-paddhati
```

## Next Steps After Upload
1. **Add README.md** with setup instructions
2. **Add .env.example** for environment variables
3. **Create releases** for version management
4. **Set up GitHub Actions** for CI/CD (optional)
5. **Add contributors** if working with others

## Local Development Setup
After cloning to local machine:
```bash
git clone https://github.com/YOUR_USERNAME/CosmicJourneyv1.git
cd CosmicJourneyv1
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```