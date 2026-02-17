# Local Development Runbook for `ormmakkurippu`

## Overview
This repository contains a **Node.js** backend (`server/`) using Express/Firebase and a **React/Vite** frontend (`call-task-logger/client/`).
It supports two modes:
1.  **Real Mode** (Default): Uses real Google Cloud/Firebase services.
2.  **Demo Mode**: Uses in-memory database mocks and mocked authentication.

## 1. Prerequisites (macOS)
Ensure you have the following installed:
- **Homebrew**: `brew install node` (or install via `nvm`)
- **Node.js**: v18+ (Verified with `node -v`)
- **Git**: `brew install git`

## 2. Repository Hygiene
Before starting, ensure the repository is clean of secrets and accidental artifacts.

### Check `.gitignore`
Run the following to verify crucial files are ignored:
```zsh
cat .gitignore | grep -E "node_modules|\.env|service-account\.json"
```
Ensure `node_modules/`, `.env`, and `*.json` (credentials) are listed.

## 3. Quick Start (Demo Mode)
**Goal**: Run the full stack locally without external dependencies.

### Steps
1.  **Install Dependencies**:
    ```zsh
    npm run install:all
    ```

2.  **Run End-to-End Test (Backend Verification)**:
    This script verifies the API health, mock authentication, and CRUD operations.
    ```zsh
    ./scripts/test-all.sh
    ```
    *Note: This script will skip lint/typecheck if they are not configured in `package.json`.*

3.  **Start Application**:
    ```zsh
    ./scripts/dev-demo.sh
    ```
    - Backend: [http://localhost:4000](http://localhost:4000)
    - Client: [http://localhost:5173](http://localhost:5173)

4.  **One-Click Login**:
    The Demo Mode backend includes a helper to bypass authentication.
    👉 **[Click here to Login automatically](http://localhost:4000/api/auth/demo-login)**
    
    This will set the session cookie and redirect you to the client dashboard.

## 4. Real Mode (With Credentials)
**Goal**: Connect to real Firebase/Google Cloud services.

### Prerequisites
1.  **Google Cloud/Firebase Project**: You need a project with Firestore and Google Drive API enabled.
2.  **Service Account**:
    - Generate a private key JSON from Firebase Console -> Project Settings -> Service Accounts.
    - Save it as `server/service-account.json` (This file is gitignored).
3.  **OAuth Credentials**:
    - Create OAuth 2.0 Client ID in Google Cloud Console.
    - Add `http://localhost:5173` and `http://localhost:4000` to Authorized Origins.
    - Add `http://localhost:4000/auth/google/callback` to Redirect config.

### Configuration
1.  **Server Environment**:
    Create `server/.env` based on `server/.env.example`:
    ```bash
    cp server/.env.example server/.env
    ```
    Populate `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

2.  **Client Environment**:
    Create `call-task-logger/client/.env`:
    ```bash
    VITE_GOOGLE_CLIENT_ID=your-client-id
    ```

### Running in Real Mode
Use the helper script which checks for credentials before starting:
```zsh
./scripts/dev-real.sh
```

## 5. Troubleshooting

### Port Conflicts
- **Error**: `EADDRINUSE: address already in use :::4000`
- **Fix**: Find and kill the process using the port.
  ```zsh
  lsof -i :4000
  kill -9 <PID>
  ```

### Client API Connection Failed
- **Symptom**: Client loads but API calls fail (Network Error).
- **Check**: Ensure `client/vite.config.js` proxy is set to `http://localhost:4000`. (This should be fixed in the repository).

### "Unauthorized" in Demo Mode
- **Symptom**: Client shows 401 errors.
- **Fix**: Use the [One-Click Login](http://localhost:4000/api/auth/demo-login) link again to refresh your session cookie.

## 6. Quality Gates
The repository now enforces strict quality gates. The `scripts/test-all.sh` script runs the following checks sequentially and fails if any error is found:

1.  **Linting**: `eslint` for both Server and Client.
2.  **Type Checking**: `tsc --noEmit` (Permissive mode) for both Server and Client.
3.  **Unit Tests**: `vitest` smoke tests for both Server and Client.
4.  **E2E Verification**: Backend CRUD test in Demo Mode.

To run these checks manually:
```bash
cd server && npm run lint
cd server && npm run typecheck
cd server && npm run test
```
(And similarly for `call-task-logger/client`)

