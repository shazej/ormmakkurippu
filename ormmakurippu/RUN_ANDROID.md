# Running Android

## Prerequisites
1.  **Android Studio**: Install the latest stable version (Koala+).
2.  **JDK 17**: Ensure it's installed and selected in Gradle settings.

## Setup Steps

1.  **Open Project**:
    *   Launch Android Studio -> Open.
    *   Select `android/CallTrackerAndroid`.

2.  **Add Firebase Configuration**:
    *   Go to [Firebase Console](https://console.firebase.google.com/).
    *   Register an Android app with package: `com.example.calltracker`.
    *   **SHA-1**: Required for Google Sign-In. Run `./gradlew signingReport` in the terminal to get your SHA-1 fingerprint (for `debug` variant) and add it to Firebase Console.
    *   Download `google-services.json`.
    *   Move it to `android/CallTrackerAndroid/app/google-services.json`.

3.  **Sync & Run**:
    *   Click "Sync Project with Gradle Files" (Elephant icon).
    *   Connect a device or create an emulator.
    *   Click Run (Green Play icon).

## Common Issues

### "Missing google-services.json"
Build might fail or the app will say "Missing google-services.json" on the login screen. Ensure the file is valid and in the `app/` folder.

### "Sign-in Failed" (Code 10 or 12500)
Usually means the **SHA-1** fingerprint is missing from Firebase Console. You must add the debug keystore's SHA-1.
