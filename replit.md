# KP Astrology Web Application

## Overview
This project is a professional-grade web application providing authentic KP (Krishnamurti Paddhati) astrology services. It focuses on precise astronomical calculations using the KP-Newcomb ayanamsa for accurate planetary positions and house divisions, supporting advanced features like compatibility matching and AI-generated interpretations. The vision is to offer a comprehensive astrological tool with a robust backend and an intuitive user interface.

## User Preferences
Preferred communication style: Simple, everyday language.
Platform: Primarily iPad usage, requires high contrast and clear text visibility.
Design preference: Clean, simple interface focused on functionality over complex UI.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (cosmic theme), Radix UI, shadcn/ui
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL (Drizzle ORM)
- **Database Provider**: Neon (serverless PostgreSQL)
- **Authentication**: Replit Auth (OpenID Connect)
- **Session Management**: Express sessions (PostgreSQL storage)
- **API Design**: RESTful

### Key Features
- **Authentication**: Replit Auth, PostgreSQL-backed sessions, role-based access control.
- **Astrological Engine**: KP system calculations, accurate chart generation (planetary positions, house cusps, significators), compatibility matching. Uses PyEphem for astronomical calculations and KP-Newcomb Ayanamsa.
- **AI Integration**: OpenAI GPT-4o for personalized chart interpretations and natural language birth data extraction.
- **User Interface**: Custom cosmic theme, dark mode, responsive design, accessibility-focused components.

### Data Flow
- User registration, birth data entry, chart generation, AI interpretation, matching system, real-time updates.

## External Dependencies

### Core
- `@neondatabase/serverless`: PostgreSQL connectivity
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `@radix-ui/react-*`: UI component primitives
- `openai`: AI integration
- `zod`: Runtime type validation
- `pyephem`: Astronomical calculations

### Authentication
- `openid-client`: OIDC client for Replit Auth
- `passport`: Authentication middleware
- `express-session`: Session management
- `connect-pg-simple`: PostgreSQL session store

### Development & Styling
- `vite`: Build tool
- `typescript`: Language
- `tailwindcss`: CSS framework
- `eslint`: Code linting
```