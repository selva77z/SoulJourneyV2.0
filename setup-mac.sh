#!/bin/bash

# Soul Journey Astrology App - Mac Mini Setup Script
# This script sets up the development environment on Mac mini

echo "🌟 Setting up Soul Journey Astrology App on Mac Mini..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first:"
    echo "   brew install node"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Installing with Homebrew..."
    brew install postgresql
    brew services start postgresql
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/soul_journey

# OpenAI Configuration (replace with your key)
OPENAI_API_KEY=your_openai_api_key_here

# Replit Auth Configuration (optional for local development)
REPLIT_DOMAINS=localhost:5000
REPL_ID=your_repl_id
SESSION_SECRET=your_session_secret_here
ISSUER_URL=https://replit.com/oidc

# Development Mode
NODE_ENV=development
PORT=5000
EOL
    echo "✅ .env file created. Please update with your actual API keys."
fi

# Create database
echo "🗄️  Setting up database..."
createdb soul_journey 2>/dev/null || echo "Database might already exist"

# Push database schema
echo "📊 Pushing database schema..."
npm run db:push

echo "✅ Setup complete! Now you can:"
echo "   1. Update .env with your OpenAI API key"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:5000"
echo ""
echo "🔄 To sync with Replit:"
echo "   git pull origin main    # Get latest changes"
echo "   git push origin main    # Push your changes"