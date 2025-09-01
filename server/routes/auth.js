import express from 'express';

const router = express.Router();

// Get current user
router.get('/user', (req, res) => {
  // For now, return a mock user - will implement real auth later
  const user = {
    id: 'user-001',
    email: 'user@souljourney.com',
    firstName: 'Astrology',
    lastName: 'User',
    profileImageUrl: null,
    createdAt: new Date().toISOString(),
    preferences: {
      defaultAyanamsa: 'kp-newcomb',
      timezone: '+05:30',
      language: 'en'
    }
  };
  
  res.json({
    success: true,
    user: user,
    authenticated: true
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock login - implement real authentication later
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'user-001',
        email: email,
        firstName: 'User',
        lastName: 'Name'
      },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email and password required'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required'
    });
  }
  
  // Mock registration
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: 'user-' + Date.now(),
      email,
      firstName: firstName || 'User',
      lastName: lastName || 'Name'
    }
  });
});

export default router;