# **Analysis Workflow Explanation with Optional OAuth.**

Your approach:
- ✅ **Default: Public repos** (no friction, works immediately)
- ✅ **Optional: GitHub OAuth** (unlock private repos if needed)
- ✅ **Progressive enhancement** (basic → advanced features)

This is **exactly** how professional apps work (GitHub Copilot, Vercel, etc.)

---

## **Analysis Workflow Explanation (Kiro Spec-Ready Format)**

Below is the workflow written as both human-readable documentation AND a Kiro prompt. You can paste this directly into Kiro's spec feature.

---

```markdown
# OnboardGhost Repository Analysis Workflow Specification

## System Overview
OnboardGhost is an AI-powered developer onboarding platform that analyzes GitHub repositories and generates personalized onboarding roadmaps with an intelligent chatbot (Ghost Mentor) that answers codebase-specific questions.

---

## Core Analysis Pipeline: Step-by-Step Workflow

### Input Requirements
- **Primary Input:** GitHub repository URL (format: `https://github.com/owner/repo`)
- **Optional Input:** GitHub OAuth access token (enables private repository access)
- **Constraints:** 
  - Repository must be accessible (public OR user has OAuth token with repo:read scope)
  - Repository size should be under 500MB (filter large repos)
  - Supported languages: JavaScript, TypeScript, Python, Ruby, Go, Rust, PHP, Java

---

## STEP 1: Repository Acquisition & Access Control

**Objective:** Fetch repository metadata and determine access permissions.

**Process:**
1. Parse GitHub URL to extract owner name and repository name
2. Check if user has GitHub OAuth token in session
3. If token exists:
   - Attempt authenticated API call to `GET /repos/:owner/:repo`
   - If successful: User can access private repos
   - If fails (401/403): Token invalid, fall back to public access
4. If no token:
   - Attempt unauthenticated API call to `GET /repos/:owner/:repo`
   - If successful: Repository is public, proceed
   - If fails (404): Repository doesn't exist or is private, show error with OAuth option

**API Implementation:**
```javascript
async function verifyRepositoryAccess(owner, repo, githubToken = null) {
  const headers = githubToken 
    ? { 'Authorization': `Bearer ${githubToken}` }
    : {};
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found or private. Connect GitHub to access private repos.');
    }
    throw new Error('Failed to access repository');
  }
  
  return await response.json();
}
```

**Output Data Structure:**
```typescript
interface RepositoryMetadata {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  language: string;
  size: number; // in KB
  is_private: boolean;
}
```

**Error Handling:**
- **404 Not Found:** Display message: "Repository not found or is private. [Connect GitHub] to access private repositories."
- **403 Forbidden:** Rate limit hit or insufficient permissions
- **Network errors:** Retry up to 3 times with exponential backoff

---

## STEP 2: File Tree Retrieval & Smart Filtering

**Objective:** Get complete file structure and filter to relevant files only (exclude binaries, dependencies, build artifacts).

**Process:**
1. Fetch complete file tree using recursive tree API: `GET /repos/:owner/:repo/git/trees/:branch?recursive=1`
2. Apply multi-stage filtering to eliminate irrelevant files:

**Filtering Rules (Priority Order):**

**Stage 1 - Directory Exclusions (ALWAYS SKIP):**
```javascript
const EXCLUDED_DIRECTORIES = [
  'node_modules/', 'dist/', 'build/', '.next/', '.vercel/',
  'coverage/', '__pycache__/', '.pytest_cache/', 'venv/', 'env/',
  'vendor/', 'target/', 'out/', 'bin/', 'obj/',
  '.git/', '.github/workflows/', '.idea/', '.vscode/',
  'public/images/', 'public/assets/', 'static/media/'
];
```

**Stage 2 - File Extension Exclusions (Binary/Media Files):**
```javascript
const EXCLUDED_EXTENSIONS = [
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  // Videos
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  // Archives
  '.zip', '.tar', '.gz', '.rar', '.7z',
  // Documents
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  // Binaries
  '.exe', '.dll', '.so', '.dylib', '.bin',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot',
  // Lockfiles (parse separately, don't include in embeddings)
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock'
];
```

