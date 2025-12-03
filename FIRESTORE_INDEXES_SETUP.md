# Firestore Indexes Setup

## Problem
The chat feature requires composite indexes in Firestore for queries with multiple fields.

## Quick Fix (Recommended)

### Option 1: Click the Auto-Generated Links
When you see the error, Firebase provides direct links to create indexes. Click them and wait 2-5 minutes for the indexes to build.

### Option 2: Deploy Using Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firestore** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project: `onboardghost0`
   - Accept default firestore.rules
   - Accept default firestore.indexes.json

4. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Wait for indexes to build** (2-5 minutes)
   - Check status in Firebase Console: https://console.firebase.google.com/project/onboardghost0/firestore/indexes

## Required Indexes

The `firestore.indexes.json` file defines these indexes:

1. **Chat History by User and Repo**:
   - Fields: user_id (ASC), repo_id (ASC), timestamp (ASC)
   - Used for: Loading chat history for a specific user and repository

2. **Rate Limiting**:
   - Fields: user_id (ASC), role (ASC), timestamp (ASC)
   - Used for: Counting user messages in the last hour

3. **Chat History Alternative**:
   - Fields: repo_id (ASC), user_id (ASC), timestamp (ASC)
   - Used for: Alternative query pattern

## Verify Indexes Are Built

1. Go to Firebase Console: https://console.firebase.google.com/project/onboardghost0/firestore/indexes
2. Check that all indexes show status: **Enabled** (not "Building")
3. Try the chat feature again

## Troubleshooting

### Error: "Index already exists"
- This is fine, it means the index was created via the auto-link
- Continue with other indexes

### Error: "Firebase CLI not found"
- Install it: `npm install -g firebase-tools`

### Indexes stuck in "Building" state
- Wait 5-10 minutes
- Large databases take longer
- Check Firebase Console for status updates

### Still getting index errors after deployment
- Make sure you deployed: `firebase deploy --only firestore:indexes`
- Check that indexes show "Enabled" in console
- Clear browser cache and try again
