# Running iOS

## Prerequisites
1.  **Xcode 15+**: Install via App Store.
2.  **Homebrew**: For installing XcodeGen.

## Setup Steps

1.  **Install XcodeGen**:
    ```bash
    brew install xcodegen
    ```

2.  **Add Firebase Configuration**:
    *   Go to [Firebase Console](https://console.firebase.google.com/).
    *   Register an iOS app with Bundle ID: `com.example.CallTrackeriOS`.
    *   Download `GoogleService-Info.plist`.
    *   Place it here: `ios/CallTrackeriOS/CallTrackeriOS/GoogleService-Info.plist`.

3.  **Generate Project**:
    ```bash
    cd ios/CallTrackeriOS
    xcodegen generate
    ```

4.  **Open & Run**:
    *   Open `CallTrackeriOS.xcodeproj` (generated in the folder).
    *   Select your Target (CallTrackeriOS) and Simulator (iPhone 15).
    *   Run (Cmd+R).

## Common Issues

### "URL Schemes Missing"
Google Sign-In requires a custom URL scheme. `xcodegen` automatically adds this from your `GoogleService-Info.plist` REVERSED_CLIENT_ID if you follow the project.yml instructions, OR you need to verify it in `Info.plist`.
(In this repo, `Info.plist` expects you to maintain the `REVERSED_CLIENT_ID`).

### "Module not found"
If SPM packages are missing, wait for Xcode to resolve package graph (bottom right spinner), or go to File > Packages > Reset Package Caches.
