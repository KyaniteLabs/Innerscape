#!/bin/bash
# LifeOS Local Development Setup Script
# This script sets up everything needed for local testing

set -e  # Exit on error

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          LifeOS Local Development Setup                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Step 1/5: Installing shared package dependencies..."
cd lifeos-shared
npm install --silent
echo "   Building shared package..."
npm run build
cd ..
echo "   ✅ Shared package ready"
echo ""

echo "📦 Step 2/5: Installing backend dependencies..."
cd lifeos-backend
npm install --silent
echo "   ✅ Backend dependencies installed"
echo ""

echo "🗄️  Step 3/5: Setting up local database..."
# Push schema to local SQLite database
npm run db:push 2>&1 | grep -E "(Creating|Done|Push)" || true
echo "   ✅ Database schema created"
echo ""

echo "🌱 Step 4/5: Seeding test data..."
npm run db:seed 2>&1 | grep -E "(\[APEX\]|Test user)" || true
echo "   ✅ Test data seeded"
cd ..
echo ""

echo "📱 Step 5/5: Installing mobile dependencies..."
cd innerscape-mobile
npm install --silent
echo "   ✅ Mobile dependencies installed"
cd ..
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETE                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "To start testing, run these commands in separate terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd lifeos-backend && npm run dev:local"
echo ""
echo "  Terminal 2 (Mobile):"
echo "    cd innerscape-mobile && npm start"
echo ""
echo "Then press 'i' for iOS Simulator or 'a' for Android Emulator"
echo ""
echo "Test user ID: local-dev-user"
echo "API endpoint: http://localhost:8787/api"
echo ""
echo "Test the backend with:"
echo "  curl http://localhost:8787/"
echo "  curl http://localhost:8787/api/flow/habits"
echo ""
