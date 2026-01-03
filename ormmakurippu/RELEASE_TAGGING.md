# Release Tagging & Strategy

## Git Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Always deployable. |
| `develop` (Optional) | Staging area for features before they merge to main. |
| `feature/*` | Individual feature work (e.g., `feature/add-calendar`). |
| `release/*` | Release preparation (e.g., `release/v1.0`). |

## Release Process

### 1. Preparation
1.  Check out a new release branch from main:
    ```bash
    git checkout -b release/v1.1.0
    ```
2.  Bump versions:
    *   **Android**: `app/build.gradle.kts` (versionCode, versionName).
    *   **iOS**: `ios/CallTrackeriOS/project.yml` (marketingVersion, currentProjectVersion).
3.  Regenerate iOS project:
    ```bash
    cd ios/CallTrackeriOS && xcodegen generate
    ```
4.  Commit changes:
    ```bash
    git commit -am "chore: bump version to v1.1.0"
    ```

### 2. Testing
*   Push the branch and let CI run.
*   Build artifacts locally and test on devices.

### 3. Tagging
Once validated, merge to `main` and tag the release.

```bash
git checkout main
git merge release/v1.1.0
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags
```

### 4. Hotfixes
If a critical bug is found in `v1.1.0`:
1.  Create `hotfix/v1.1.1` from `main`.
2.  Fix bug and bump version to `1.1.1`.
3.  Merge back to `main` and tag `v1.1.1`.
