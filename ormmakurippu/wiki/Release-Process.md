# Release Process

This document outlines how we package and distribute the Call Tracker apps.

## 🏷 Versioning Strategy

We follow **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`.
- **v1.2.0** -> New features.
- **v1.2.1** -> Bug fixes.

**Git Tags**: All releases MUST be tagged.
- Format: `vX.Y.Z` (e.g., `v1.0.0`).

## 🤖 Android Release (Play Store)

1. **Bump Version**:
   - Update `versionCode` and `versionName` in `android/CallTrackerAndroid/app/build.gradle.kts`.
2. **Build Bundle**:
   ```bash
   cd android/CallTrackerAndroid
   ./gradlew bundleRelease
   ```
   *Output: `app/build/outputs/bundle/release/app-release.aab`*
3. **Upload**:
   - Manually upload `.aab` to **Google Play Console** -> Internal Testing / Production.

## 🍎 iOS Release (TestFlight / App Store)

1. **Bump Version**:
   - Update `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in `ios/CallTrackeriOS/project.yml`.
   - Run `xcodegen generate`.
2. **Archive**:
   - Open Xcode.
   - Product -> Archive.
3. **Upload**:
   - Use **Xcode Organizer** to "Distribute App" -> "App Store Connect".
   - Wait for processing, then release via **TestFlight**.

## 🚀 Release Day Checklist

1. [ ] Run full regression tests locally.
2. [ ] Ensure `GIT_WORKFLOW.md` release steps are followed (branch off main).
3. [ ] Tag the release in Git (`git tag v1.x.y`).
4. [ ] Push tags (`git push origin --tags`).
