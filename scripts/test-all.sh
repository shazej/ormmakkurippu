#!/bin/zsh

# scripts/test-all.sh
# STRICT MODE: Fails if any step fails or is missing.

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# Function to run a command and fail hard if it errors
run_gate() {
    local name="$1"
    local cmd="$2"
    echo "============================================================"
    echo "🔍 Running Gate: $name"
    echo "   Command: $cmd"
    echo "============================================================"
    
    (eval "$cmd")
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo "❌ GATE FAILED: $name (Exit Code: $exit_code)"
        exit $exit_code
    else
        echo "✅ GATE PASSED: $name"
        echo ""
    fi
}

echo "🛡️  Starting Strict Quality Gates..."

# 1. Server Gates
run_gate "Server Lint" "cd server && npm run lint"
run_gate "Server Typecheck" "cd server && npm run typecheck"
run_gate "Server Unit Tests" "cd server && npm run test"

# 2. Client Gates
run_gate "Client Lint" "cd call-task-logger/client && npm run lint"
run_gate "Client Typecheck" "cd call-task-logger/client && npm run typecheck"
run_gate "Client Unit Tests" "cd call-task-logger/client && npm run test"

# 3. E2E Verification (Backend)
echo "============================================================"
echo "🧪 Running Backend E2E Verification (Demo Mode)"
echo "============================================================"

# Start Server in Background
export E2E_TEST_MODE=true
# Use clean log file
LOG_FILE="/tmp/ormmakurippu-e2e.log"
rm -f "$LOG_FILE"

echo "   Starting server (E2E_TEST_MODE=true)..."
# Ensure deps are installed (should be done by now)
if [ ! -d "server/node_modules" ]; then
    echo "❌ Missing server/node_modules. Run 'npm run install:all' first."
    exit 1
fi

node server/src/index.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Cleanup function
cleanup() {
    echo "   Stopping server (PID $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
}
trap cleanup EXIT

# Wait for port 4000
echo "   Waiting for server port 4000..."
max_attempts=30
count=0
while ! nc -z localhost 4000; do
    sleep 1
    count=$((count+1))
    if [ $count -ge $max_attempts ]; then
        echo "❌ Server failed to start."
        cat "$LOG_FILE"
        exit 1
    fi
done
echo "✅ Server is up."

# Run Verification
run_gate "E2E Script" "node server/verify_e2e.js"

echo "🎉 ALL QUALITY GATES PASSED!"
exit 0
