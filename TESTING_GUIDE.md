# Testing Guide for OnboardGhost

## Prerequisites

Before testing, ensure you have:

1. **Firebase Project Setup**
   - Follow instructions in `FIREBASE_SETUP.md`
   - Create Firestore collections: `repositories`, `roadmaps`, `user_progress`, `chat_history`, `analysis_progress`, `github_tokens`
   - Add Firebase credentials to `.env.local`

2. **API Keys**
   - Gemini API key from https://makersuite.google.com/app/apikey
   - (Optional) GitHub OAuth app for private repos

3. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in:
   ```bash
   # Firebase (required)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Gemini AI (required)
   GEMINI_API_KEY=your_gemini_key
   
   # GitHub OAuth (optional)
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Running the App

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to http://localhost:3000

## Testing Flow

### 1. Dashboard Page (/)
- Should redirect to `/dashboard`
- Enter a GitHub repository URL (e.g., `https://github.com/vercel/next.js`)
- Click "Analyze Repository"
- Should redirect to loading page

### 2. Loading Page (/loading?repoId=xxx)
- Shows real-time progress of analysis
- Progress bar updates as steps complete
- Step list shows current status
- Auto-redirects to tasks page when complete

### 3. Tasks Page (/tasks?repoId=xxx)
- Displays generated onboarding roadmap
- Shows Ghost visualization (opacity increases with progress)
- Click tasks to expand/collapse details
- Check tasks to mark as complete
- Progress bar updates
- Ghost becomes more solid as progress increases

### 4. Ghost Mentor Chat
- Click floating ghost button (bottom right)
- Chat window opens
- Ask questions about the repository
- Ghost Mentor responds using Gemini AI with file context
- Rate limited to 10 messages per hour

### 5. GitHub OAuth (Optional)
- Click "Connect GitHub for Private Repos" on dashboard
- Redirects to GitHub authorization
- After approval, redirects back with success message
- Can now analyze private repositories

## Testing with Mock Data

If you want to test the UI without running the full analysis pipeline:

1. **Create Mock Roadmap in Firestore**
   - Collection: `roadmaps`
   - Document ID: `test-repo-123`
   - Data:
   ```json
   {
     "repository_name": "Test Repository",
     "total_tasks": 5,
     "estimated_completion_time": "2-3 hours",
     "sections": [
       {
         "id": "section-1",
         "title": "Environment Setup",
         "description": "Get your development environment ready",
         "tasks": [
           {
             "id": "task-1",
             "title": "Install Node.js",
             "description": "Install Node.js v18 or higher",
             "instructions": ["Download from nodejs.org", "Run installer", "Verify with node --version"],
             "difficulty": "easy",
             "estimated_time": "10 minutes"
           }
         ]
       }
     ]
   }
   ```

2. **Create Mock Progress**
   - Collection: `user_progress/demo-user/repos`
   - Document ID: `test-repo-123`
   - Data:
   ```json
   {
     "completed_tasks": [],
     "overall_progress_percentage": 0,
     "ghost_solidness": 0,
     "last_activity": "2024-01-01T00:00:00Z"
   }
   ```

3. **Navigate Directly**
   Go to: `http://localhost:3000/tasks?repoId=test-repo-123`

## Common Issues

### Firebase Connection Error
- Check that Firebase credentials are correct in `.env.local`
- Verify Firestore database is created
- Check Firebase console for security rules

### Gemini API Error
- Verify API key is valid
- Check API quota limits
- Ensure billing is enabled on Google Cloud

### Chat Not Working
- Check that repository has `gemini_files` array in Firestore
- Verify rate limiting hasn't been exceeded
- Check browser console for errors

## Next Steps

Once basic testing works:

1. Test with a real repository analysis
2. Verify all API endpoints work
3. Test error handling (invalid URLs, rate limits)
4. Test GitHub OAuth flow
5. Test chat functionality with different questions
6. Test progress tracking and milestone celebrations

## Debugging

Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

Check API responses:
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test roadmap endpoint
curl "http://localhost:3000/api/get-roadmap?repoId=test-repo-123&userId=demo-user"
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Check terminal for server errors
3. Verify all environment variables are set
4. Check Firebase console for data
5. Review `FIREBASE_SETUP.md` for setup instructions
