# CI/CD Workflows

We use **GitHub Actions** to automate Build, Test, and Release pipelines. Configuration is found in `.github/workflows/`.

## 🤖 Android Workflow (`android.yml`)

**Trigger**: Push to `main`, PRs to `main`.

**Steps**:
1. **Setup JDK**: Installs Java 17.
2. **Decode Secrets**: Decodes `google-services.json` from GitHub Secrets.
3. **Build**: Runs `./gradlew assembleDebug`.
4. **Test**: Runs `./gradlew test` (Unit tests).
5. **Lint**: Runs `./gradlew lint`.

## 🍎 iOS Workflow (`ios.yml`)

**Trigger**: Push to `main`, PRs to `main`.

**Steps**:
1. **Setup Xcode**: Selects appropriate Xcode version (e.g., 15.x).
2. **Install XcodeGen**: `brew install xcodegen`.
3. **Generate Project**: `xcodegen generate`.
4. **Build & Test**:
   ```bash
   xcodebuild test -scheme CallTrackeriOS -destination 'platform=iOS Simulator,name=iPhone 15'
   ```

## 🔍 Debugging CI Failures

1. **Check Logs**: Expand the failed step in GitHub Actions UI.
2. **Local Repro**:
   - **Android**: Run `./gradlew clean test` locally.
   - **iOS**: Run `xcodegen` and `xcodebuild` locally.
3. **Secret Issues**: If the build fails on missing files (e.g., `google-services.json`), verify the `BASE64` encoded secrets are set in repo settings.
