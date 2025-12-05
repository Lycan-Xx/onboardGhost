# Authentication Flow Documentation

## Overview

OnboardGhost supports two modes of operation:
1. **Unauthenticated Mode** - Analyze public repos, no progress saved
2. **Authenticated Mode** - Access private repos, save up to 2 analyses

---

## User Flow

### Unauthenticated User (Default)

```
User visits dashboard
    ↓
Auto signs in anonymously (Firebase)
    ↓
Sees: "Welcome to OnboardGhost"
    ↓
Can: Analyze public repositories
    ↓
Analysis uses cache only (no user progress saved)
    ↓
Can view tasks but progress is not persisted
```

**UI Elements:**
- Header: "Sign in with GitHub" button (top-right)
- Welcome: "Analyze any public repository to get started"
- Input: Single URL input field (no dropdown)
- Message: "Want to save your progress? Sign in with GitHub..."

---

### Authenticated User (GitHub OAuth)

```
User clicks "Sign in with GitHub"
    ↓
Redirects to GitHub OAuth
    ↓
User authorizes app
    ↓
Redirects back to dashboard
    ↓
Sees: "Welcome Back"
    ↓
Can: Analyze public + private repos
    ↓
Can: Save up to 2 analyses
    ↓
Progress is saved to Firestore
```

**UI Elements:**
- Header: "Profile" link (top-right)
- Welcome: "Select a repository to get started"
- Input: Dropdown + URL input field
- Section: "Recent Analyses" (shows saved analyses)

---

## Technical Implementation

### Dashboard Changes

#### Header Button Logic
```typescript
{!hasGitHubToken && isAuthenticated ? (
  // Show "Sign in with GitHub" button
  <button onClick={initiateGitHubAuth}>
    Sign in with GitHub
  </button>
) : hasGitHubToken ? (
  // Show "Profile" link
  <Link href="/profile">Profile</Link>
) : null}
```

#### Repository Input
```typescript
// Dropdown only shown for authenticated users
{hasGitHubToken && (
  <select>Choose from your repositories</select>
)}

// URL input always shown
<input placeholder={
  hasGitHubToken 
    ? "Paste a repository link" 
    : "Paste a public repository link"
} />
```

#### Analyze Function
```typescript
const handleAnalyze = async () => {
  // Check 2-repo limit for authenticated users
  if (hasGitHubToken && analyses.length >= 2) {
    setError('Maximum 2 analyses reached');
    return;
  }

  // Send request with conditional flags
  await fetch('/api/analyze-repo', {
    body: JSON.stringify({
      repoUrl,
      userId: hasGitHubToken ? user?.uid : null,
      saveProgress: hasGitHubToken,
    }),
  });
};
```

---

### API Changes (`/api/analyze-repo`)

#### Request Body
```typescript
{
  repoUrl: string;           // Required
  userId: string | null;     // Optional (null for unauthenticated)
  saveProgress: boolean;     // Flag to save user progress
  githubToken?: string;      // Optional (for private repos)
}
```

#### Progress Saving Logic
```typescript
// Only save user progress if authenticated
if (saveProgress && userId) {
  await adminDb
    .collection('user_progress')
    .doc(userId)
    .collection('repos')
    .doc(repoId)
    .set({
      completed_tasks: [],
      overall_progress_percentage: 0,
      started_at: new Date(),
      // ...
    });
} else {
  // Cache-only mode - no user progress saved
  console.log('Skipping user progress (cache-only mode)');
}
```

---

## Firestore Structure

### Authenticated Users
```
user_progress/{userId}/repos/{repoId}
├── completed_tasks: []
├── overall_progress_percentage: 0
├── started_at: timestamp
└── last_activity: timestamp
```

### Unauthenticated Users
```
No user_progress documents created
Only cache is used:
├── repositories/{repoId}  (shared cache)
└── roadmaps/{repoId}      (shared cache)
```

---

## Cache Behavior

