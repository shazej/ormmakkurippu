# Monitoring & Operations

We use **Firebase** tools to monitor stability and user engagement.

## 💥 Crashlytics Usage

**Goal**: Maintains >99% Crash-Free Users.

- **Fatal Crashes**: Priority 1. Must be fixed immediately (Hotfix).
- **Non-Fatals**: Logged via `Crashlytics.recordException()`. Review weekly.

**Integration**:
- **Android**: Plugin applied in `build.gradle.kts`.
- **iOS**: Script build phase configured in `project.yml`.

## 📊 Analytics Events

We track key flows to understand app usage:

| Event Name | Parameter | Description |
| :--- | :--- | :--- |
| `app_open` | - | App launched. |
| `login_success` | `method` | User logged in (Google). |
| `call_logged` | `type`, `duration` | A call was saved to DB. |
| `sync_complete` | `records_count` | Offline sync finished. |

## 🚨 Incident Response

**Scenario: Broken Release**
1. **Identify**: Crashlytics spike alerting.
2. **Triaging**: Revert changes via Git or prepare `hotfix/` branch.
3. **Rollback**:
   - **Android**: Promote previous `aab` in Play Console.
   - **iOS**: Expire TestFlight build, push new build immediately.
