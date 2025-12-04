# OnboardGhost Application Flow

## Complete User Journey with Component Breakdown

---

## 📊 High-Level Flow Diagram

```
┌─────────────┐
│   User      │
│  Enters URL │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 1: DASHBOARD                        │
│  Component: app/dashboard/page.tsx                          │
│  - Validates GitHub URL                                      │
│  - Checks OAuth status                                       │
│  - Submits to /api/analyze-repo                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              STAGE 2: ANALYSIS PIPELINE                      │
│  Component: /api/analyze-repo/route.ts                      │
│  Orchestrator: lib/pipeline/analyzer.ts                     │
│  - Executes 8-step analysis                                 │
│  - Updates Firebase in real-time                            │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                STAGE 3: LOADING PAGE                         │
│  Component: app/loading/page.tsx                            │
│  - Listens to Firebase progress updates                     │
│  - Displays real-time logs                                  │
│  - Auto-redirects when complete                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STAGE 4: TASKS PAGE                          │
│  Component: app/tasks/page.tsx                              │
│  - Displays roadmap                                          │
│  - Tracks progress                                           │
│  - Provides Ghost Mentor chat                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Stage 1: Dashboard (Entry Point)

### User Actions
1. User visits the application
2. Enters a GitHub repository URL
3. (Optional) Connects GitHub OAuth for private repos
4. Clicks "Analyze Repository"

### Component: `app/dashboard/page.tsx`

**Responsibilities:**
- URL validation
- OAuth status checking
- Form submission
- Error display

**Code Flow:**
```typescript
// 1. User enters URL
const [repoUrl, setRepoUrl] = useState('');

// 2. Validation on submit
const handleSubmit = async (e: React.FormEvent) => {
  // Basic validation
  if (!repoUrl.includes('github.com')) {
    setError('Please enter a valid GitHub repository URL');
    return;
  }

  // 3. Call API
  const response = await fetch('/api/analyze-repo', {
    method: 'POST',
    body: JSON.stringify({
      repoUrl,
      userId: 'demo-user'
    })
  });

  // 4. Redirect to loading page
  router.push(`/loading?repoId=${data.repoId}`);
}
```

**Data Flow:**
```
User Input → Validation → API Call → Redirect
   ↓            ↓            ↓          ↓
repoUrl    isValid?    POST /api    /loading?repoId=xxx
```

---

## 🔄 Stage 2: Analysis Pipeline (Backend Processing)

### Component: `/api/analyze-repo/route.ts`

**Responsibilities:**
- Receives repository URL
- Validates request
- Checks cache (30-day)
- Initiates pipeline
- Returns repository ID

**Code Flow:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Parse request
  const { repoUrl, userId } = await request.json();
  
  // 2. Validate URL
  const { owner, repo } = parseGitHubUrl(repoUrl);
  
  // 3. Check cache
  const cached = await checkCache(owner, repo);
  if (cached && !isExpired(cached)) {
    return cached;
  }
  
  // 4. Start pipeline
  const analyzer = new RepositoryAnalyzer();
  const result = await analyzer.analyze(owner, repo, userId);
  
  // 5. Return repo ID
  return NextResponse.json({
    success: true,
    repoId: result.repoId
  });
}
```

### Orchestrator: `lib/pipeline/analyzer.ts`

**The 8-Step Analysis Pipeline:**