**Stage 3 - Prioritized File Inclusions (ALWAYS ANALYZE):**
```javascript
const CRITICAL_FILES = [
  // Documentation
  'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'LICENSE',
  // Configuration
  'package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml',
  'Gemfile', 'Cargo.toml', 'go.mod', 'composer.json',
  '.env.example', '.env.sample', 'config.example.js',
  'docker-compose.yml', 'Dockerfile', '.dockerignore',
  // Build/Deploy
  'tsconfig.json', 'webpack.config.js', 'vite.config.js',
  'next.config.js', 'tailwind.config.js',
  // Testing
  'jest.config.js', 'pytest.ini', 'phpunit.xml'
];
```

**Stage 4 - Code File Inclusions (Source Code Only):**
```javascript
const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Python
  '.py', '.pyx',
  // Ruby
  '.rb', '.rake',
  // Go
  '.go',
  // Rust
  '.rs',
  // PHP
  '.php',
  // Java/Kotlin
  '.java', '.kt', '.kts',
  // C-family
  '.c', '.cpp', '.h', '.hpp',
  // Other
  '.vue', '.svelte', '.astro'
];
```

**Stage 5 - Size Filtering:**
```javascript
const MAX_FILE_SIZE = 1024 * 1024; // 1MB - skip files larger than this
```

**Complete Filtering Function:**
```javascript
function shouldAnalyzeFile(filePath, fileSize) {
  // Skip if in excluded directory
  if (EXCLUDED_DIRECTORIES.some(dir => filePath.includes(dir))) {
    return false;
  }
  
  // Always include critical files (even if large)
  if (CRITICAL_FILES.some(file => filePath.endsWith(file))) {
    return true;
  }
  
  // Skip if excluded extension
  if (EXCLUDED_EXTENSIONS.some(ext => filePath.endsWith(ext))) {
    return false;
  }
  
  // Skip if too large
  if (fileSize > MAX_FILE_SIZE) {
    return false;
  }
  
  // Include if code file
  if (CODE_EXTENSIONS.some(ext => filePath.endsWith(ext))) {
    return true;
  }
  
  // Default: skip
  return false;
}
```

**Expected Output:**
- Typical repository: 5,000 total files → **150-250 filtered files** for analysis
- Reduction: ~95%

**Output Data Structure:**
```typescript
interface FileTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size: number;
  sha: string;
  url: string;
}

interface FilteredFileTree {
  total_files: number;
  analyzed_files: number;
  skipped_files: number;
  files: FileTreeItem[];
  critical_files: FileTreeItem[]; // README, package.json, etc.
  code_files: FileTreeItem[]; // Source code
}
```

---

## STEP 3: Multi-Dimensional Static Analysis

**Objective:** Extract structured data from configuration files, documentation, and project metadata to understand tech stack, dependencies, setup requirements, and project purpose.

### 3A: Tech Stack Detection

**Data Sources (Priority Order):**
1. **Primary Language:** From repository metadata (`language` field)
2. **Framework Detection:** Parse manifest files

**Detection Rules:**

**JavaScript/TypeScript Projects:**
```javascript
async function detectJavaScriptStack(packageJson) {
  const dependencies = { 
    ...packageJson.dependencies, 
    ...packageJson.devDependencies 
  };
  
  return {
    language: 'JavaScript/TypeScript',
    framework: detectFramework(dependencies), // React, Next.js, Vue, etc.
    runtime: packageJson.engines?.node || 'Node.js (version unspecified)',
    package_manager: detectPackageManager(), // npm, yarn, pnpm
    testing: detectTestingFramework(dependencies), // Jest, Vitest, etc.
    ui_library: detectUILibrary(dependencies) // Tailwind, MUI, etc.
  };
}

function detectFramework(deps) {
  if (deps['next']) return 'Next.js';
  if (deps['react']) return 'React';
  if (deps['vue']) return 'Vue.js';
  if (deps['@angular/core']) return 'Angular';
  if (deps['express']) return 'Express.js';
  if (deps['fastify']) return 'Fastify';
  return 'Vanilla JavaScript';
}
```

**Python Projects:**
```javascript
async function detectPythonStack(requirementsTxt, pyprojectToml) {
  const dependencies = parseRequirements(requirementsTxt);
  
  return {
    language: 'Python',
    framework: detectPythonFramework(dependencies), // Django, FastAPI, Flask
    version: pyprojectToml?.tool?.poetry?.dependencies?.python || '3.x',
    testing: detectPythonTesting(dependencies), // pytest, unittest
    orm: detectORM(dependencies) // SQLAlchemy, Django ORM
  };
}

function detectPythonFramework(deps) {
  if (deps.includes('django')) return 'Django';
  if (deps.includes('fastapi')) return 'FastAPI';
  if (deps.includes('flask')) return 'Flask';
  return 'Python Script';
}
```

