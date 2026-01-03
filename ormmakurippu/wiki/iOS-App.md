# iOS App

The iOS application is a native app built with **Swift** and **SwiftUI**, managing project state via **XcodeGen**.

## 🏗 Architecture

We adhere to standard **SwiftUI** patterns, often described as **MVVM**.

- **Views**: SwiftUI `View` structs.
- **ViewModels**: `ObservableObject` classes publishing changes (`@Published`) to views.
- **Project Generation**: We do **NOT** commit `.xcodeproj`. We generate it from `project.yml`.

### Key Libraries
- **XcodeGen**: Generates the `.xcodeproj` file.
- **Firebase**: Auth, Firestore, Crashlytics.

## 🛠 XcodeGen Usage

**Why?** To avoid endless merge conflicts in `project.pbxproj` and keep configuration readable.

**Policy**:
1. Never commit `.xcodeproj`.
2. Modify `ios/CallTrackeriOS/project.yml` for build settings/file inclusion changes.
3. Run generation script before opening Xcode.

**Command**:
```bash
cd ios
xcodegen generate
open CallTrackeriOS.xcodeproj
```

## 🔐 Google Sign-In & Auth

We use **Firebase Auth** with Google.
- **Configuration**: `GoogleService-Info.plist` (must be present in `ios/CallTrackeriOS/`).
- **URL Scheme**: Ensure the `REVERSED_CLIENT_ID` from the plist is added to `project.yml` or Info tab URL Types.

## 🏃‍♂️ How to Run Locally

1. **Install Dependencies**:
   ```bash
   brew install xcodegen
   ```
2. **Secrets**:
   - Place `GoogleService-Info.plist` in `ios/CallTrackeriOS/`.
3. **Generate**:
   ```bash
   cd ios
   xcodegen generate
   ```
4. **Run**:
   - Open `CallTrackeriOS.xcodeproj`.
   - Select Simulator.
   - Cmd+R.

## 🩺 Common Issues

### "Missing Referenced File"
- **Cause**: Files added but not picked up by XcodeGen?
- **Fix**: Re-run `xcodegen generate`. Ensure globs in `project.yml` cover the new file path.

### "Google Sign-In Crash"
- **Cause**: Missing URL Scheme.
- **Fix**: Verify `Info.plist` contains the reversed client ID.
