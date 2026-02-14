# Account Profile & Security Features

## Environment Variables
Required for full functionality:
- `E2E_TEST_MODE`: Set to `true` for Demo Mode (mock DB).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: For Google OAuth.
- `GOOGLE_REDIRECT_URI`: OAuth callback.

## Features Implemented
1.  **Account Profile**: Manage emails (add, verify, set primary).
2.  **Security**:
    -   **Session Management**: List and revoke sessions.
    -   **IP Allowlist**: Restrict login to specific IP CIDRs.
    -   **Geofence**: Restrict login to specific countries.
    -   **Password**: Change password (Argon2id checked).
    -   **App Passwords**: Generate generic passwords for 3rd party apps.
3.  **MFA**:
    -   **TOTP**: Setup and Verify using Authenticator apps.
    -   **WebAuthn**: Framework and endpoints ready for Passkey integration.
4.  **Settings**:
    -   Preferences (JSON store).
    -   Notification toggles.
    -   Authorized Websites (OAuth consents).

## Demo Mode Usage
1.  Run backend: `npm run dev`.
2.  Run E2E Test: `node src/e2e-account-test.js`.
3.  Endpoints are at `/api/account/...` and require `Authorization: Bearer e2e-magic-token`.

## Audit Logging
Critical actions (Password Change, MFA Enable, etc.) are logged to `audit_logs` collection.
