# Firebase Storage Setup Guide

## Error: Firebase Storage Unknown Error

This error occurs because Firebase Storage security rules need to be configured.

## Fix Steps:

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/project/final-project-1f9b7/storage

### 2. Click on "Rules" Tab

### 3. Replace the existing rules with:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{userId}/{fileName} {
      // Allow users to upload their own receipts
      allow write: if request.auth != null && request.auth.uid == userId;
      // Allow users to read their own receipts
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Click "Publish"

## What These Rules Do:

✅ **Allow authenticated users** to upload receipts to their own folder
✅ **Prevent users** from accessing other users' receipts
✅ **Organize receipts** by userId for security
✅ **Deny all other access** to storage

## Alternative: Temporary Open Access (For Testing Only!)

⚠️ **WARNING: NOT SECURE - Only for quick testing!**

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write anywhere. Use the first rules for production!

## After Updating Rules:

1. Wait 1-2 minutes for rules to propagate
2. Try adding an expense with a receipt
3. It should work now! ✅

## Current App Changes:

I've also made these improvements:

1. ✅ **Fixed ImagePicker warning** - Using new `mediaTypes: ['images']` format
2. ✅ **Better error handling** - App continues even if receipt upload fails
3. ✅ **Fixed date format** - Storing as Firestore Timestamp instead of string
4. ✅ **Simpler filename** - Using `${Date.now()}.jpg` format

The app will now show a warning if receipt upload fails, but will still save the expense!
