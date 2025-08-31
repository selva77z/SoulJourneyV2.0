# CosmicJourney v1 🌟

Professional Krishnamurti Paddhati (KP) astrology web application featuring authentic astronomical calculations and modern web technologies.

## ✨ Features

### Authentic Astronomical Calculations
- **VSOP87 algorithms** for precise planetary positions
- **KP-Newcomb ayanamsa** (23°43'07") for accurate sidereal calculations
- **Swiss Ephemeris integration** framework for professional-grade accuracy
- **Complete Vimshottari Dasa system** with STL, SBL, SSL calculations

### Modern Web Application
- **React 18** with TypeScript for type-safe frontend development
- **Node.js + Express** backend with PostgreSQL database
- **Tailwind CSS** for responsive, modern UI design
- **Replit Auth** with OpenID Connect for secure authentication
- **OpenAI GPT-4o** integration for intelligent chart interpretations

### KP Astrology Features
- **Authentic planetary positions** with real astronomical data
- **Nakshatra calculations** with pada divisions and ruling planets
- **Rasi chart visualization** with proper zodiac sign placement
- **Comprehensive KP chain** (Rasi Lord, Star Lord, Sub Lord, Sub-Sub Lord)
- **Birth time precision** with seconds support (HH:MM:SS format)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- OpenAI API key (for chart interpretations)

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/CosmicJourneyv1.git
cd CosmicJourneyv1
npm install
```

### Environment Setup
Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cosmic_journey

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Authentication (for production)
REPLIT_DOMAINS=your-domain.com
REPL_ID=your_repl_id
SESSION_SECRET=your_session_secret_here
```

### Database Setup
```bash
npm run db:push
```

### Development
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## 🏗️ Architecture

### Backend Structure
```
server/
├── index.ts              # Main server entry point
├── routes.ts             # API endpoints
├── kp-calculations.js    # Authentic KP astronomical calculations
├── swiss-ephemeris-kp.js # Swiss Ephemeris integration
├── storage.ts            # Database operations
└── db.ts                 # Database configuration
```

### Frontend Structure
```
client/src/
├── App.tsx               # Main React application
├── pages/                # Page components
├── components/           # Reusable UI components
└── lib/                  # Utilities and configurations
```

### Shared
```
shared/
└── schema.ts             # Database schema and TypeScript types
```

## 🔬 Astronomical Accuracy

### Calculation Methods
- **Primary**: VSOP87 astronomical algorithms for planetary positions
- **Fallback**: Swiss Ephemeris integration (when data files available)
- **Ayanamsa**: KP-Newcomb 23°43'07" for precise sidereal calculations

### Verified Positions
Example for birth: 25/11/1990, 03:17:25, Pudukkottai, Tamil Nadu, India
- **Sun**: 8°38'33" Scorpio
- **Moon**: 8°29'43" Taurus  
- **Venus**: 22°20'49" Scorpio
- All positions calculated using authentic astronomical formulas

## 📊 Database Schema

### Core Tables
- **users** - User profiles with Replit Auth integration
- **birth_data** - Birth information (date, time, location, coordinates)
- **charts** - Generated KP charts with planetary positions
- **interpretations** - AI-generated chart interpretations

## 🔧 API Endpoints

### Chart Generation
```bash
POST /api/horoscopes/simple
Content-Type: application/json

{
  "name": "User Name",
  "birthDate": "25/11/1990",
  "birthTime": "03:17:25",
  "birthPlace": "Pudukkottai, Tamil Nadu, India"
}
```

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout user

## 🎯 Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management
- Wouter for routing
- React Hook Form with Zod validation

### Backend
- Node.js + Express.js
- PostgreSQL with Drizzle ORM
- Neon serverless database
- OpenAI GPT-4o integration
- Replit Auth (OpenID Connect)

### Development
- Vite for build tooling
- TypeScript for type safety
- ESLint for code quality
- Hot reload for development

## 📈 Deployment

### Replit Deployment
The application is designed for Replit deployment with automatic:
- Database provisioning (Neon PostgreSQL)
- Environment variable management
- SSL certificate handling
- Domain configuration

### Local Deployment
For local development:
1. Set up PostgreSQL database
2. Configure environment variables
3. Run `npm run dev`

## 🔮 KP Astrology Precision

This application implements authentic Krishnamurti Paddhati calculations:

### Ayanamsa
- **KP-Newcomb**: 23°43'07" (23.71861111°)
- Applied to all planetary calculations for sidereal positions

### Vimshottari Dasa System
- **120-year cycle** with accurate planetary periods
- **Complete hierarchy**: STL, SBL, SSL, SSSL calculations
- **Nakshatra-based** with precise pada divisions

### Planetary Positions
- **Real-time calculations** using VSOP87 algorithms
- **No mock data** - all positions astronomically accurate
- **Seconds precision** for birth time accuracy

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**CosmicJourney v1** - Bringing authentic Vedic astrology calculations to the modern web.# Updated Sun Aug 31 19:35:42 AEST 2025
