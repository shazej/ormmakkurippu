# Release Health Checklist

## Day 0: The First Hour
After hitting "Release", monitor these real-time metrics for 60 minutes.

- [ ] **Crash-Free Users**: Must stay > 99.5%.
- [ ] **Login Success Rate**: Check `login_success` vs `login_attempt` in Analytics.
- [ ] **Server Errors**: Check Firebase Functions/Firestore error rates in Google Cloud Console.
- [ ] **New Adoption**: Verify users are actually upgrading (Version distribution).

## Day 7: Stability Review
Review the following before ramping up rollout to 100%.

### 1. Stability
*   **Crash Velocity**: Are crashes localized to specific devices (e.g., only Android 10, only iPads)?
*   **ANRs (Android)**: Application Not Responding rate should be < 0.47%.

### 2. Business Logic
*   **Sync Integrity**: Are users reporting "missing data"?
*   **Storage Quotas**: Are we hitting free tier limits on Firestore/Storage?

### 3. User Feedback
*   **Store Reviews**: Sort by "Most Recent". Look for 1-star reviews mentioning "crash" or "login".

## Red Flags (Immediate Halt)
If any of these occur, **Pause the Rollout**:
1.  Crash-free users drop below 98%.
2.  Data corruption reported (users seeing wrong data).
3.  Security leak (PII exposed).

## Post-Mortem
If a hotfix was required, document:
*   What went wrong?
*   How was it detected?
*   How to prevent it next time (e.g., add a specific Unit Test)?
