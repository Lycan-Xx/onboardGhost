# Design Document

## Overview

OnboardGhost is a Next.js application that automates developer onboarding by analyzing GitHub repositories and generating personalized learning roadmaps. The system consists of three main user-facing pages (dashboard, loading, tasks) and a backend powered by Firebase and Google Gemini AI. The architecture follows a pipeline pattern where repository analysis flows through 8 sequential steps, each producing structured data that feeds into the next stage. The final output is an interactive onboarding experience with task tracking, progress visualization, and an AI chatbot that answers codebase-specific questions.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Dashboard Page │  Loading Page   │      Tasks Page             │
│  - URL Input    │  - Progress Log │  - Roadmap Display          │
│  - OAuth Button │  - Step Status  │  - Ghost Visualization      │
│                 │                 │  - Chat Interface           │
└────────┬────────┴────────┬────────┴─────────┬───────────────────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
├──────────────────┬──────────────────┬───────────────────────────┤
│ /api/analyze-repo│ /api/get-progress│  /api/chat                │
│ /api/auth/github │ /api/update-task │  /api/get-roadmap         │
└────────┬─────────┴────────┬─────────┴─────────┬─────────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├──────────────────┬──────────────────┬───────────────────────────┤
│  GitHub API      │  Firebase        │  Google Gemini AI         │
│  - Repo metadata │  - Firestore     │  - File Search            │
│  - File tree     │  - Auth          │  - Chat completion        │
│  - File content  │  - Functions     │  - Roadmap generation     │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### Repository Analysis Pipeline (8 Steps)

```
Step 1: Repository Access
    ↓ (owner, repo, metadata)
Step 2: File Tree Filtering
    ↓ (filtered files: 150-250 from 5000+)
Step 3: Static Analysis
    ↓ (tech stack, db, env vars, purpose)
Step 4: Security Scan
    ↓ (security issues)
Step 5: Gemini File Upload
    ↓ (file URIs for RAG)
Step 6: AI Roadmap Generation
    ↓ (structured roadmap JSON)
Step 7: Ghost Mentor Setup
    ↓ (chat system ready)
Step 8: Progress Initialization
    ↓ (user progress tracking)
```

### Data Flow

```
User Input (GitHub URL)
    ↓
Dashboard validates & initiates analysis
    ↓
Loading page streams progress updates
    ↓
Firebase stores analysis results
    ↓
Tasks page displays roadmap & chat
    ↓
User completes tasks → Progress updates
    ↓
Ghost solidifies based on completion %
```

## Components and Interfaces

### Frontend Components

#### 1. Dashboard Page Component (`app/dashboard/page.tsx`)

**Purpose:** Entry point for repository analysis

**State:**
```typescript
interface DashboardState {
  repoUrl: string;
  isValidUrl: boolean;
  isAnalyzing: boolean;
  error: string | null;
  hasGitHubAuth: boolean;
}
```

**Key Functions:**
- `validateGitHubUrl(url: string): boolean` - Validates URL format
- `handleAnalyzeRepo()` - Initiates analysis and redirects to loading page
- `handleGitHubOAuth()` - Triggers GitHub OAuth flow

#### 2. Loading Page Component (`app/loading/page.tsx`)

**Purpose:** Displays real-time analysis progress

**State:**
```typescript
interface LoadingState {
  currentStep: number;
  stepName: string;
  stepStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  logs: AnalysisLog[];
  error: string | null;
}

interface AnalysisLog {
  timestamp: Date;
  step: number;
  message: string;
  details?: any;
}
```

**Key Functions:**
- `subscribeToProgress(repoId: string)` - Listens to Firebase real-time updates
- `renderProgressBar()` - Shows visual progress indicator
- `handleAnalysisComplete()` - Redirects to tasks page on success

#### 3. Tasks Page Component (`app/tasks/page.tsx`)

**Purpose:** Displays roadmap, tracks progress, provides chat interface