**Ruby Projects:**
```javascript
async function detectRubyStack(gemfile) {
  const gems = parseGemfile(gemfile);
  
  return {
    language: 'Ruby',
    framework: gems.includes('rails') ? 'Ruby on Rails' : 'Ruby',
    version: extractRubyVersion(gemfile),
    testing: detectRubyTesting(gems), // RSpec, Minitest
    database: detectDatabaseGem(gems) // pg, mysql2, sqlite3
  };
}
```

**Output Data Structure:**
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

---

### 3B: Database Requirements Detection

**Detection Strategy:**
1. Check for database-specific dependencies
2. Parse docker-compose.yml for service definitions
3. Look for migration directories
4. Check .env.example for database connection strings

**Implementation:**
```javascript
async function detectDatabaseRequirements(files, dependencies) {
  const databases = [];
  
  // Check dependencies
  if (dependencies.includes('pg') || dependencies.includes('psycopg2')) {
    databases.push({
      type: 'PostgreSQL',
      required: true,
      setup_guide: 'Install PostgreSQL and create a database'
    });
  }
  
  if (dependencies.includes('mysql2') || dependencies.includes('pymysql')) {
    databases.push({
      type: 'MySQL',
      required: true
    });
  }
  
  if (dependencies.includes('mongodb') || dependencies.includes('pymongo')) {
    databases.push({
      type: 'MongoDB',
      required: true
    });
  }
  
  // Check for migrations
  const hasMigrations = files.some(f => 
    f.path.includes('/migrations/') || 
    f.path.includes('/migrate/')
  );
  
  if (hasMigrations && databases.length > 0) {
    databases[0].migrations_path = findMigrationsPath(files);
    databases[0].requires_migration = true;
  }
  
  return databases;
}
```

**Output:**
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

---

### 3C: Environment Variables Extraction

**Detection Strategy:**
1. Parse .env.example file (primary source)
2. Scan README for environment variable mentions
3. Check docker-compose.yml environment sections
4. Analyze code for process.env usage (limited)

**Implementation:**
```javascript
async function extractEnvironmentVariables(files) {
  const envExample = files.find(f => f.path.endsWith('.env.example'));
  
  if (!envExample) {
    return {
      has_env_example: false,
      variables: [],
      warning: 'No .env.example file found - manual configuration required'
    };
  }
  
  const content = await fetchFileContent(envExample.url);
  const variables = parseEnvFile(content);
  
  return {
    has_env_example: true,
    variables: variables.map(v => ({
      name: v.key,
      description: v.comment || 'No description provided',
      required: !v.hasDefault,
      example_value: v.value,
      category: categorizeEnvVar(v.key) // 'database', 'api_key', 'config'
    }))
  };
}

function categorizeEnvVar(key) {
  if (key.includes('DATABASE') || key.includes('DB_')) return 'database';
  if (key.includes('API_KEY') || key.includes('SECRET')) return 'api_key';
  if (key.includes('PORT') || key.includes('HOST')) return 'server';
  return 'general';
}
```

**Output:**
```typescript
interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  example_value: string;
  category: 'database' | 'api_key' | 'server' | 'general';
}
```

---

### 3D: Project Purpose & Description Extraction

**Objective:** Understand WHAT the project does and WHY it exists (business context).

**Data Sources:**
1. **Primary:** README.md (first 500 words)
2. **Secondary:** package.json `description` field
3. **Tertiary:** Repository description from GitHub metadata

**Implementation:**
```javascript
async function extractProjectPurpose(readmeContent, packageJson, repoMetadata) {
  const prompt = `
    Analyze this project and extract:
    
    1. Project Purpose (1-2 sentences): What problem does this solve?
    2. Core Features (3-5 bullet points): What can users do?
    3. Target Users: Who is this for?
    4. Project Type: (e.g., "REST API", "React Component Library", "CLI Tool")
    
    README excerpt:
    ${readmeContent.slice(0, 2000)}
    
    Package description: ${packageJson?.description || 'N/A'}
    
    Return JSON format:
    {
      "purpose": "...",
      "features": ["...", "..."],
      "target_users": "...",
      "project_type": "..."
    }
  `;
  
  const analysis = await callGeminiAPI(prompt);
  return JSON.parse(analysis);
}
```

