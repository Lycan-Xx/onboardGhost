# Troubleshooting Guide

## Error: `auth/configuration-not-found`

This error means Firebase can't find or read your configuration.

### Solution Steps:

#### 1. Verify `.env.local` File Exists
Make sure you have a `.env.local` file in the root of your project (same level as `package.json`).

#### 2. Check Environment Variables Format
Open `.env.local` and verify these lines exist and have values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onboardghost0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=onboardghost0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onboardghost0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=780950028890
NEXT_PUBLIC_FIREBASE_APP_ID=1:780950028890:web:...
```

**Important**: 
- No spaces around the `=` sign
- No quotes around values
- Must start with `NEXT_PUBLIC_` for client-side access

#### 3. Restart Development Server
After any changes to `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

#### 4. Clear Next.js Cache
If the issue persists:

```bash
# Stop the server
# Delete the .next folder
rm -rf .next
# Or on Windows:
rmdir /s .next

# Restart
npm run dev
```

#### 5. Verify Firebase Console Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **onboardghost0**
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Find your web app
6. Verify the config values match your `.env.local`

---

## Error: "User must be signed in first"

### Solution:
This should be fixed now. If you still see it:

1. Make sure Firebase Anonymous Authentication is enabled:
   - Firebase Console → Authentication → Sign-in method → Anonymous → Enable

2. Clear browser cache and cookies

3. Try in incognito/private mode

---

## GitHub OAuth Button Not Working

### Symptoms:
- Clicking "Sign in with GitHub" does nothing
- No redirect to GitHub

### Solutions:

#### 1. Check GitHub OAuth Configuration
In `.env.local`:
```env
GITHUB_CLIENT_ID=your_actual_client_id  # NOT "your_github_client_id"
GITHUB_CLIENT_SECRET=your_actual_secret  # NOT "your_github_client_secret"
```

#### 2. Verify OAuth App Settings
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on your OAuth App
3. Verify:
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/auth/github/callback`
   - Exact match, no trailing slashes

#### 3. Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click the GitHub button
4. Look for errors

---

## Debug Mode

A debug panel appears in the bottom-left corner (development only) showing:
- Firebase Auth status
- Environment variables status

If you see ❌ next to any variable:
1. Check `.env.local` file
2. Verify variable names are correct
3. Restart dev server

---

## Common Issues

### Issue: "Cannot read properties of undefined (reading 'uid')"
**Solution**: Wait for auth to load. The app should handle this automatically now.

### Issue: "redirect_uri_mismatch"
**Solution**: 
1. Check GitHub OAuth app callback URL
2. Must be exactly: `http://localhost:3000/api/auth/github/callback`
3. No `https`, no trailing slash

### Issue: Firebase errors in console
**Solution**:
1. Enable Anonymous Authentication in Firebase Console
2. Check Firebase config in `.env.local`
3. Restart dev server

### Issue: "Network request failed"
**Solution**:
1. Check internet connection
2. Verify Firebase project is active
3. Check if Firebase services are down: [Firebase Status](https://status.firebase.google.com/)

---

## Still Having Issues?

### Check These Files:

1. **`.env.local`** - All environment variables set correctly
2. **`lib/firebase/config.ts`** - Firebase initialization
3. **`lib/contexts/AuthContext.tsx`** - Auth state management

### Verify Setup:

```bash
# Check if .env.local exists
ls -la .env.local

# Check if node_modules is installed
ls -la node_modules

# Reinstall dependencies if needed
npm install

# Clear everything and restart
rm -rf .next node_modules
npm install
npm run dev
```

### Get More Info:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

---

## Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] All `NEXT_PUBLIC_FIREBASE_*` variables are set
- [ ] Firebase Anonymous Auth is enabled
- [ ] GitHub OAuth app is created
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
- [ ] Dev server has been restarted after env changes
- [ ] Browser cache has been cleared

---

## Need More Help?

1. Check the debug panel (bottom-left corner)
2. Look at browser console for errors
3. Verify all setup steps in `SETUP_CHECKLIST.md`
4. Follow GitHub OAuth setup in `GITHUB_OAUTH_SETUP.md`
