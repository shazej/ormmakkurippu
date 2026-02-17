#!/bin/zsh

# scripts/dev-demo.sh
# Starts the app in Demo Mode (Mock DB, Mock Auth)

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "🧪 Setting up Demo Mode Environment..."
export E2E_TEST_MODE=true

# Check node version
echo "Checking Node version..."
node -v

# Install dependencies if missing (basic check)
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
fi

echo "🚀 Starting App in Demo Mode..."
echo "   - Backend: http://localhost:4000"
echo "   - Client:  http://localhost:5173"
echo ""
echo "👉 ONE-CLICK LOGIN: Open the following URL to authenticate automatically:"
echo "   http://localhost:4000/api/auth/demo-login"
echo ""

npm run dev
