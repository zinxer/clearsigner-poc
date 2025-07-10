#!/bin/bash

# tx-clearsigner backend Installation Script
echo "🔧 Setting up tx-clearsigner backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and database URL"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run db:generate

echo ""
echo "✅ Installation completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your API keys and database URL"
echo "2. Set up your PostgreSQL database"
echo "3. Run 'npm run db:push' to create database tables"
echo "4. Initialize chains and system tags: 'npm run db:init'"
echo "5. Start development server with 'npm run dev'"
echo ""
echo "🚀 API will be available at http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"