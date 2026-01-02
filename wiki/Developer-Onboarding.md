# Developer Onboarding

Welcome to the team! Follow this guide to get the app running in < 20 minutes.

## ✅ First-Day Checklist

- [ ] Install **Android Studio** (Koala+).
- [ ] Install **Xcode** (15+).
- [ ] Install **Node.js** (v18+) and **Homebrew**.
- [ ] Gain access to **GitHub** Repo.
- [ ] Gain access to **Firebase Console**.
- [ ] Retrieve **Secret Config Files** from team password manager.

## 🛠 Environment Setup

### 1. Repository Setup
```bash
git clone git@github.com:shazej/ormmakkurippu.git
cd ormmakkurippu
```

### 2. Android Setup
1. Copy `google-services.json` to `android/CallTrackerAndroid/app/`.
2. Open `android/CallTrackerAndroid` in Android Studio.
3. Sync Gradle.

### 3. iOS Setup
1. Install tools:
   ```bash
   brew install xcodegen cocoapods
   ```
2. Copy `GoogleService-Info.plist` to `ios/CallTrackeriOS/`.
3. Generate Project:
   ```bash
   cd ios
   xcodegen generate
   ```
4. Open `CallTrackeriOS.xcodeproj` in Xcode.

## 🚀 Run the App

**Android**:
- Select `app` target.
- Hit **Run** (Green Arrow).

**iOS**:
- Select `CallTrackeriOS` scheme.
- Hit **Run** (Cmd+R).