**State:**
```typescript
interface TasksPageState {
  roadmap: OnboardingRoadmap | null;
  progress: UserProgress;
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  expandedTaskId: string | null;
}
```

**Key Functions:**
- `loadRoadmap(repoId: string)` - Fetches roadmap from Firebase
- `toggleTaskComplete(taskId: string)` - Marks task as done/undone
- `sendChatMessage(message: string)` - Sends question to Ghost Mentor
- `calculateGhostOpacity()` - Returns opacity based on progress %

#### 4. Ghost Visualization Component

**Purpose:** Animated ghost that solidifies with progress

**Props:**
```typescript
interface GhostVisualizationProps {
  progressPercentage: number;
  celebrationTrigger: boolean;
}
```

**Behavior:**
- Opacity = progressPercentage / 100
- Smooth transition animation (0.5s ease-in-out)
- Celebration animation at 25%, 50%, 75%, 100%

#### 5. Chat Interface Component

**Purpose:** Ghost Mentor chatbot UI

**Props:**
```typescript
interface ChatInterfaceProps {
  repoId: string;
  userId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}
```

**Features:**
- Message history with user/assistant distinction
- Streaming response display
- File reference links
- Rate limit warning display

### Backend API Routes

#### 1. `/api/analyze-repo` (POST)

**Purpose:** Orchestrates the 8-step analysis pipeline

**Request:**
```typescript
interface AnalyzeRepoRequest {
  repoUrl: string;
  userId: string;
  githubToken?: string;
}
```

**Response:**
```typescript
interface AnalyzeRepoResponse {
  success: boolean;
  repoId: string;
  message: string;
}
```

**Implementation Flow:**
1. Validate repository URL
2. Check cache (if < 30 days old, return cached)
3. Execute pipeline steps 1-8 sequentially
4. Update Firebase with progress after each step
5. Return repoId on completion

#### 2. `/api/chat` (POST)

**Purpose:** Handles Ghost Mentor chat requests

**Request:**
```typescript
interface ChatRequest {
  repoId: string;
  userId: string;
  message: string;
}
```

**Response:** Streaming text response

**Implementation:**
1. Check rate limit (10 per hour)
2. Fetch Gemini file URIs from Firebase
3. Initialize Gemini with File Search tool
4. Stream response back to client
5. Save message and response to Firebase

#### 3. `/api/update-task` (POST)

**Purpose:** Updates task completion status

**Request:**
```typescript
interface UpdateTaskRequest {
  userId: string;
  repoId: string;
  taskId: string;
  completed: boolean;
}
```

**Response:**
```typescript
interface UpdateTaskResponse {
  success: boolean;
  newProgress: number;
  celebrationTriggered: boolean;
}
```

### Data Models

#### Repository Metadata

```typescript
interface RepositoryMetadata {
  id: string; // Firebase document ID
  owner: string;
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  default_branch: string;
  created_at: Date;
  updated_at: Date;
  language: string;
  size: number; // KB
  is_private: boolean;
  analyzed_at: Date;
  analysis_duration: number; // seconds
}
```

#### Tech Stack

```typescript
interface TechStack {
  primary_language: string;
  framework: string;
  runtime_version: string;
  package_manager: string;
  dependencies: {
    production: string[];
    development: string[];
  };
  testing_framework: string | null;
  database: string | null;
  ui_library: string | null;
}
```

#### Database Requirement

```typescript
interface DatabaseRequirement {
  type: 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQLite' | 'Redis';
  required: boolean;
  version_requirement?: string;
  migrations_path?: string;
  requires_migration: boolean;
  seed_data_available: boolean;
  setup_guide: string;
}
```

#### Environment Variable

```typescript
interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  example_value: string;
  category: 'database' | 'api_key' | 'server' | 'general';
}
```

#### Security Issue

```typescript
interface SecurityIssue {
  severity: 'high' | 'medium' | 'low';
  type: string; // 'AWS API Key', 'GitHub Token', etc.
  file: string;
  line: number;
  redacted_secret: string;
  recommendation: string;
}
```