### For All Users (Authenticated + Unauthenticated)

1. **First Analysis**:
   - Fetches from GitHub
   - Analyzes with Gemini
   - Stores in cache (30 days)

2. **Subsequent Analysis** (within 30 days):
   - Uses cached data
   - No re-analysis needed
   - Instant redirect to tasks

3. **Cache Expiry** (after 30 days):
   - Re-analyzes repository
   - Updates cache
   - Fresh roadmap generated

**Cache Collections:**
- `repositories/{repoId}` - Repository metadata
- `roadmaps/{repoId}` - Generated roadmap
- `analysis_progress/{repoId}` - Real-time analysis progress

---

## Benefits of This Approach

### For Unauthenticated Users:
✅ Can try the app immediately  
✅ No sign-up friction  
✅ Full analysis features  
✅ Can view and complete tasks  
❌ Progress not saved  
❌ Can't access private repos  

### For Authenticated Users:
✅ Progress saved across sessions  
✅ Access to private repositories  
✅ Up to 2 saved analyses  
✅ Delete and manage analyses  
✅ Full feature access  

### For the System:
✅ Reduces database writes (unauthenticated users)  
✅ Cache shared across all users  
✅ Prevents spam/abuse (2-repo limit)  
✅ Encourages authentication for power users  

---

## User Messages

### Unauthenticated
- **Header**: "Welcome to OnboardGhost"
- **Subtitle**: "Analyze any public repository to get started"
- **CTA**: "Want to save your progress? Sign in with GitHub..."

### Authenticated (No Analyses)
- **Header**: "Welcome Back"
- **Subtitle**: "Select a repository to get started"
- **Section**: "Recent Analyses" (empty state)

### Authenticated (Has Analyses)
- **Header**: "Welcome Back"
- **Subtitle**: "Select a repository to get started"
- **Section**: "Recent Analyses" (shows cards)

### Authenticated (2 Analyses Limit)
- **Warning**: "You've reached the maximum of 2 analyses. Delete one to analyze a new repository."

---

## Testing Scenarios

### Test 1: Unauthenticated Analysis
1. Visit dashboard (don't sign in)
2. Enter public repo URL
3. Click "Analyze"
4. Should work normally
5. Check Firestore - no `user_progress` document created

### Test 2: Authenticated Analysis
1. Click "Sign in with GitHub"
2. Authorize app
3. Enter repo URL
4. Click "Analyze"
5. Check Firestore - `user_progress` document created
6. Return to dashboard - see analysis in "Recent Analyses"

### Test 3: 2-Repo Limit
1. Sign in with GitHub
2. Analyze 2 repositories
3. Try to analyze a 3rd
4. Should see error message
5. Delete one analysis
6. Should be able to analyze again

### Test 4: Cache Behavior
1. Analyze a repo (authenticated or not)
2. Analyze the same repo again
3. Should use cache (instant redirect)
4. No re-analysis performed

---

## Migration Notes

### Existing Users
- Existing `user_progress` documents remain unchanged
- All authenticated analyses continue to work
- No data migration needed

### New Users
- Automatically signed in anonymously
- Can use app immediately
- Encouraged to authenticate for full features

---

## Security Considerations

✅ Anonymous users can't spam analyses (cache prevents re-analysis)  
✅ Authenticated users limited to 2 analyses  
✅ GitHub OAuth tokens stored securely (encrypted)  
✅ User progress isolated per user  
✅ Cache shared safely (read-only for analysis data)  

---

## Future Enhancements

- [ ] Allow authenticated users to have more than 2 analyses (premium tier)
- [ ] Add "Sign in to save" prompt after completing first task
- [ ] Show "You're using cache-only mode" indicator
- [ ] Add analytics to track unauthenticated vs authenticated usage
- [ ] Implement "Continue as guest" vs "Sign in" choice on landing

---

**Current Status**: ✅ Fully Implemented  
**Last Updated**: December 2024
