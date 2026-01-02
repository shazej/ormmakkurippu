# Incident Response Playbook

## 1. Triage & Correlation
When a user reports an issue, use this flow to identify the root cause.

| Symptom | Check First | Tool |
|---------|-------------|------|
| "App Crashes on Launch" | Crashlytics | **Firebase Console > Crashlytics** |
| "Login Failed" | Auth Logs | **Firebase Console > Authentication > Users** |
| "Data Not Syncing" | Firestore Usage | **Firebase Console > Firestore > Usage** |
| "Images Not Uploading" | Storage Rules | **Firebase Console > Storage > Rules** |

### Correlation Steps
1.  **Ask for User ID**: "What is your email?" -> Find UID in Auth.
2.  **Filter Crashlytics**: Filter by `user_id` in Crashlytics to see if they experienced a crash.
3.  **Check Analytics**: Look at `StreamView` or `DebugView` to see their recent event trail (`app_open`, `login_attempt`).

## 2. Common Scenarios

### Scenario A: Login Failure (Code 10 / 12500)
*   **Cause**: SHA-1 fingerprint mismatch.
*   **Verification**: Check if `release-key` SHA-1 is in Firebase Console.
*   **Fix**: Add SHA-1 and wait 5 minutes. No app update needed.

### Scenario B: "Missing Permissions" (Firestore)
*   **Cause**: Security Rules blocking access.
*   **Verification**: Check **Firebase Console > Firestore > Rules Monitor** for denied requests.
*   **Fix**: Update `firestore.rules` and deploy: `firebase deploy --only firestore`.

### Scenario C: Crash Loop (Bad Update)
*   **Cause**: Bug in new release.
*   **Verification**: Spike in crash-free users dropping below 99%.
*   **Fix**:
    1.  **Halt Rollout**: Pause Play Store / App Store Phased Release.
    2.  **Rollback**: You cannot "undo" a binary release. You must build a **Hotfix** with a higher version code and release it immediately.

## 3. Hotfix Strategy
1.  Branch from the conflicting tag: `git checkout -b hotfix/v1.1.1 v1.1.0`
2.  Apply fix.
3.  Bump version code (+1).
4.  Tag `v1.1.1` and release.

## 4. Operational Contacts
[List team/on-call contacts here]
