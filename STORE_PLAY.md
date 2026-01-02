# Play Store Release Guide

## 1. Signing Configuration

Android apps must be signed with a release key to be uploaded to the Play Store.

### A. Generate Keystore
Run this command in your terminal to generate a secure keystore file. Store this file safely and **NEVER commit it to git**.

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key0
```
*Follow the prompts to set a password.*

### B. Configure Gradle Properties
Create or edit `android/CallTrackerAndroid/gradle.properties` (this file should also **NOT** be committed if it contains passwords, or use environment variables).

```properties
auth.keystore.file=../../release-key.jks
auth.keystore.password=YOUR_STORE_PASSWORD
auth.key.alias=key0
auth.key.password=YOUR_KEY_PASSWORD
```

### C. Update `build.gradle.kts`
Add the signing configuration to `android/CallTrackerAndroid/app/build.gradle.kts` inside the `android { ... }` block:

```kotlin
android {
    // ...
    signingConfigs {
        create("release") {
            storeFile = file(project.properties["auth.keystore.file"] as String)
            storePassword = project.properties["auth.keystore.password"] as String
            keyAlias = project.properties["auth.key.alias"] as String
            keyPassword = project.properties["auth.key.password"] as String
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true // Enable R8 for code shrinking/obfuscation
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

## 2. Google Sign-In (Release SHA-1)

**CRITICAL STEP**: Google Sign-In will FAIL in the release version if you do not add the **Release Keystore's SHA-1** to Firebase.

1.  Get the Release SHA-1:
    ```bash
    keytool -list -v -keystore release-key.jks -alias key0
    ```
2.  Copy the `SHA1` fingerprint.
3.  Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > Your Android App.
4.  Add Fingerprint > Paste the SHA-1.
5.  (Optional) Download the updated `google-services.json` (though usually not strictly required just for SHA updates, it's good practice).

## 3. Build the Bundle

To generate the `.aab` file for the Play Store:

```bash
cd android/CallTrackerAndroid
./gradlew clean bundleRelease
```

**Output Path**:
`android/CallTrackerAndroid/app/build/outputs/bundle/release/app-release.aab`

## 4. Play Store Listing Checklist

### Versioning
Update `versionCode` (integer, incrementing) and `versionName` (string) in `build.gradle.kts` before building.

### Screenshots Required
*   **Phone**: 2-8 screenshots (1080x1920 recommended).
*   **Tablet (7-inch & 10-inch)**: Required if you want tablet distribution.

**Screen Plan**:
1.  **Login**: Show Google Sign-In branding.
2.  **Dashboard**: Show stats cards populated.
3.  **Call List**: Show list with filter chips active.
4.  **Detail View**: Show call details and status buttons.

### App Description
*   **Short (80 chars)**: "Track and manage your client calls efficiently with offline support."
*   **Full (4000 chars)**:
    > Call Tracker is the ultimate tool for managing your communication logs.
    >
    > **Features**:
    > *   **Offline First**: Works without internet; syncs when online.
    > *   **Secure Cloud**: Backed by Firebase for secure data storage.
    > *   **Smart Dashboard**: View daily, new, and sent call statistics.
    > *   **Attachments**: Upload images directly to call logs.
    >
    > Perfect for sales agents, support teams, and anyone needing a reliable activity log.

### Privacy Policy
You must provide a URL to your privacy policy in the Play Console > App Content section. See `PRIVACY_POLICY.md` in this repo.
