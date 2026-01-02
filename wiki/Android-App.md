# Android App

The Android application is a modern, native App build with **Kotlin** and **Jetpack Compose**.

## 🏗 Architecture

We follow the **MVVM (Model-View-ViewModel)** pattern with **Unidirectional Data Flow (UDF)**.

- **UI Layer**: Jetpack Compose Composables.
- **ViewModel**: Hilt-injected ViewModels holding `StateFlow` for UI state.
- **Data Layer**: Repositories that arbitrate between Local (Room) and Remote (Firestore).

### Key Libraries
- **DI**: Hilt (Dagger).
- **Local DB**: Room (SQLite abstraction).
- **Concurrency**: Kotlin Coroutines & Flow.
- **Network**: Firebase SDK.

## 🔐 Auth Flow

Authentication is handled via **Firebase Auth** with **Google Sign-In**.
1. app launches `GoogleSignInClient`.
2. Token retrieved and sent to `FirebaseAuth.signInWithCredential`.
3. On success, `AuthRepository` updates the session state.

## 📡 Offline Sync Strategy

The app is **Offline-First**:
1. **Reads**: Always read from `Room` database (single source of truth for UI).
2. **Writes**: Write to `Room` first, then enqueue a background worker (WorkManager) or immediate coroutine to sync with Firestore.
3. **Sync**: A `SyncRepository` listens for Firestore changes and updates `Room`.

## 🏃‍♂️ How to Run Locally

1. **Prerequisites**:
   - Android Studio Koala or newer.
   - JDK 17+.
2. **Secrets**:
   - Place `google-services.json` in `android/CallTrackerAndroid/app/`.
3. **Build**:
   ```bash
   cd android/CallTrackerAndroid
   ./gradlew clean assembleDebug
   ```
4. **Run**:
   Select `app` configuration in Android Studio and run on Emulator/Device.

## 🩺 Common Issues

### "Google Sign-In Failed 10"
- **Cause**: SHA-1 fingerprint mismatch in Firebase Console.
- **Fix**: Run `./gradlew signingReport`, copy the `SHA1` (Debug), and add it to Firebase Console -> Project Settings -> Android App.

### "Class '...' not found" (Hilt/KAPT)
- **Fix**: Perform a clean build: `./gradlew clean`. Re-sync Gradle.
