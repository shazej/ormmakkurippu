# Security & Compliance

## 🔐 Handling Secrets

**STRICT RULE**: Never commit API keys, Keystores, or Service Credentials to Git.

### Managed Files (GitIgnored)
- **Android**: `google-services.json`, `release-keystore.jks`.
- **iOS**: `GoogleService-Info.plist`.
- **Backend**: `service-account.json`, `.env`.

**How members get keys**:
- Use the team's secure credential manager (e.g., 1Password, LastPass) to download these files during onboarding.

## 🛡 Firestore Security Levels

| Collection | Access Level |
| :--- | :--- |
| `users` | **Private** (Owner only). |
| `calls` | **Private** (Owner only). |
| `public_config` | **Public Read** (If applicable). |

## ⚖️ Privacy & Data Retention

- **User Data**: Stored in Firestore `users/{uid}`.
- **Deletion**: App provides a "Delete Account" button.
  - **Action**: Must trigger Cloud Function to recursively delete user data in Firestore and Storage.
- **GDPR/CCPA**: We map UIDs to data. Deletion requests are honored physically (hard delete).
