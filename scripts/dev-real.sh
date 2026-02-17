#!/bin/zsh

# scripts/dev-real.sh
# STRICT MODE: Requires external GOOGLE_APPLICATION_CREDENTIALS.

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "🏭 Setting up Real Mode Environment..."

# 1. Validate Credentials Variable
if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS}" ]]; then
    echo "❌ Error: GOOGLE_APPLICATION_CREDENTIALS is not set."
    echo "   You must export this variable pointing to a JSON file OUTSIDE the repository."
    echo "   Example: export GOOGLE_APPLICATION_CREDENTIALS=~/.config/ormmakurippu/service-account.json"
    exit 1
fi

# 2. Validate Credentials Path (Security Check)
REPO_ROOT=$(pwd)
CRED_PATH="${GOOGLE_APPLICATION_CREDENTIALS}"

# Resolve absolute path of creds (if possible)
# Note: realpath might not be available on all macs by default without coreutils, but zsh has :A modifier
# Simple string check: does it start with repo root?
if [[ "$CRED_PATH" == "$REPO_ROOT"* ]] || [[ "$CRED_PATH" == "./"* ]]; then
    echo "❌ SECURITY ERROR: Credentials file appears to be inside the repository."
    echo "   Repo: $REPO_ROOT"
    echo "   Cred: $CRED_PATH"
    echo "   Please move your secrets to a secure location outside the project folder."
    exit 1
fi

if [ ! -f "$CRED_PATH" ]; then
    echo "❌ Error: Credential file not found at: $CRED_PATH"
    exit 1
fi

echo "✅ Credentials validated: $CRED_PATH"

# 3. Check for OAuth Env
if [[ ! -f "server/.env" ]]; then
    echo "⚠️  Warning: server/.env file not found. OAuth might fail."
fi

echo "🚀 Starting App in Real Mode..."
npm run dev
