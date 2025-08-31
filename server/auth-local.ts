// Simple authentication bypass for local development
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

// Extend session type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  }
}

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP in development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

// Mock authentication middleware for development
function mockAuth(req: Request, res: Response, next: NextFunction) {
  // Auto-login as admin user for development
  if (!req.session.user) {
    req.session.user = {
      id: 'admin-001',
      email: 'admin@localhost.com',
      firstName: 'Admin',
      lastName: 'User',
      profileImageUrl: null,
    };
  }
  next();
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // In development, use mock authentication
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Using development authentication - auto-logged in as admin');
    app.use(mockAuth);
    
    // Add auth routes for development
    app.get('/api/auth/user', (req: Request, res: Response) => {
      res.json(req.session.user || null);
    });
    
    app.post('/api/auth/logout', (req: Request, res: Response) => {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
      });
    });
  }
}
