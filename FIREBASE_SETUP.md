# Firebase Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Firebase account (free tier is sufficient)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `onboard-ghost` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Choose your preferred location
5. Click "Enable"

## Step 3: Enable Authentication

1. Go to "Build" > "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Enable "Google" provider (optional, for GitHub OAuth later)

## Step 4: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register app with nickname: "OnboardGhost Web"
5. Copy the `firebaseConfig` object

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the Firebase configuration from Step 4:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Step 6: Generate Service Account Key (for Admin SDK)

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Copy the entire JSON content
5. In `.env.local`, set:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```
   (Paste the entire JSON as a single-line string)

## Step 7: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. In `.env.local`, set:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Step 8: Firestore Collections Structure

The following collections will be created automatically when the app runs:

```
/repositories/{repoId}
  - Repository metadata and analysis results

/roadmaps/{repoId}
  - Generated onboarding roadmaps

/user_progress/{userId}/repos/{repoId}
  - User task completion tracking

/chat_history/{userId}/repos/{repoId}/messages/{messageId}
  - Chat conversation history

/analysis_progress/{repoId}
  - Real-time analysis pipeline progress
```

## Step 9: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/api/health
3. You should see: `{"status":"ok","timestamp":"...","service":"OnboardGhost API"}`

## Security Rules (To be added later)

After testing, we'll add proper Firestore Security Rules to restrict access:
- Users can only read/write their own progress
- Users can only read/write their own chat history
- Repository and roadmap data is read-only for users

## Troubleshooting

### Error: "Firebase app not initialized"
- Check that all environment variables are set correctly
- Restart the dev server after changing `.env.local`

### Error: "Permission denied"
- Ensure Firestore is in test mode during development
- Check that Security Rules allow read/write access

### Error: "Invalid API key"
- Verify the Gemini API key is correct
- Check that the API key has not been restricted

## Next Steps

Once Firebase is configured, you can proceed with implementing the analysis pipeline and UI components.