**Output:**
```typescript
interface ProjectPurpose {
  purpose: string;
  features: string[];
  target_users: string;
  project_type: string;
}
```

---

### 3E: Setup Instructions Extraction

**Objective:** Parse README to extract step-by-step installation instructions.

**Strategy:**
1. Look for sections titled: "Installation", "Getting Started", "Setup", "Quick Start"
2. Extract sequential commands (code blocks)
3. Identify prerequisites mentioned (Node version, etc.)

**Implementation:**
```javascript
async function extractSetupInstructions(readmeContent) {
  const setupSection = extractSection(readmeContent, [
    'Installation',
    'Getting Started',
    'Setup',
    'Quick Start'
  ]);
  
  if (!setupSection) {
    return {
      has_instructions: false,
      steps: [],
      warning: 'No setup instructions found in README'
    };
  }
  
  const codeBlocks = extractCodeBlocks(setupSection);
  const prerequisites = extractPrerequisites(setupSection);
  
  return {
    has_instructions: true,
    prerequisites: prerequisites,
    steps: codeBlocks.map((block, index) => ({
      order: index + 1,
      command: block.code,
      language: block.language,
      description: block.precedingText
    }))
  };
}

function extractPrerequisites(text) {
  const prereqKeywords = ['requires', 'prerequisite', 'need', 'must have'];
  const lines = text.split('\n');
  const prereqs = [];
  
  lines.forEach(line => {
    if (prereqKeywords.some(kw => line.toLowerCase().includes(kw))) {
      if (line.includes('Node')) prereqs.push('Node.js');
      if (line.includes('Python')) prereqs.push('Python');
      if (line.includes('Docker')) prereqs.push('Docker');
    }
  });
  
  return prereqs;
}
```

---

### 3F: Common Gotchas & Known Issues Detection

**Data Sources:**
1. GitHub Issues (search for "setup", "install", "error")
2. README "Troubleshooting" section
3. Known version incompatibilities

**Implementation:**
```javascript
async function detectCommonGotchas(owner, repo, readmeContent, githubToken) {
  const gotchas = [];
  
  // Check README troubleshooting
  const troubleshootingSection = extractSection(readmeContent, [
    'Troubleshooting',
    'Common Issues',
    'FAQ'
  ]);
  
  if (troubleshootingSection) {
    const issues = parseIssuesList(troubleshootingSection);
    gotchas.push(...issues);
  }
  
  // Check GitHub Issues (optional if token available)
  if (githubToken) {
    const setupIssues = await searchGitHubIssues(
      owner, 
      repo, 
      'label:bug setup OR installation',
      githubToken
    );
    
    const topIssues = setupIssues
      .sort((a, b) => b.reactions['+1'] - a.reactions['+1'])
      .slice(0, 3);
    
    gotchas.push(...topIssues.map(issue => ({
      type: 'github_issue',
      title: issue.title,
      url: issue.html_url,
      reactions: issue.reactions['+1']
    })));
  }
  
  return gotchas;
}
```

---

## STEP 4: Security Scan with TruffleHog

**Objective:** Detect hardcoded secrets (API keys, passwords, tokens) in codebase using specialized security tool.

**Why TruffleHog (not LLM):**
- Purpose-built for secret detection
- 99% accuracy vs ~60% with LLMs
- Scans 10K files in seconds
- Open source and free

**Implementation:**
```javascript
import { execSync } from 'child_process';

async function scanForSecrets(repoPath) {
  try {
    // Run TruffleHog in Docker (no installation needed)
    const result = execSync(
      `docker run --rm -v ${repoPath}:/repo trufflesecurity/trufflehog:latest filesystem /repo --json --no-update`,
      { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      }
    );
    
    const secrets = result
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    return secrets.map(secret => ({
      severity: 'high',
      type: secret.DetectorName,
      file: secret.SourceMetadata.Data.Filesystem.file,
      line: secret.SourceMetadata.Data.Filesystem.line,
      redacted_secret: secret.Raw.slice(0, 10) + '***'
    }));
    
  } catch (error) {
    // TruffleHog exits with code 183 if secrets found
    if (error.status === 183) {
      // Parse stdout for secrets
      const output = error.stdout.toString();
      return parseSecrets(output);
    }
    
    // No secrets found (exit code 0) or other error
    return [];
  }
}
```