#### Onboarding Roadmap

```typescript
interface OnboardingRoadmap {
  repo_id: string;
  generated_at: Date;
  sections: RoadmapSection[];
  total_tasks: number;
}

interface RoadmapSection {
  id: string;
  title: string;
  goals: string[];
  tasks: RoadmapTask[];
}

interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  instructions: string;
  code_snippet?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completion_criteria: string;
  tips: string[];
  warnings: string[];
}
```

#### User Progress

```typescript
interface UserProgress {
  user_id: string;
  repo_id: string;
  completed_tasks: string[]; // task IDs
  overall_progress_percentage: number;
  ghost_solidness: number; // 0-100
  started_at: Date;
  last_activity: Date;
}
```

#### Chat Message

```typescript
interface ChatMessage {
  id: string;
  user_id: string;
  repo_id: string;
  role: 'user' | 'assistant';
  content: string;
  file_references?: FileReference[];
  timestamp: Date;
}

interface FileReference {
  path: string;
  line_number?: number;
}
```

### Firebase Firestore Schema

```
/repositories/{repoId}
  - owner: string
  - name: string
  - url: string
  - analyzed_at: timestamp
  - tech_stack: object
  - database_requirements: array
  - environment_variables: array
  - security_issues: array
  - project_purpose: object
  - gemini_file_uris: array
  - analysis_duration: number

/roadmaps/{repoId}
  - sections: array
  - total_tasks: number
  - generated_at: timestamp

/user_progress/{userId}/repos/{repoId}
  - completed_tasks: array
  - progress_percentage: number
  - ghost_solidness: number
  - started_at: timestamp
  - last_activity: timestamp

/chat_history/{userId}/repos/{repoId}/messages/{messageId}
  - role: string
  - content: string
  - file_references: array
  - timestamp: timestamp

/analysis_progress/{repoId}
  - current_step: number
  - step_name: string
  - step_status: string
  - logs: array
  - updated_at: timestamp
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified several areas where properties can be consolidated to eliminate redundancy:

**Consolidation Opportunities:**

1. **Database Detection (6.1, 6.2, 6.3)** - These three properties test the same logic for different databases. They can be combined into one property that tests database detection works for any supported database type.

2. **Environment Variable Categorization (7.3, 7.4)** - These test the same categorization logic for different categories. They can be combined into one property that tests categorization works correctly for all categories.

3. **Project Purpose Fields (8.2, 8.3, 8.4, 8.5)** - These all test that different fields are populated by the AI. They can be combined into one property that tests all required fields are present.

4. **Tech Stack Detection by Language (5.1, 5.2, 5.3)** - These test the same detection logic for different languages. They can be combined into one property that tests tech stack detection works for any supported language.

5. **File Upload Storage (11.3, 11.5)** - Property 11.5 (storing total count and URIs) subsumes property 11.3 (storing individual file data), so 11.3 is redundant.

6. **Roadmap Structure (12.2, 12.3)** - Property 12.3 (task fields) is a subset of property 12.2 (overall structure). They can be combined into one comprehensive structure validation property.

**Properties to Keep:**
- All properties that provide unique validation value
- Properties that test different aspects of the same feature
- Properties that validate critical correctness guarantees

### Correctness Properties

Property 1: URL format validation
*For any* string input, the system should accept it as a valid GitHub URL if and only if it matches the pattern `https://github.com/{owner}/{repo}`
**Validates: Requirements 1.1**

Property 2: URL parsing round-trip
*For any* valid GitHub URL, extracting the owner and repo name and reconstructing the URL should produce a URL that matches the original pattern
**Validates: Requirements 1.2**

Property 3: Invalid URL rejection
*For any* string that does not match the GitHub URL pattern, the system should reject it with an error message
**Validates: Requirements 1.3**

Property 4: Retry with exponential backoff
*For any* 403 response from GitHub API, the system should make exactly 3 retry attempts with exponentially increasing delays between attempts
**Validates: Requirements 2.4**

