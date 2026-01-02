# Git Workflow & Command Playbook

**Repository:** `CallTrackerNative` (Monorepo: Android, iOS, Firebase)
**Strategy:** Trunk-based development with short-lived feature branches and release tags.

---

## 1. Initial Setup

Configure your local environment to ensure commits are attributed correctly and safety configs are active.

```bash
# 1. Set Identity (if not already set globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 2. Ensure main is the default branch
git config --global init.defaultBranch main

# 3. Pull latest changes
git checkout main
git pull origin main
```

---

## 2. Feature Development

### Start a New Feature
Usage: New ticket `JIRA-123` or feature `login-ui`.

```bash
# Update main first
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/login-ui
```

### Sync with Main (Rebase Flow)
**Rule:** Do NOT merge `main` into your feature branch. Rebase instead to keep history clean.

```bash
# 1. Fetch latest main
git fetch origin main

# 2. Rebase onto main
git rebase origin/main

# 3. If conflicts arise:
#    - Edit conflicting files to resolve
#    - git add <resolved-file>
#    - git rebase --continue
```

### Push Feature
```bash
# First push
git push -u origin feature/login-ui

# After rebase (if history changed)
git push --force-with-lease origin feature/login-ui
```

---

## 3. Release Flow

### Create Release Branch
Usage: Preparing version `1.2.0`.

```bash
git checkout main
git pull origin main
git checkout -b release/v1.2.0
```

### Finalize & Tag Release
Once QA passes and release builds are generated:

```bash
# 1. Merge release into main
git checkout main
git merge --no-ff release/v1.2.0 -m "Merge release v1.2.0"

# 2. Tag the release
git tag -a v1.2.0 -m "Release v1.2.0"

# 3. Push main and tags
git push origin main
git push origin v1.2.0

# 4. cleanup
git branch -d release/v1.2.0
```

---

## 4. Hotfix Flow

Usage: Critical bug in `v1.2.0` (production).

```bash
# 1. Checkout the tag
git checkout v1.2.0
git checkout -b hotfix/v1.2.1

# 2. Apply fixes, commit
git commit -am "Fix critical crash on startup"

# 3. Merge back to main
git checkout main
git merge --no-ff hotfix/v1.2.1 -m "Merge hotfix v1.2.1"
git tag -a v1.2.1 -m "Hotfix v1.2.1"

# 4. Push
git push origin main --tags
```

---

## 5. Rollback Strategies

### Option A: Revert a Specific Commit (Safe)
Non-destructive. Adds a new commit that undoes changes.

```bash
git revert <COMMIT_HASH>
git push origin <BRANCH_NAME>
```

### Option B: Revert a Merge (Undo a Feature Merge)
If `main` is broken by a recent merge (merge commit has 2 parents).

```bash
# -m 1 specifies keeping the parent side (main)
git revert -m 1 <MERGE_COMMIT_HASH>
git push origin main
```

---

## 6. Pre-Push Safety Checklist

**STOP** and verify before pushing any branch.

### 1. Secrets Check
Run this to ensure no secrets are staged:
```bash
# Should return empty
git ls-files | grep -E "google-services.json|GoogleService-Info.plist|.*\.jks|.*\.keystore"
```
*If files appear, remove them from git tracking:*
```bash
git rm --cached <FILE_PATH>
echo "<FILE_PATH>" >> .gitignore
git commit -m "chore: remove accidental secret tracking"
```

### 2. iOS Project Policy
**Policy:** Do **NOT** commit `.xcodeproj` changes manually. Always regenerate using `XcodeGen`.
**Action:**
1.  Ensure `.gitignore` contains `*.xcodeproj` and `*.xcworkspace`.
2.  Commit changes to `ios/project.yml` only.

---

## 7. Release Day Script

Run this sequence on Release Day to ensure a clean, versioned build.

```bash
# 0. Environment
export VERSION="1.2.0"

# 1. Android Prep
cd android/CallTrackerAndroid
./gradlew clean test assembleDebug
# (Optional: ./gradlew bundleRelease)
cd ../..

# 2. iOS Prep (Regenerate Project)
cd ios
# Bump version in project.yml manually or via script, then:
xcodegen generate
xcodebuild clean build -scheme CallTrackeriOS -destination 'generic/platform=iOS Simulator'
cd ..

# 3. Allow check
# If builds failed, STOP.

# 4. Commit Version Bumps
git add android/CallTrackerAndroid/build.gradle ios/project.yml
git commit -m "chore: bump version to $VERSION"

# 5. Tag and Push
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin HEAD
git push origin "v$VERSION"

echo "Release $VERSION tagged and pushed."
```

---

# Most Used Commands (Cheat Sheet)

| Action | Command |
| :--- | :--- |
| **Start Feature** | `git checkout -b feature/name` |
| **Save Work** | `git add . && git commit -m "msg"` |
| **Update Feature** | `git fetch origin main && git rebase origin/main` |
| **Push** | `git push -u origin HEAD` |
| **Undo Commit** | `git reset --soft HEAD~1` (keep changes) |
| **Regenerate iOS** | `cd ios && xcodegen generate` |
| **Search Secrets** | `git grep "AIza"` |
