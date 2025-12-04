# OnboardGhost - Quick Start Guide

Get OnboardGhost running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Firebase project created
- ✅ Gemini API key obtained

## Step 1: Clone & Install (1 minute)

```bash
# Install dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools
```

## Step 2: Configure Environment (2 minutes)

Create `.env.local` file in the root directory:

```env
# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=onboardghost0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Deploy Firebase (2 minutes)

### Windows:
```bash
setup-firebase.bat
```

### Mac/Linux:
```bash
chmod +x setup-firebase.sh
./setup-firebase.sh
```

### Manual:
```bash
firebase login
firebase deploy --only firestore
```

**⏳ Wait 2-5 minutes for indexes to build!**

Check status: https://console.firebase.google.com/project/onboardghost0/firestore/indexes

## Step 4: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 5: Test It Out!

### Test Repository Analysis
1. Go to http://localhost:3000/dashboard
2. Enter: `https://github.com/vercel/next.js`
3. Click "Analyze Repository"
4. Watch the magic happen! ✨

### Test Chat (after indexes are built)
1. On the tasks page, click "Ask Ghost Mentor"
2. Ask: "What is this project about?"
3. Get AI-powered answers! 🤖

## Common Issues

### ❌ Chat Error: "Index required"
**Solution**: Wait for indexes to build (2-5 minutes after deployment)

### ❌ "Firebase app not initialized"
**Solution**: Check `.env.local` has all Firebase credentials, restart server

### ❌ "Gemini API key invalid"
**Solution**: Get new key from https://makersuite.google.com/app/apikey

## Useful Commands

```bash
# Start dev server
npm run dev

# Deploy Firebase rules & indexes
npm run firebase:deploy

# Deploy only rules
npm run firebase:rules

# Deploy only indexes
npm run firebase:indexes

# Login to Firebase
npm run firebase:login
```

## What's Next?

- 🔐 Set up GitHub OAuth for private repos
- 🚀 Deploy to Vercel for production
- 📊 Monitor usage in Firebase Console
- 🎨 Customize the UI to your liking

## Need Help?

- 📖 Full guide: See `DEPLOYMENT_GUIDE.md`
- 🔥 Firebase setup: See `FIRESTORE_INDEXES_SETUP.md`
- 🐛 Issues: Check the troubleshooting sections

## Architecture Overview

```
User → Dashboard → Analysis Pipeline → Firebase
                         ↓
                    Gemini AI
                         ↓
                    Roadmap Generation
                         ↓
                    Tasks Page + Chat
```

**Key Features:**
- 🤖 AI-powered repository analysis
- 📋 Personalized onboarding roadmaps
- 💬 Codebase-specific chat assistant
- 📊 Progress tracking with ghost visualization
- 🔒 Secure Firebase backend

Enjoy using OnboardGhost! 👻
