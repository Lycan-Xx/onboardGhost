# GitHub OAuth Setup Guide

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `OnboardGhost` (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
   - **Application description**: (optional) "Repository onboarding assistant"

4. Click **"Register application"**

## Step 2: Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "Generate a new client secret" and copy the value

⚠️ **Important**: Save the Client Secret immediately - you won't be able to see it again!

## Step 3: Update Your `.env.local` File

Replace these lines in your `.env.local`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

With your actual values:

```env
GITHUB_CLIENT_ID=Ov23li... (your actual client ID)
GITHUB_CLIENT_SECRET=... (your actual client secret)
```

## Step 4: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 5: Test the OAuth Flow

1. Go to `http://localhost:3000/dashboard`
2. Click **"Sign in with GitHub"**
3. You should be redirected to GitHub
4. Authorize the app
5. You'll be redirected back to the dashboard

## Troubleshooting

### Error: "GitHub OAuth not configured"
- Make sure you've added the `GITHUB_CLIENT_ID` to `.env.local`
- Restart your dev server after adding the variables

### Error: "oauth_failed"
- Check that your callback URL matches exactly: `http://localhost:3000/api/auth/github/callback`
- Make sure both Client ID and Client Secret are correct

### Error: "redirect_uri_mismatch"
- The callback URL in your GitHub OAuth app settings must match exactly
- No trailing slashes
- Use `http://localhost:3000` (not `https` for local development)

## For Production Deployment

When deploying to production (e.g., Vercel, Netlify):

1. Create a **new** GitHub OAuth App for production
2. Use your production URL:
   - **Homepage URL**: `https://yourdomain.com`
   - **Callback URL**: `https://yourdomain.com/api/auth/github/callback`
3. Add the production credentials to your hosting platform's environment variables

## Security Notes

- ✅ Never commit `.env.local` to git (it's already in `.gitignore`)
- ✅ Use different OAuth apps for development and production
- ✅ Rotate your Client Secret if it's ever exposed
- ✅ The Client Secret should only be used server-side (it's safe in Next.js API routes)

## Current Status

Your Firebase is already configured ✅  
Your Gemini API is configured ✅  
**You need to configure GitHub OAuth** ⚠️

Once you complete the steps above, the authentication will work!