```
┌──────────────────────────────────────────────────────────────┐
│                    ANALYSIS PIPELINE                          │
│                                                               │
│  Step 1: Repository Access                                   │
│  ├─ Component: lib/github/client.ts                         │
│  ├─ Fetches: Repo metadata, default branch                  │
│  └─ Stores: repositories/{repoId}                           │
│                                                               │
│  Step 2: File Tree Filtering                                │
│  ├─ Component: lib/analysis/file-filter.ts                  │
│  ├─ Fetches: Complete file tree from GitHub                 │
│  ├─ Filters: Excludes node_modules, dist, etc.             │
│  └─ Result: 5000 files → 150-250 files (95% reduction)     │
│                                                               │
│  Step 3: Static Analysis                                     │
│  ├─ Components:                                              │
│  │  ├─ lib/analysis/tech-stack.ts                          │
│  │  ├─ lib/analysis/database.ts                            │
│  │  └─ lib/analysis/env-vars.ts                            │
│  ├─ Detects: Framework, dependencies, database, env vars   │
│  └─ Stores: Tech stack, database requirements              │
│                                                               │
│  Step 4: Security Scan                                       │
│  ├─ Component: TruffleHog (Docker)                          │
│  ├─ Scans: Hardcoded secrets                                │
│  └─ Stores: Security issues (if found)                      │
│                                                               │
│  Step 5: Gemini File Upload                                  │
│  ├─ Component: lib/gemini/client.ts                         │
│  ├─ Uploads: Filtered files to Gemini                       │
│  └─ Stores: File URIs for RAG                               │
│                                                               │
│  Step 6: AI Roadmap Generation                               │
│  ├─ Component: lib/gemini/client.ts                         │
│  ├─ Input: All analysis data                                │
│  ├─ Generates: Structured roadmap JSON                      │
│  └─ Stores: roadmaps/{repoId}                               │
│                                                               │
│  Step 7: Ghost Mentor Setup                                  │
│  ├─ Component: lib/gemini/client.ts                         │
│  ├─ Configures: Chat with file context                      │
│  └─ Ready: For user questions                                │
│                                                               │
│  Step 8: Progress Initialization                             │
│  ├─ Component: lib/firebase/admin.ts                        │
│  ├─ Creates: user_progress/{userId}/repos/{repoId}         │
│  └─ Initializes: completed_tasks: [], progress: 0%         │
└──────────────────────────────────────────────────────────────┘
```

### Detailed Component Breakdown

#### **Step 1: Repository Access**
```
Component: lib/github/client.ts
Class: GitHubClient

Methods:
├─ getRepository(owner, repo)
│  └─ Calls: GET /repos/:owner/:repo
│
├─ getDefaultBranch(owner, repo)
│  └─ Returns: main/master branch name
│
└─ Stores in Firebase:
   └─ repositories/{repoId}
      ├─ owner: string
      ├─ name: string
      ├─ description: string
      ├─ stars: number
      ├─ language: string
      └─ default_branch: string
```

#### **Step 2: File Tree Filtering**
```
Component: lib/analysis/file-filter.ts
Function: filterFiles()

Input: Complete file tree (5000+ files)
Process:
├─ 1. Exclude directories
│  └─ node_modules/, dist/, .git/, etc.
│
├─ 2. Exclude extensions
│  └─ .png, .jpg, .zip, .lock, etc.
│
├─ 3. Include critical files
│  └─ README.md, package.json, .env.example
│
└─ 4. Filter by size
   └─ Exclude files > 1MB (except critical)

Output: 150-250 relevant files (95% reduction)
```

#### **Step 3: Static Analysis**
```
Components: Multiple analyzers

┌─────────────────────────────────────────┐
│  lib/analysis/tech-stack.ts            │
│  ├─ detectJavaScriptStack()            │
│  │  └─ Parses: package.json            │
│  ├─ detectPythonStack()                │
│  │  └─ Parses: requirements.txt        │
│  ├─ detectRubyStack()                  │
│  │  └─ Parses: Gemfile                 │
│  └─ detectGoStack()                    │
│     └─ Parses: go.mod                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  lib/analysis/database.ts              │
│  ├─ detectDatabase()                   │
│  │  └─ Checks: Dependencies            │
│  ├─ detectMigrations()                 │
│  │  └─ Looks for: migrations/ folder   │
│  └─ Returns: Database requirements     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  lib/analysis/env-vars.ts              │
│  ├─ parseEnvFile()                     │
│  │  └─ Parses: .env.example            │
│  ├─ categorizeVariable()               │
│  │  └─ Categories: database, api_key   │
│  └─ Returns: Environment variables     │
└─────────────────────────────────────────┘
```

#### **Step 4: Security Scan**
```
Component: TruffleHog (External)
Wrapper: lib/security/scanner.ts (if implemented)

Process:
├─ 1. Run TruffleHog in Docker
│  └─ Command: trufflehog git <repo-url>
│
├─ 2. Parse JSON output
│  └─ Extract: secret type, file, line
│
└─ 3. Store security issues
   └─ repositories/{repoId}/security_issues
```

