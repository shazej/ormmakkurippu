# Release Checklist

## Android Release
- [ ] **Versioning**: Update `versionCode` and `versionName` in `app/build.gradle.kts`.
- [ ] **Signing**: Generate a Release Keystore (`.jks`).
- [ ] **Config**: Create `signingConfigs` for release in gradle.
- [ ] **Minification**: Set `isMinifyEnabled = true` for release build type.
- [ ] **Firebase**: Ensure `google-services.json` is for properties (Production).
- [ ] **SHA-1**: Add Release Keystore SHA-1 to Firebase Console.
- [ ] **Build**: `./gradlew bundleRelease`.

## iOS Release
- [ ] **Versioning**: Update version in `project.yml` or Xcode settings.
- [ ] **Distribution Cert**: Ensure you have a valid Apple Distribution certificate.
- [ ] **Provisioning**: Select "Any iOS Device" and Archive.
- [ ] **Firebase**: Ensure `GoogleService-Info.plist` is for Production.
- [ ] **Icons**: Verify all AppIcon sizes in `Assets.xcassets`.
- [ ] **Upload**: Distribute via TestFlight / App Store Connect.