Property 5: Repository metadata completeness
*For any* successful GitHub API response, the stored repository metadata should contain all required fields: name, owner, description, stars, forks, default_branch, language, size, and is_private
**Validates: Requirements 2.5**

Property 6: Progress display for all steps
*For any* step in the analysis pipeline, when the step begins, the system should display the step name and current status
**Validates: Requirements 3.2**

Property 7: Pipeline stops on failure
*For any* analysis step that fails, the pipeline should stop execution and display an error message with the failure reason
**Validates: Requirements 3.4**

Property 8: Excluded directory filtering
*For any* file whose path contains a directory from the excluded directories list, that file should not appear in the filtered results
**Validates: Requirements 4.2**

Property 9: Excluded extension filtering
*For any* file whose extension matches the excluded extensions list, that file should not appear in the filtered results
**Validates: Requirements 4.3**

Property 10: Critical files always included
*For any* file that matches the critical files list, that file should always appear in the filtered results regardless of size
**Validates: Requirements 4.4**

Property 11: Code file size filtering
*For any* code file (matching code extensions list), it should be included in filtered results if and only if its size is less than 1MB
**Validates: Requirements 4.5**

Property 12: Tech stack detection completeness
*For any* supported language repository (JavaScript, TypeScript, Python, Ruby), tech stack detection should extract and store all required fields: primary_language, framework, runtime_version, package_manager, dependencies, testing_framework, database, and ui_library
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

Property 13: Dependency categorization
*For any* detected dependency, it should be categorized as either production or development
**Validates: Requirements 5.4**

Property 14: Database detection with migrations
*For any* repository that has both a database dependency and a migrations directory, the database requirement should be marked as requires_migration with the migrations_path stored
**Validates: Requirements 6.4**

Property 15: Database requirements completeness
*For any* detected database requirement, it should contain all required fields: type, required, version_requirement, migrations_path, requires_migration, seed_data_available, and setup_guide
**Validates: Requirements 6.5**

Property 16: Environment variable extraction completeness
*For any* environment variable in .env.example, the extracted data should contain all required fields: name, description, required, example_value, and category
**Validates: Requirements 7.1, 7.2**

Property 17: Environment variable categorization
*For any* environment variable name, it should be categorized correctly: DATABASE/DB_ → database, API_KEY/SECRET → api_key, PORT/HOST → server, otherwise → general
**Validates: Requirements 7.3, 7.4**

Property 18: Project purpose completeness
*For any* extracted project purpose, it should contain all required fields: purpose (1-2 sentences), features (3-5 items), target_users, and project_type
**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

Property 19: Setup instructions extraction
*For any* README with a setup section containing code blocks, all code blocks should be extracted with their preceding descriptive text and ordered sequentially
**Validates: Requirements 9.2, 9.4**

Property 20: Prerequisite detection
*For any* README mentioning Node.js, Python, or Docker, those tools should be identified in the prerequisites list
**Validates: Requirements 9.3**

Property 21: Security issue completeness
*For any* secret detected by TruffleHog, the recorded security issue should contain all required fields: severity, type, file, line, and redacted_secret
**Validates: Requirements 10.2**

Property 22: Security issues marked high severity
*For any* detected security issue, the severity should be classified as high
**Validates: Requirements 10.3**

Property 23: Security issues in roadmap
*For any* repository with security issues, the generated roadmap should contain tasks for removing those secrets
**Validates: Requirements 10.5**

Property 24: File upload storage completeness
*For any* successful file upload to Gemini, the system should store the file_path, gemini_uri, gemini_name, and include it in the total count
**Validates: Requirements 11.3, 11.5**

Property 25: File upload failure resilience
*For any* file upload that fails, the system should continue uploading the remaining files without stopping the pipeline
**Validates: Requirements 11.4**

