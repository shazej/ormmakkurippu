# Extended Account & Privacy Features

This update adds Zoho-like account management modules.

## Features

### 1. Linked Accounts
-   **Link/Unlink**: Connect external providers (Google, GitHub, etc.).
-   **Protection**: Prevent unlinking if it's the last login method (unless password set).
-   **Endpoints**: `/api/account/linked-accounts`

### 2. Groups
-   **Contact Groups**: Create groups and manage members.
-   **Endpoints**: `/api/account/groups`

### 3. Privacy & Compliance
-   **DPA**: Initiate and revoke Data Processing Addendums.
-   **Org Contacts**: Manage privacy contacts for organizations.
-   **Certifications**: View platform compliance badges (read-only).
-   **Endpoints**: `/api/privacy/*`, `/api/compliance/*`

### 4. Activity History
-   **Audit View**: Read-only view of user's security activity.
-   **App Sign-ins**: Track usage of specific App Passwords.
-   **Endpoints**: `/api/account/activity`

### 5. Account Closure
-   **Secure Flow**: Request closure -> Email Token -> Confirm with Password/Token.
-   **Soft Lock**: Immediately locks account upon confirmation.
-   **Endpoints**: `/api/account/close`

## Verification
Run the extended E2E test suite:
```bash
E2E_TEST_MODE=true node src/index.js
node src/e2e-extended-account-test.js
```
