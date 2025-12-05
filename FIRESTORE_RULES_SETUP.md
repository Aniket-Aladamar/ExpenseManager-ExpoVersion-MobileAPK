# Firebase Firestore Security Rules Setup

## Error: Missing or insufficient permissions

This error means Firestore security rules need to be configured to allow users to read/write their own expenses.

## Fix Steps:

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/project/final-project-1f9b7/firestore/rules

### 2. Replace the existing rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Expenses collection - users can only access their own expenses
    match /expenses/{expenseId} {
      // Allow users to read their own expenses
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Allow users to create expenses with their own userId
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      // Allow users to update their own expenses
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      // Allow users to delete their own expenses
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
    
    // Users collection (if you add user profiles later)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Click "Publish"

## What These Rules Do:

✅ **Allow authenticated users** to read/write only their own expenses
✅ **Prevent users** from accessing other users' data
✅ **Secure by default** - deny all other access
✅ **Enable querying** - allows `where('userId', '==', user.uid)` queries

## Alternative: Temporary Open Access (For Testing Only!)

⚠️ **WARNING: NOT SECURE - Only for quick testing!**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write everything. Use the first rules for production!

## After Updating Rules:

1. Wait 1-2 minutes for rules to propagate
2. Reload the app
3. Try viewing/adding expenses
4. It should work now! ✅

## Both Firebase Rules Needed:

Make sure you've updated BOTH:

1. ✅ **Firestore Rules** (this file) - For database access
2. ✅ **Storage Rules** (FIREBASE_STORAGE_SETUP.md) - For receipt uploads

Without both, the app won't work properly!