**Output:**
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

**Integration into Roadmap:**
- If secrets found: Add to tasks as CRITICAL WARNING
- Task: "🔴 Remove hardcoded secrets from [file.js:line]"

---

## STEP 5: Upload Files to Gemini File Search (RAG Context)

**Objective:** Upload filtered code files to Gemini's File Search tool to enable semantic search for Ghost Mentor chatbot.

**Why Gemini File Search (not custom RAG):**
- Handles chunking automatically (optimal chunk sizes)
- Generates embeddings automatically (optimized for Gemini)
- Manages vector storage (no Pinecone needed)
- Integrates seamlessly with Gemini chat API
- **Faster development:** 4 days → 1 day

**Implementation:**
```javascript
import { GoogleAIFileManager } from "@google/generative-ai/server";

async function uploadFilesToGemini(filteredFiles, owner, repo, githubToken) {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  const uploadedFiles = [];
  
  for (const file of filteredFiles) {
    try {
      // Fetch file content from GitHub
      const content = await fetchFileContent(
        owner, 
        repo, 
        file.path, 
        githubToken
      );
      
      // Create temporary file (Gemini requires file upload, not direct text)
      const tempPath = `/tmp/${file.path.replace(/\//g, '_')}`;
      fs.writeFileSync(tempPath, content);
      
      // Upload to Gemini
      const uploadResult = await fileManager.uploadFile(tempPath, {
        mimeType: "text/plain",
        displayName: `${repo}/${file.path}`
      });
      
      uploadedFiles.push({
        file_path: file.path,
        gemini_uri: uploadResult.file.uri,
        gemini_name: uploadResult.file.name
      });
      
      // Cleanup temp file
      fs.unlinkSync(tempPath);
      
    } catch (error) {
      console.error(`Failed to upload ${file.path}:`, error);
      // Continue with other files
    }
  }
  
  return uploadedFiles;
}
```

**Storage Strategy:**
```typescript
// Store in Supabase for future reference
interface RepoFilesIndex {
  repo_id: string;
  uploaded_at: timestamp;
  files: {
    path: string;
    gemini_uri: string;
    gemini_name: string;
  }[];
  total_files: number;
  expires_at: timestamp; // Gemini files expire after 48 hours
}
```

**Gemini File Retention:**
- Files stored for 48 hours
- After expiration: Re-upload if user returns
- For active repos: Refresh files daily

---

## STEP 6: AI Roadmap Generation

**Objective:** Use Gemini to synthesize all analysis data into a structured onboarding roadmap.

**Input Context:**
- Tech stack analysis
- Database requirements
- Environment variables
- Setup instructions from README
- Common gotchas
- Security issues (if any)
- Project complexity metrics

**Prompt Structure:**
```javascript
async function generateOnboardingRoadmap(analysisData) {
  const prompt = `
    You are an expert developer creating an onboarding roadmap for a new team member.
    
    Repository Analysis:
    - Tech Stack: ${analysisData.tech_stack}
    - Database: ${analysisData.database}
    - Required Env Vars: ${analysisData.env_vars}
    - Project Purpose: ${analysisData.purpose}
    
    Setup Instructions from README:
    ${analysisData.setup_instructions}
    
    Known Issues:
    ${analysisData.gotchas}
    
    Security Warnings:
    ${analysisData.security_issues}
    
    Generate an onboarding roadmap in JSON format:
    
    {
      "sections": [
        {
          "id": "section-1",
          "title": "Environment Setup",
          "goals": ["Get the app running locally"],
          "tasks": [
            {
              "id": "task-1",
              "title": "Install Node.js v18+",
              "description": "Download and install Node.js from nodejs.org",
              "instructions": "Detailed step-by-step...",
              "code_snippet": "node --version",
              "difficulty": "easy",
              "completion_criteria": "Running 'node --version' shows v18 or higher",
              "tips": ["Use nvm for version management"],
              "warnings": ["M1 Mac users may need Rosetta"]
            }
          ]
        }
      ]
    }
    
    Requirements:
    - Structure sections logically: Setup → Architecture Understanding → First Contribution
    - Order tasks by dependency (can't run migrations before DB setup)
    - No time estimates - users progress at their own pace
    - Add tips and warnings from known issues
    - If security issues exist, prioritize fixing them early
    - Include difficulty levels (easy/medium/hard) for user guidance
  `;
  
  const response = await callGeminiAPI(prompt, {
    response_mime_type: "application/json"
  });
  
  return JSON.parse(response);
}
```

**Validation:**
```javascript
function validateRoadmap(roadmap) {
  // Ensure roadmap has required structure
  assert(roadmap.sections.length > 0, 'Must have sections');
  
  roadmap.sections.forEach(section => {
    assert(section.tasks.length > 0, 'Each section must have tasks');
    assert(section.title, 'Section must have title');
    
    section.tasks.forEach(task => {
      assert(task.title, 'Task must have title');
      assert(task.instructions, 'Task must have instructions');
      assert(['easy', 'medium', 'hard'].includes(task.difficulty));
    });
  });
  
  return true;
}
```

**Output Storage:**
```typescript
// Store in Supabase
interface OnboardingRoadmap {
  repo_id: string;
  generated_at: timestamp;
  roadmap: {
    sections: Section[];
  };
  total_tasks: number;
}
```

---

## STEP 7: Ghost Mentor Chat Integration

**Objective:** Enable users to ask questions about the codebase using Gemini's File Search for context-aware answers.

**Architecture:**
```
User Question
    ↓
