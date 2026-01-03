# Call Tracker Native

A production-ready repository for Call Tracker native mobile apps (Android & iOS).

## Repository Contents

| Folder | Description |
|--------|-------------|
| `android/CallTrackerAndroid` | Native Kotlin/Compose App. |
| `ios/CallTrackeriOS` | Native Swift/SwiftUI App. |
| `firebase` | Security Rules & Configs. |
| `.github/workflows` | CI Pipelines for Android & iOS. |

## Quick Start

### Android
See [RUN_ANDROID.md](RUN_ANDROID.md) for detailed setup.
1.  Add `google-services.json` to `android/CallTrackerAndroid/app/`.
2.  Open in Android Studio & Run.

### iOS
See [RUN_IOS.md](RUN_IOS.md) for detailed setup.
1.  Add `GoogleService-Info.plist` to `ios/CallTrackeriOS/CallTrackeriOS/`.
2.  Run `xcodegen generate` inside `ios/CallTrackeriOS`.
3.  Open `CallTrackeriOS.xcodeproj` & Run.

## Documentation
- [Release Checklist](RELEASE_CHECKLIST.md)
- [Final Status](FINAL_RELEASE_STATUS.md)