#### **Step 5: Gemini File Upload**
```
Component: lib/gemini/client.ts
Method: uploadFiles()

Process:
├─ 1. Fetch file content from GitHub
│  └─ For each filtered file
│
├─ 2. Upload to Gemini File Manager
│  └─ API: files.upload()
│
├─ 3. Store URIs
│  └─ repositories/{repoId}/gemini_file_uris
│
└─ 4. Set expiration
   └─ 48 hours from upload
```

#### **Step 6: AI Roadmap Generation**
```
Component: lib/gemini/client.ts
Method: generateRoadmap()

Input Data:
├─ Tech stack
├─ Database requirements
├─ Environment variables
├─ Project purpose
├─ Setup instructions
└─ Security issues

Process:
├─ 1. Build prompt with all analysis data
├─ 2. Call Gemini API
├─ 3. Parse JSON response
├─ 4. Validate structure
└─ 5. Store in Firebase

Output: roadmaps/{repoId}
├─ sections: []
│  └─ tasks: []
│     ├─ instructions
│     ├─ commands
│     ├─ code_snippets
│     ├─ tips
│     └─ warnings
└─ total_tasks: number
```

#### **Step 7: Ghost Mentor Setup**
```
Component: lib/gemini/client.ts
Method: initializeChat()

Setup:
├─ Configure Gemini with file URIs
├─ Set system prompt
└─ Ready for user questions

No data stored - ready for use
```

#### **Step 8: Progress Initialization**
```
Component: lib/firebase/admin.ts
Collection: user_progress/{userId}/repos/{repoId}

Initial Data:
├─ completed_tasks: []
├─ overall_progress_percentage: 0
├─ ghost_solidness: 0
├─ started_at: timestamp
└─ last_activity: timestamp
```

### Real-Time Progress Updates

**Component: Firebase Firestore**

During analysis, each step updates:
```
Collection: analysis_progress/{repoId}

Data:
├─ current_step: number (1-8)
├─ step_name: string
├─ step_status: 'in-progress' | 'completed' | 'failed'
├─ logs: array
│  └─ { timestamp, message, details }
└─ updated_at: timestamp
```

---

## 📺 Stage 3: Loading Page (Real-Time Monitoring)

### Component: `app/loading/page.tsx`

**Responsibilities:**
- Subscribe to Firebase progress updates
- Display real-time logs
- Show progress bar
- Auto-redirect when complete

**Code Flow:**
```typescript
useEffect(() => {
  // 1. Subscribe to Firebase
  const unsubscribe = adminDb
    .collection('analysis_progress')
    .doc(repoId)
    .onSnapshot((snapshot) => {
      const data = snapshot.data();
      
      // 2. Update UI
      setCurrentStep(data.current_step);
      setStepName(data.step_name);
      setLogs(data.logs);
      
      // 3. Check if complete
      if (data.current_step === 8 && data.step_status === 'completed') {
        router.push(`/tasks?repoId=${repoId}`);
      }
    });
    
  return () => unsubscribe();
}, [repoId]);
```

**UI Display:**
```
┌─────────────────────────────────────────┐
│  Analyzing Repository...                │
│                                          │
│  Progress: ████████░░ 80%               │
│                                          │
│  Current Step: AI Roadmap Generation    │
│                                          │
│  Logs:                                   │
│  ✓ Step 1: Repository Access            │
│  ✓ Step 2: File Tree Filtering          │
│  ✓ Step 3: Static Analysis              │
│  ✓ Step 4: Security Scan                │
│  ✓ Step 5: Gemini File Upload           │
│  ✓ Step 6: AI Roadmap Generation        │
│  ⏳ Step 7: Ghost Mentor Setup           │
│  ⏳ Step 8: Progress Initialization      │
└─────────────────────────────────────────┘
```

---

## 📋 Stage 4: Tasks Page (Final Destination)

### Component: `app/tasks/page.tsx`

**Responsibilities:**
- Fetch roadmap from Firebase
- Display tasks in two-pane layout
- Track task completion
- Update progress
- Provide Ghost Mentor chat

**Initial Load:**
```typescript
useEffect(() => {
  // 1. Fetch roadmap and progress
  const response = await fetch(
    `/api/get-roadmap?repoId=${repoId}&userId=demo-user`
  );
  
  // 2. Set state
  setRoadmap(data.roadmap);
  setProgress(data.progress);
  
  // 3. Auto-select first incomplete task
  const firstIncomplete = findFirstIncompleteTask();
  setSelectedTaskId(firstIncomplete.id);
}, [repoId]);
```

