#!/bin/bash

echo "🚀 Setting up KP Astrology System for Replit..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up environment
echo "🔧 Setting up environment..."
echo "DATABASE_URL=sqlite:local.db" > .env

# Create database tables
echo "🗄️ Creating database tables..."
NODE_ENV=development npm run db:push

# Add sample data
echo "📊 Adding sample data..."
node add-dummy-data.js

# Start the application
echo "🌟 Starting KP Astrology System..."
npm run dev

