# Firebase Configuration

## Security Rules

### Firestore
Deploy `firestore.rules` to ensure users can only access their own data.
```bash
firebase deploy --only firestore:rules
```

### Storage
Deploy `storage.rules` to ensure users can only upload/download their own attachments.
```bash
firebase deploy --only storage
```

## Indexes
If your queries require composite indexes (e.g. sorting by date + filtering by status), Firebase Console will provide a link to create them in the error logs of the app.