Property 26: Roadmap structure validation
*For any* generated roadmap, it should have a valid structure where all sections contain at least one task, and all tasks contain all required fields: id, title, description, instructions, difficulty, completion_criteria, tips, and warnings
**Validates: Requirements 12.2, 12.3, 12.7**

Property 27: Roadmap section ordering
*For any* generated roadmap, the sections should appear in logical order with Environment Setup before Architecture Understanding before First Contribution
**Validates: Requirements 12.4**

Property 28: Security tasks prioritized early
*For any* roadmap generated for a repository with security issues, security-related tasks should appear in the first section
**Validates: Requirements 12.6**

Property 29: Task completion updates progress
*For any* task marked as complete, the progress percentage should increase by (1 / total_tasks) * 100
**Validates: Requirements 13.5**

Property 30: Completed tasks stored
*For any* task marked as complete, its task ID should be appended to the completed_tasks array in Firebase
**Validates: Requirements 14.1**

Property 31: Progress calculation formula
*For any* set of completed tasks, the progress percentage should equal (completed_tasks.length / total_tasks) * 100
**Validates: Requirements 14.2**

Property 32: Last activity timestamp updated
*For any* progress update, the last_activity timestamp should be updated to the current time
**Validates: Requirements 14.3**

Property 33: Progress persistence
*For any* user returning to the tasks page, their previously completed tasks should be loaded from Firebase and displayed with checkmarks
**Validates: Requirements 14.4**

Property 34: Milestone celebrations
*For any* progress update that reaches exactly 25%, 50%, 75%, or 100%, a celebration animation should be triggered
**Validates: Requirements 14.5**

Property 35: Ghost opacity matches progress
*For any* progress percentage value, the ghost visualization opacity should equal progress_percentage / 100
**Validates: Requirements 15.1**

Property 36: File references in chat responses
*For any* Ghost Mentor response that references code, the response should include file paths in the format "In {file_path}..."
**Validates: Requirements 16.6**

Property 37: Rate limit counter increment
*For any* processed chat request, the user's request count should increment by 1 and the expiration should be set to 1 hour from now
**Validates: Requirements 17.4**

Property 38: User message storage
*For any* user chat message, it should be stored in Firebase with role='user', content, and timestamp
**Validates: Requirements 18.1**

Property 39: Assistant message storage
*For any* Ghost Mentor response, it should be stored in Firebase with role='assistant', content, file_references, and timestamp
**Validates: Requirements 18.2**

Property 40: Chat history chronological order
*For any* user loading the tasks page, their chat history should be fetched from Firebase and displayed in chronological order by timestamp
**Validates: Requirements 18.3**

Property 41: Gemini API retry with exponential backoff
*For any* Gemini API error, the system should retry the request up to 3 times with exponentially increasing delays before displaying an error
**Validates: Requirements 19.2**

Property 42: Error logging and user feedback
*For any* critical error, the system should both log the error details to the console and display a user-friendly error message
**Validates: Requirements 19.4**

Property 43: Retry option on errors
*For any* error that occurs, the system should provide a retry option to the user
**Validates: Requirements 19.5**

Property 44: Cache hit for recent analysis
*For any* repository with cached analysis results less than 30 days old, the system should load the cached results and skip re-analysis
**Validates: Requirements 20.2**

Property 45: Cache expiration and re-analysis
*For any* repository with cached analysis results more than 30 days old, the system should re-run the analysis pipeline and update the cache
**Validates: Requirements 20.3**

Property 46: Analysis timestamp storage
*For any* stored analysis result, it should include an analyzed_at timestamp for cache expiration calculation
**Validates: Requirements 20.4**

Property 47: Gemini file re-upload on expiration
*For any* repository with Gemini file uploads older than 48 hours, the system should re-upload the files when a user accesses the repository
**Validates: Requirements 20.5**

## Error Handling

### Error Categories and Strategies

#### 1. GitHub API Errors

**Network Errors:**
- Strategy: Display user-friendly message suggesting internet connection check
- Retry: No automatic retry (user-initiated retry option)
- Logging: Log full error details to console

