# ormmakurippu

Call Task Logger with Google Drive Integration and Firestore.

## Setup

### Prerequisites
1.  Node.js (v18+)
2.  Firebase Project
3.  Google Cloud Project (for Drive API)

### Service Account (Backend)
1.  Go to Firebase Console -> Project Settings -> Service Accounts.
2.  Generate a new private key.
3.  Save the file as `service-account.json` in `server/`.
    *   *Alternatively, export `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`*

### Google OAuth (Frontend & Backend)
1.  Go to Google Cloud Console -> APIs & Services -> Credentials.
2.  Create OAuth 2.0 Client ID (Web Application).
3.  Add Authorized URI: `http://localhost:5173` (Frontend).
4.  Add Authorized Redirect URI: `http://localhost:5173` (or your production URL).
5.  Copy Client ID and Client Secret.

### Configuration
1.  **Backend**: Create `server/.env` based on `server/.env.example`.
    ```bash
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    GOOGLE_REDIRECT_URI=http://localhost:5173
    ```
2.  **Frontend**: Create `client/.env` (or set in local dev).
    ```bash
    VITE_GOOGLE_CLIENT_ID=...
    ```

### Installation
```bash
npm run install:all
```

### Running
```bash
npm run dev
```

## Features
- **Task Management**: Create, edit, delete tasks. Saved to Firestore.
- **Attachments**: Login with Google to upload files to "ormmakurippu" folder in your Drive.
- **Export**: Export tasks to CSV.
