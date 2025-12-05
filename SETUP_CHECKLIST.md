# OnboardGhost Setup Checklist

## ✅ What's Already Configured

- [x] Firebase Client SDK
- [x] Firebase Admin SDK
- [x] Gemini AI API
- [x] GitHub Personal Access Token (for public repos)
- [x] Next.js App URL

## ⚠️ What You Need to Configure

### 1. Firebase Anonymous Authentication (Required)

**Status**: May need to be enabled  
**Time**: ~2 minutes

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `onboardghost0`
3. Go to **Authentication** > **Sign-in method**
4. Click on **Anonymous**
5. Toggle **Enable**
6. Click **Save**

### 2. GitHub OAuth (Required for Full Features)

**Status**: Not configured  
**File**: `GITHUB_OAUTH_SETUP.md`  
**Time**: ~5 minutes

**Quick Steps:**
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Client Secret
5. Update `.env.local`:
   ```env
   GITHUB_CLIENT_ID=your_actual_client_id
   GITHUB_CLIENT_SECRET=your_actual_client_secret
   ```
6. Restart dev server: `npm run dev`

## Testing the Setup

### 1. Test Anonymous Sign-In
- Go to `http://localhost:3000/dashboard`
- You should see the dashboard (no errors)
- You can analyze public repos without signing in

### 2. Test GitHub OAuth
- Click "Sign in with GitHub" button
- Should redirect to GitHub
- Authorize the app
- Should redirect back to dashboard
- Dropdown should now be enabled

### 3. Test Analysis
- Enter a public repo URL (e.g., `https://github.com/vercel/next.js`)
- Click "Analyze"
- Should redirect to loading page
- Should show analysis progress
- Should redirect to tasks page when complete

### 4. Test Recent Analyses (Authenticated Users Only)
- After signing in with GitHub
- Analyze a repo
- Go back to dashboard
- Should see the repo in "Recent Analyses"
- Click "Continue" to go back to tasks
- Click delete icon to remove

## Common Issues

### "User must be signed in first"
**Solution**: This should be fixed now. The app auto-signs in anonymously.

### "GitHub OAuth not configured"
**Solution**: Follow `GITHUB_OAUTH_SETUP.md` to set up OAuth credentials.

### "redirect_uri_mismatch"
**Solution**: Make sure callback URL in GitHub OAuth app matches exactly:
`http://localhost:3000/api/auth/github/callback`

### Firebase errors
**Solution**: Your Firebase is already configured correctly ✅

### Gemini API errors
**Solution**: Your Gemini API is already configured correctly ✅

## Environment Variables Summary

```env
# ✅ Already Configured
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY=...
GEMINI_API_KEY=...
GITHUB_TOKEN=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ⚠️ Needs Configuration
GITHUB_CLIENT_ID=your_github_client_id  # ← Change this
GITHUB_CLIENT_SECRET=your_github_client_secret  # ← Change this
```

## Next Steps

1. **Set up GitHub OAuth** (5 minutes) - See `GITHUB_OAUTH_SETUP.md`
2. **Restart dev server** - `npm run dev`
3. **Test the flow** - Go to dashboard and try signing in
4. **Analyze a repo** - Test the full workflow

## Need Help?

- GitHub OAuth Setup: `GITHUB_OAUTH_SETUP.md`
- Firebase Setup: `FIREBASE_SETUP.md`
- Application Flow: `APPLICATION_FLOW.md`

---

**Current Status**: Ready to use for public repos ✅  
**To unlock full features**: Set up GitHub OAuth ⚠️