**Rate Limit (403):**
- Strategy: Exponential backoff retry (3 attempts)
- Delays: 1s, 2s, 4s
- Fallback: Display rate limit message with estimated reset time

**Not Found (404):**
- Strategy: Check if OAuth token is available
- If no token: Display message offering GitHub OAuth connection
- If token exists: Display "Repository not found" error

**Repository Too Large (>500MB):**
- Strategy: Reject immediately with size limit error
- Message: "Repository exceeds 500MB limit. Consider analyzing specific directories."

#### 2. Gemini API Errors

**API Errors:**
- Strategy: Exponential backoff retry (3 attempts)
- Delays: 2s, 4s, 8s
- Fallback: Display error message with retry option

**File Upload Failures:**
- Strategy: Continue with remaining files (non-blocking)
- Logging: Log failed file paths
- Impact: Chat may have incomplete context

**Rate Limit:**
- Strategy: Display rate limit message
- Guidance: Suggest waiting or upgrading API tier

#### 3. Firebase Errors

**Write Failures:**
- Strategy: Retry once after 1s delay
- Fallback: Display error and offer retry
- Critical: Progress updates, chat history

**Read Failures:**
- Strategy: Retry once after 1s delay
- Fallback: Display cached data if available
- Critical: Roadmap loading, progress loading

#### 4. Analysis Pipeline Errors

**Timeout (5 minutes):**
- Strategy: Stop pipeline immediately
- Message: "Analysis timeout. Repository may be too complex."
- Offer: Retry option

**Step Failure:**
- Strategy: Stop pipeline at failed step
- Display: Step name and error reason
- Offer: Retry from failed step (if possible)

**TruffleHog Failure:**
- Strategy: Continue pipeline (non-critical)
- Logging: Log security scan failure
- Impact: No security warnings in roadmap

### Error Recovery Mechanisms

```typescript
// Exponential backoff utility
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

// Timeout wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Non-blocking error handler
async function continueOnError<T>(
  fn: () => Promise<T>,
  fallback: T,
  logMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(logMessage, error);
    return fallback;
  }
}
```

## Testing Strategy

### Unit Testing

**Framework:** Jest with React Testing Library for frontend, Jest for backend

**Coverage Areas:**

1. **Utility Functions:**
   - URL validation and parsing
   - File filtering logic
   - Progress calculation
   - Environment variable categorization
   - Tech stack detection patterns

2. **Component Logic:**
   - Dashboard form validation
   - Task completion toggling
   - Ghost opacity calculation
   - Chat message formatting

3. **API Route Handlers:**
   - Request validation
   - Error response formatting
   - Firebase query construction

**Example Unit Tests:**

```typescript
// URL validation
describe('validateGitHubUrl', () => {
  it('should accept valid GitHub URLs', () => {
    expect(validateGitHubUrl('https://github.com/owner/repo')).toBe(true);
  });
  
  it('should reject invalid URLs', () => {
    expect(validateGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
    expect(validateGitHubUrl('not-a-url')).toBe(false);
  });
});

// Progress calculation
describe('calculateProgress', () => {
  it('should calculate percentage correctly', () => {
    const result = calculateProgress(10, 3);
    expect(result).toBe(30);
  });
  
  it('should handle zero tasks', () => {
    const result = calculateProgress(0, 0);
    expect(result).toBe(0);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Test Organization:** Each correctness property from the design document should be implemented as a single property-based test, tagged with the property number and requirement reference.

**Tagging Format:** `// Feature: repo-analysis-onboarding, Property {number}: {property_text}`

**Coverage Areas:**

1. **URL Parsing (Properties 1-3):**
   - Generate random valid/invalid URLs
   - Test validation, parsing, and error handling

2. **File Filtering (Properties 8-11):**
   - Generate random file trees with various paths and extensions
   - Test exclusion and inclusion rules

3. **Progress Calculation (Properties 29-31):**
   - Generate random task completion states
   - Test progress percentage calculation

