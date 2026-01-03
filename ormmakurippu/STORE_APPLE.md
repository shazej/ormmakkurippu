# App Store & TestFlight Release Guide

## 1. Identifiers & Signing

### Bundle ID
Ensure your `project.yml` has the correct `PRODUCT_BUNDLE_IDENTIFIER`.
*   Current: `com.example.CallTrackeriOS`
*   Action: Change this to your real reverse-domain ID (e.g., `com.yourcompany.calltracker`).

### URL Types
Verify `ios/CallTrackeriOS/CallTrackeriOS/Info.plist` has the correct `REVERSED_CLIENT_ID` from your production `GoogleService-Info.plist`.

### Signing Settings in Xcode
After running `xcodegen generate`:
1.  Open the project in Xcode.
2.  Select the **CallTrackeriOS** target.
3.  Go to **Signing & Capabilities**.
4.  Check **Automatically manage signing**.
5.  Select your **Team** (must be enrolled in Apple Developer Program).

## 2. Versioning

You can manage versioning in `ios/CallTrackeriOS/project.yml` or override it in Xcode.

**In `project.yml`**:
```yaml
settings:
  base:
    MARKETING_VERSION: 1.0.0  # Your App Store version
    CURRENT_PROJECT_VERSION: 1 # Build number (integer, increment for every upload)
```
*Run `xcodegen generate` after changing these values.*

## 3. Archive & Upload

1.  **Select Device**: Choose "Any iOS Device (arm64)" from the device picker.
2.  **Archive**: Menu > Product > Archive.
3.  **Validate**: Once the Organizer opens, click "Validate App" to check for common issues.
4.  **Distribute**: Click "Distribute App" > "TestFlight & App Store".
    *   Accept default settings (Upload destination, stripped symbols, etc.).
    *   Select "Automatically manage signing" when prompted.
    *   Click "Upload".

## 4. TestFlight Invite Checklist

Before external users can test:
1.  **Export Compliance**: You will be asked about encryption. Since you use HTTPS (Firebase), answer **"Yes"** to encryption, and **"Yes"** that it is exempt (standard calls).
2.  **Internal Testing**: Add your own email in App Store Connect > TestFlight > Internal Testing.
3.  **External Testing**: Create a group, add builds, and submit for Beta App Review (usually takes 24h).

## 5. App Store Listing Checklist

### Screenshots
Required for iPhone (6.5" and 5.5") and iPad (Pro 12.9").

**Screen Plan**:
1.  **Dashboard**: Highlight the clean stats and "New Call" CTA.
2.  **Create Call**: Show the form with the attachment picker.
3.  **Call List**: Show the swipe actions (Mark Sent/Delete).
4.  **Details**: Show a record with an uploaded image attachment.

### Keywords (100 chars)
`call tracker, crm, sales log, task manager, offline logger, client activity, firebase`

### App Privacy (App Store Connect)
You must disclose data collection.
*   **Data Used to Track You**: No (typically, unless you add analytics/ads).
*   **Data Linked to You**:
    *   **Contact Info**: Email Address (Auth).
    *   **User Content**: Photos/Audio (Attachments), Customer Interaction Data.
    *   **Identifiers**: User ID.

See `PRIVACY_POLICY.md` for the public-facing document.
