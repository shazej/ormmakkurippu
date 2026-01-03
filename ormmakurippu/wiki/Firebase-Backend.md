# Firebase Backend

The backend logic is primarily serverless, relying on the **Firebase Local Emulator Suite** for development and **Firebase Cloud** for production.

## 🔐 Authentication Model

- **Provider**: Google Sign-In (Primary).
- **User Record**: Created automatically in Firebase Auth.
- **Custom Claims**: Used for Role-Based Access Control (Admin vs User) if needed.

## 📄 Firestore Data Model

The database is a NoSQL document store (~`MongoDB` style).

**Collections**:
- `users/{userId}`: User profiles and settings.
- `calls/{callId}`: Logged calls.
  - `userId` (string): Owner.
  - `status` (enum): 'Incoming', 'Outgoing', 'Missed'.
  - `note` (string): User annotation.
- `tasks/{taskId}`: Follow-up tasks linked to calls.

## 🛡 Security Rules Philosophy

We follow a **"Safe by Default"** policy in `firestore.rules`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User data is private
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 📦 Storage Structure

- **Path**: `uploads/{userId}/{filename}`
- **Permissions**: Only the owner can read/write their own folder.

## 💥 Crashlytics & Analytics

- **Crashlytics**: Integrated in both Android and iOS to catch fatal exceptions.
- **Analytics**: Standard events (`login`, `call_logged`) logged to Google Analytics.