4. **Categorization Logic (Properties 13, 17):**
   - Generate random dependency names and env var names
   - Test categorization rules

5. **Data Completeness (Properties 5, 12, 15, 18, 24):**
   - Generate random API responses
   - Test that all required fields are extracted and stored

**Example Property Tests:**

```typescript
import fc from 'fast-check';

// Feature: repo-analysis-onboarding, Property 1: URL format validation
describe('Property 1: URL format validation', () => {
  it('should accept only valid GitHub URLs', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const isValid = validateGitHubUrl(input);
          const matchesPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/.test(input);
          return isValid === matchesPattern;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: repo-analysis-onboarding, Property 31: Progress calculation formula
describe('Property 31: Progress calculation formula', () => {
  it('should calculate progress as (completed / total) * 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // total tasks
        fc.integer({ min: 0, max: 100 }), // completed tasks
        (total, completed) => {
          const adjustedCompleted = Math.min(completed, total);
          const progress = calculateProgress(total, adjustedCompleted);
          const expected = Math.round((adjustedCompleted / total) * 100);
          return progress === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: repo-analysis-onboarding, Property 8: Excluded directory filtering
describe('Property 8: Excluded directory filtering', () => {
  it('should exclude files in excluded directories', () => {
    const excludedDirs = ['node_modules/', 'dist/', '.git/'];
    
    fc.assert(
      fc.property(
        fc.array(fc.record({
          path: fc.string(),
          size: fc.integer({ min: 0, max: 1000000 })
        })),
        (files) => {
          const filtered = filterFiles(files, excludedDirs, [], [], []);
          return filtered.every(file => 
            !excludedDirs.some(dir => file.path.includes(dir))
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: repo-analysis-onboarding, Property 17: Environment variable categorization
describe('Property 17: Environment variable categorization', () => {
  it('should categorize env vars correctly', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (varName) => {
          const category = categorizeEnvVar(varName);
          
          if (varName.includes('DATABASE') || varName.includes('DB_')) {
            return category === 'database';
          } else if (varName.includes('API_KEY') || varName.includes('SECRET')) {
            return category === 'api_key';
          } else if (varName.includes('PORT') || varName.includes('HOST')) {
            return category === 'server';
          } else {
            return category === 'general';
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework:** Playwright for end-to-end testing

**Test Scenarios:**

1. **Complete Analysis Flow:**
   - Input repository URL on dashboard
   - Monitor progress on loading page
   - Verify roadmap display on tasks page
   - Complete a task and verify progress update

2. **Chat Interaction:**
   - Send message to Ghost Mentor
   - Verify response is displayed
   - Verify message is saved to Firebase
   - Verify rate limiting after 10 messages

3. **Progress Persistence:**
   - Complete tasks
   - Refresh page
   - Verify completed tasks still checked
   - Verify ghost opacity matches progress

4. **Error Handling:**
   - Test with invalid repository URL
   - Test with private repository (no OAuth)
   - Test with network disconnected
   - Verify error messages and retry options

### Performance Testing

**Metrics to Monitor:**

1. **Analysis Duration:**
   - Target: < 3 minutes for typical repository
   - Measure: Time from pipeline start to completion

2. **File Filtering Efficiency:**
   - Target: 95% reduction in file count
   - Measure: (total_files - analyzed_files) / total_files

3. **Chat Response Time:**
   - Target: < 5 seconds for typical question
   - Measure: Time from request to first response chunk

4. **Page Load Time:**
   - Target: < 2 seconds for tasks page
   - Measure: Time to interactive

**Load Testing:**
- Simulate 10 concurrent analyses
- Verify Firebase rate limits not exceeded
- Verify Gemini API rate limits not exceeded

## Security Considerations

### API Key Protection

- Store all API keys in environment variables
- Never commit .env files to version control
- Use Firebase Functions environment configuration
- Rotate keys regularly

### GitHub OAuth

- Use state parameter to prevent CSRF attacks
- Store tokens encrypted in Firebase
- Implement token refresh logic
- Request minimal scopes (repo:read only)

### Rate Limiting

- Implement per-user rate limits for chat (10/hour)
- Implement per-user rate limits for analysis (5/day)
- Use Firebase Security Rules to enforce limits
- Display clear error messages when limits exceeded

### Data Privacy

- Store only necessary repository metadata
- Do not store actual code content (only Gemini URIs)
- Implement data retention policy (delete after 30 days)
- Allow users to delete their data

### Input Validation

- Validate all user inputs on both client and server
- Sanitize repository URLs before GitHub API calls
- Validate file paths before processing
- Prevent path traversal attacks

## Deployment Architecture

### Frontend Deployment

**Platform:** Vercel

**Configuration:**
- Automatic deployments from main branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard
- Edge functions for API routes

### Backend Deployment

**Platform:** Firebase

**Services:**
- Firestore for data storage
- Firebase Functions for serverless API endpoints
- Firebase Authentication for user management
- Firebase Hosting for static assets (if needed)

**Configuration:**
- Production and staging environments
- Firestore indexes for query optimization
- Security rules for data access control
- Function timeout: 5 minutes for analysis pipeline

### External Services

**GitHub API:**
- Rate limit: 60 requests/hour (unauthenticated)
- Rate limit: 5000 requests/hour (authenticated)
- Strategy: Use authenticated requests when possible

**Google Gemini API:**
- Rate limit: Varies by tier
- Strategy: Implement request queuing
- Fallback: Display rate limit message

**TruffleHog:**
- Deployment: Docker container in Firebase Functions
- Alternative: Cloud Run for better Docker support
- Timeout: 2 minutes max per scan

## Performance Optimization

### Caching Strategy

**Repository Analysis:**
- Cache duration: 30 days
- Cache key: repository URL
- Invalidation: Manual or on expiration

**Gemini File Uploads:**
- Cache duration: 48 hours (Gemini limit)
- Re-upload: Automatic on expiration
- Storage: Firebase Firestore

**Chat Responses:**
- Cache duration: 24 hours
- Cache key: question hash + repo ID
- Storage: Firebase Firestore

### File Filtering Optimization

**Strategy:**
- Filter by directory first (fastest)
- Then by extension
- Then by size
- Finally include critical files

**Expected Performance:**
- 5000 files → 250 files in < 1 second

### Parallel Processing

**File Uploads:**
- Upload files in batches of 10
- Use Promise.all for parallel uploads
- Continue on individual failures

**Static Analysis:**
- Run tech stack, database, and env var detection in parallel
- Use Promise.all to wait for all results
- Aggregate results before roadmap generation

## Monitoring and Observability

### Metrics to Track

1. **Analysis Success Rate:**
   - Percentage of analyses that complete successfully
   - Target: > 95%

2. **Average Analysis Duration:**
   - Time from start to completion
   - Target: < 3 minutes

3. **Chat Response Time:**
   - Time from request to first response
   - Target: < 5 seconds

4. **Error Rate by Type:**
   - GitHub API errors
   - Gemini API errors
   - Firebase errors
   - Target: < 5% overall

5. **User Engagement:**
   - Tasks completed per user
   - Chat messages per user
   - Return rate

### Logging Strategy

**Log Levels:**
- ERROR: Critical failures that stop execution
- WARN: Non-critical issues (e.g., file upload failure)
- INFO: Important events (e.g., analysis started)
- DEBUG: Detailed information for troubleshooting

**Log Aggregation:**
- Use Firebase Functions logging
- Export to external service (e.g., Datadog, LogRocket)
- Set up alerts for error spikes

### Health Checks

**Endpoints:**
- `/api/health` - Basic health check
- `/api/health/github` - GitHub API connectivity
- `/api/health/gemini` - Gemini API connectivity
- `/api/health/firebase` - Firebase connectivity

**Monitoring:**
- Check endpoints every 5 minutes
- Alert on 3 consecutive failures
- Display status page for users