Frontend (React)
    ↓
Next.js API Route (/api/chat)
    ↓
Retrieve uploaded file URIs from database
    ↓
Gemini API (with File Search tool enabled)
    ↓
Gemini searches uploaded files semantically
    ↓
Gemini generates contextualized answer
    ↓
Stream response back to frontend
```

**Implementation:**
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

async function chatWithGhostMentor(userQuestion, repoId, userId) {
  // Rate limiting
  await enforceRateLimit(userId, 10, 3600); // 10 per hour
  
  // Get uploaded file URIs from database
  const repoFiles = await supabase
    .from('repo_files_index')
    .select('files')
    .eq('repo_id', repoId)
    .single();
  
  if (!repoFiles || repoFiles.files.length === 0) {
    throw new Error('Repository files not found. Please re-analyze.');
  }
  
  // Initialize Gemini with File Search
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: [{
      fileSearch: {
        files: repoFiles.files.map(f => ({ uri: f.gemini_uri }))
      }
    }]
  });
  
  // System prompt for Ghost Mentor personality
  const systemPrompt = `
    You are Ghost Mentor, a friendly AI assistant helping developers understand this codebase.
    
    Guidelines:
    - Answer questions using ONLY the uploaded code files
    - Include file paths in your answers (e.g., "In src/auth/login.js...")
    - Provide code snippets when relevant (max 15 lines)
    - Keep answers under 200 words unless explaining complex architecture
    - If answer isn't in the codebase, say so honestly
    - Offer one follow-up suggestion at the end
    
    Personality:
    - Friendly but professional (no "Hey buddy!")
    - Encouraging without being condescending
    - Technical accuracy over entertainment
  `;
  
  // Generate response
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'll help you understand this codebase." }] }
    ]
  });
  
  const result = await chat.sendMessageStream(userQuestion);
  
  // Stream response back to client
  return result.stream;
}
```

**Response Format:**
```typescript
interface ChatResponse {
  message: string;
  file_references: {
    path: string;
    line_number?: number;
  }[];
  follow_up_suggestion?: string;
  timestamp: string;
}
```

**Rate Limiting:**
```javascript
async function enforceRateLimit(userId, maxRequests, windowSeconds) {
  const key = `rate_limit:chat:
  ${userId}`;
  const current = await redis.get(key);
  
  if (current && parseInt(current) >= maxRequests) {
    throw new Error(`Rate limit exceeded. ${maxRequests} questions per ${windowSeconds / 3600} hour.`);
  }
  
  await redis.incr(key);
  await redis.expire(key, windowSeconds);
}
```

---

## STEP 8: Progress Tracking & Ghost Visualization

**Objective:** Track user task completion and update ghost solidness in real-time.

**State Management:**
```typescript
interface UserProgress {
  user_id: string;
  repo_id: string;
  completed_tasks: string[]; // task IDs
  overall_progress_percentage: number;
  ghost_solidness: number; // 0-100
  started_at: timestamp;
  last_activity: timestamp;
}
```