---

## 🔄 Complete Data Flow Diagram

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /api/analyze-repo
       │    { repoUrl, userId }
       ▼
┌──────────────────────┐
│  API Route Handler   │
│  analyze-repo/route  │
└──────┬───────────────┘
       │
       │ 2. Calls
       ▼
┌──────────────────────┐
│  Pipeline Analyzer   │
│  lib/pipeline/       │
└──────┬───────────────┘
       │
       │ 3. Executes Steps
       ▼
┌─────────────────────────────────────────┐
│  Step Components                         │
│  ├─ lib/github/client.ts               │
│  ├─ lib/analysis/file-filter.ts        │
│  ├─ lib/analysis/tech-stack.ts         │
│  ├─ lib/analysis/database.ts           │
│  ├─ lib/analysis/env-vars.ts           │
│  └─ lib/gemini/client.ts               │
└─────────┬───────────────────────────────┘
          │
          │ 4. Updates
          ▼
┌─────────────────────────┐
│  Firebase Firestore     │
│  ├─ repositories/       │
│  ├─ roadmaps/           │
│  ├─ analysis_progress/  │
│  └─ user_progress/      │
└─────────┬───────────────┘
          │
          │ 5. Real-time sync
          ▼
┌─────────────────────────┐
│  Loading Page           │
│  app/loading/page.tsx   │
└─────────┬───────────────┘
          │
          │ 6. Auto-redirect
          ▼
┌─────────────────────────┐
│  Tasks Page             │
│  app/tasks/page.tsx     │
└─────────────────────────┘
```

---

## 📁 File Structure Summary

```
onboardGhost/
├── app/
│   ├── dashboard/page.tsx          ← Stage 1: Entry point
│   ├── loading/page.tsx            ← Stage 3: Progress monitoring
│   ├── tasks/page.tsx              ← Stage 4: Final destination
│   └── api/
│       ├── analyze-repo/route.ts   ← Stage 2: Initiates pipeline
│       ├── get-roadmap/route.ts    ← Fetches roadmap
│       ├── update-task/route.ts    ← Updates progress
│       └── chat/route.ts           ← Ghost Mentor chat
│
├── lib/
│   ├── pipeline/
│   │   └── analyzer.ts             ← Orchestrates 8 steps
│   ├── github/
│   │   └── client.ts               ← Step 1: GitHub API
│   ├── analysis/
│   │   ├── file-filter.ts          ← Step 2: File filtering
│   │   ├── tech-stack.ts           ← Step 3a: Tech detection
│   │   ├── database.ts             ← Step 3b: DB detection
│   │   └── env-vars.ts             ← Step 3c: Env vars
│   ├── gemini/
│   │   └── client.ts               ← Steps 5, 6, 7: AI
│   └── firebase/
│       └── admin.ts                ← Step 8: Progress init
│
└── components/
    ├── GhostVisualization.tsx      ← Progress ghost
    └── GhostMentorChat.tsx         ← Chat interface
```

---

## ⏱️ Timing Breakdown

| Stage | Component | Duration | Bottleneck |
|-------|-----------|----------|------------|
| Dashboard | page.tsx | < 1s | User input |
| API Call | route.ts | < 1s | Network |
| Step 1 | GitHub API | 2-5s | API rate limit |
| Step 2 | File filter | 1-3s | File count |
| Step 3 | Static analysis | 2-4s | File parsing |
| Step 4 | Security scan | 5-10s | TruffleHog |
| Step 5 | File upload | 10-20s | File count |
| Step 6 | Roadmap gen | 10-30s | Gemini API |
| Step 7 | Chat setup | < 1s | None |
| Step 8 | Progress init | < 1s | None |
| **Total** | | **30-75s** | Gemini API |

---

## 🎯 Key Takeaways

1. **Dashboard** validates and submits
2. **API Route** orchestrates the pipeline
3. **Pipeline Analyzer** executes 8 sequential steps
4. **Loading Page** monitors progress in real-time
5. **Tasks Page** displays the final roadmap
6. **Firebase** stores all data and enables real-time sync
7. **Gemini AI** powers roadmap generation and chat

Each component has a specific responsibility, and they work together to provide a seamless user experience from URL input to interactive roadmap.
