# Repository Structure

The `CallTracker` repository is a **monorepo** containing all client and server code.

### 📂 Top-Level Directories

| Directory | Description |
| :--- | :--- |
| `android/` | Native Android project root. Contains the Gradle wrapper and modules. |
| `ios/` | Native iOS project root. Contains `XcodeGen` specs and Swift code. |
| `client/` | Web frontend (React + Vite) for admin dashboards. |
| `server/` | Node.js backend services (custom APIs alongside Firebase). |
| `firebase/` | Firebase configuration, security rules (`firestore.rules`), and indexes. |
| `.github/` | CI/CD workflows for GitHub Actions. |
| `wiki/` | Project documentation (this wiki). |

### 🤖 Android Structure (`android/CallTrackerAndroid`)

- `app/`: Main application module.
  - `src/main/java`: Kotlin source code.
  - `src/main/res`: XML resources (minimal, mostly for theme/manifest).
- `gradle/`: Gradle wrapper files.

### 🍎 iOS Structure (`ios/CallTrackeriOS`)

- `CallTrackeriOS/`: Source code.
  - `App/`: Entry point (`CallTrackeriOSApp.swift`).
  - `Views/`: SwiftUI Views.
  - `ViewModels/`: MVVM Logic.
  - `Models/`: Data structures.
- `project.yml`: **Critical**. The XcodeGen configuration file. **The `.xcodeproj` is generated from this.**

### 🔥 Firebase (`firebase/`)

- `firestore.rules`: Security logic for database access.
- `storage.rules`: Security logic for file uploads.
- `functions/`: Cloud Functions (if applicable).