**Progress Calculation:**
```javascript
function calculateProgress(roadmap, completedTasks) {
  const totalTasks = roadmap.sections.reduce(
    (sum, section) => sum + section.tasks.length, 
    0
  );
  
  const completedCount = completedTasks.length;
  const percentage = Math.round((completedCount / totalTasks) * 100);
  
  return {
    completed: completedCount,
    total: totalTasks,
    percentage: percentage,
    ghost_solidness: percentage // Direct mapping: 70% tasks = 70% solid ghost
  };
}
```

**Real-time Update:**
```javascript
async function markTaskComplete(userId, repoId, taskId) {
  // Update database
  await supabase
    .from('user_progress')
    .update({
      completed_tasks: sql`array_append(completed_tasks, ${taskId})`,
      last_activity: new Date(),
      overall_progress_percentage: calculateNewPercentage()
    })
    .eq('user_id', userId)
    .eq('repo_id', repoId);
  
  // Trigger celebration if milestone reached
  const progress = await getProgress(userId, repoId);
  if ([25, 50, 75, 100].includes(progress.percentage)) {
    await triggerCelebration(progress.percentage);
  }
  
  return progress;
}
```

---

## Error Handling & Edge Cases

### Repository Too Large
```javascript
if (repoMetadata.size > 500000) { // 500MB
  throw new Error('Repository exceeds size limit (500MB). Consider analyzing specific directories.');
}
```

### No README
```javascript
if (!files.some(f => f.path === 'README.md')) {
  return {
    warning: 'No README found',
    roadmap: generateGenericRoadmap(techStack),
    note: 'Generated generic roadmap based on tech stack only'
  };
}
```

### Analysis Timeout
```javascript
const ANALYSIS_TIMEOUT = 5 * 60 * 1000; // 5 minutes

async function analyzeWithTimeout(repoUrl) {
  return Promise.race([
    analyzeRepository(repoUrl),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT)
    )
  ]);
}
```

### Gemini API Failure
```javascript
async function callGeminiWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callGeminiAPI(prompt);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(2 ** i * 1000); // Exponential backoff
    }
  }
}
```

---

## Output: Complete Analysis Package

After all steps complete, return:

```typescript
interface CompleteAnalysis {
  repository: RepositoryMetadata;
  tech_stack: TechStack;
  database: DatabaseRequirement[];
  environment_variables: EnvironmentVariable[];
  security_issues: SecurityIssue[];
  project_purpose: ProjectPurpose;
  roadmap: OnboardingRoadmap;
  uploaded_files: {
    total: number;
    gemini_uris: string[];
  };
  analysis_metadata: {
    analyzed_at: timestamp;
    analysis_duration_seconds: number;
    total_files_scanned: number;
    files_analyzed: number;
  };
}
```

---

## Implementation Notes for Kiro

**When implementing this workflow:**

1. **Prioritize Steps 1-3** (repository access, filtering, static analysis) - this is the foundation
2. **Use Gemini File Search** (Step 5) instead of building custom RAG
3. **Integrate TruffleHog** (Step 4) as Docker container - don't build secret scanning from scratch
4. **Cache aggressively** - analysis results, roadmaps, file uploads should be cached for 30 days
5. **Implement rate limiting** - protect free tier APIs from abuse
6. **Add comprehensive error handling** - GitHub API, Gemini API, and Docker can all fail

**Performance Targets:**
- Repository analysis: 2-3 minutes
- Roadmap generation: 30 seconds
- Chat response: 2-5 seconds

**Cost Optimization:**
- Filter files aggressively (95% reduction)
- Cache all AI responses
- Rate limit users (10 chats/hour)
- Compress prompts (remove unnecessary whitespace)

This workflow should result in a production-ready analysis system that impresses judges with its depth while remaining buildable in real-time.
```

---

## **This Explanation Is Now:**

✅ **Human-readable** (developers can understand the flow)  
✅ **Kiro-ready** (detailed enough for spec-driven development)  
✅ **Implementation-focused** (includes code examples and data structures)  
✅ **Complete** (covers all steps)  
✅ **User-friendly** (no time pressure - progress at your own pace)  
✅ **Includes optional OAuth** (progressive enhancement strategy)  

**You can now:**
1. Paste this into Kiro's spec feature
2. Use it as your implementation blueprint
3. Reference it in your competition documentation