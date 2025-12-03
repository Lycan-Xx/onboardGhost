# Requirements Document

## Introduction

OnboardGhost is an AI-powered developer onboarding platform that analyzes GitHub repositories and generates personalized onboarding roadmaps. The system performs comprehensive repository analysis including tech stack detection, security scanning, and intelligent file filtering, then creates structured learning paths with an AI chatbot (Ghost Mentor) that answers codebase-specific questions using semantic search.

## Glossary

- **OnboardGhost System**: The complete AI-powered onboarding platform
- **Repository Analysis Pipeline**: The 8-step automated process that analyzes GitHub repositories
- **Ghost Mentor**: The AI chatbot assistant that answers codebase-specific questions
- **Onboarding Roadmap**: A structured, sequential list of tasks for developers to complete
- **File Filtering**: The process of reducing repository files by 95% to focus on relevant code
- **Gemini File Search**: Google's AI service for semantic search over uploaded documents
- **Firebase Backend**: The cloud database and serverless functions infrastructure
- **Progress Tracking**: The system that monitors task completion and updates ghost visualization
- **Ghost Solidness**: A visual indicator (0-100%) showing onboarding progress
- **Tech Stack Detection**: Automated identification of frameworks, languages, and dependencies
- **Security Scan**: Automated detection of hardcoded secrets using TruffleHog
- **GitHub OAuth**: Optional authentication to access private repositories
- **Real-time Progress Logs**: Live updates displayed during analysis execution

## Requirements

### Requirement 1: Repository Input and Validation

**User Story:** As a developer, I want to input a GitHub repository URL on the dashboard, so that the system can analyze it and generate an onboarding roadmap.

#### Acceptance Criteria

1. WHEN a user enters a GitHub repository URL in the format `https://github.com/owner/repo` THEN the OnboardGhost System SHALL validate the URL format before proceeding
2. WHEN the URL format is invalid THEN the OnboardGhost System SHALL display an error message indicating the correct format
3. WHEN a valid URL is submitted THEN the OnboardGhost System SHALL extract the owner name and repository name from the URL
4. WHEN the repository size exceeds 500MB THEN the OnboardGhost System SHALL reject the analysis and display a size limit error message
5. WHEN a valid repository URL is submitted THEN the OnboardGhost System SHALL redirect the user to the loading page with the repository information

### Requirement 2: GitHub Repository Access Control

**User Story:** As a developer, I want the system to access both public and private repositories, so that I can analyze any codebase I have permission to view.

#### Acceptance Criteria

1. WHEN a user has not provided a GitHub OAuth token THEN the OnboardGhost System SHALL attempt to access the repository as a public repository
2. WHEN a user has provided a GitHub OAuth token THEN the OnboardGhost System SHALL use the token to authenticate API requests to GitHub
3. WHEN accessing a public repository without authentication THEN the OnboardGhost System SHALL make an unauthenticated API call to `GET /repos/:owner/:repo`
4. WHEN the repository is not found or is private and no token is provided THEN the OnboardGhost System SHALL display an error message with an option to connect GitHub OAuth
5. WHEN the GitHub API returns a 403 status code THEN the OnboardGhost System SHALL retry the request up to 3 times with exponential backoff

### Requirement 3: File Tree Retrieval and Smart Filtering

**User Story:** As a developer, I want the system to intelligently filter repository files, so that only relevant code files are analyzed and processing time is minimized.

#### Acceptance Criteria

1. WHEN the Repository Analysis Pipeline fetches the file tree THEN the OnboardGhost System SHALL use the GitHub API endpoint `GET /repos/:owner/:repo/git/trees/:branch?recursive=1`
2. WHEN filtering files THEN the OnboardGhost System SHALL exclude all files in directories matching the excluded directories list (node_modules, dist, build, .next, .vercel, coverage, __pycache__, .pytest_cache, venv, env, vendor, target, out, bin, obj, .git, .github/workflows, .idea, .vscode, public/images, public/assets, static/media)
3. WHEN filtering files THEN the OnboardGhost System SHALL exclude all files with extensions matching the excluded extensions list (png, jpg, jpeg, gif, svg, ico, webp, mp4, mov, avi, mkv, webm, zip, tar, gz, rar, 7z, pdf, doc, docx, ppt, pptx, exe, dll, so, dylib, bin, woff, woff2, ttf, eot, package-lock.json, yarn.lock, pnpm-lock.yaml, poetry.lock)
4. WHEN filtering files THEN the OnboardGhost System SHALL always include critical files (README.md, CONTRIBUTING.md, CHANGELOG.md, LICENSE, package.json, requirements.txt, Pipfile, pyproject.toml, Gemfile, Cargo.toml, go.mod, composer.json, .env.example, .env.sample, docker-compose.yml, Dockerfile, tsconfig.json, webpack.config.js, vite.config.js, next.config.js, tailwind.config.js, jest.config.js, pytest.ini, phpunit.xml)
5. WHEN a file size exceeds 1MB and is not a critical file THEN the OnboardGhost System SHALL exclude the file from analysis
6. WHEN filtering is complete THEN the OnboardGhost System SHALL reduce the total file count by approximately 95%

### Requirement 4: Tech Stack Detection

**User Story:** As a developer, I want the system to automatically detect the technology stack, so that I understand what frameworks and tools the project uses.

#### Acceptance Criteria

1. WHEN analyzing a JavaScript or TypeScript project THEN the OnboardGhost System SHALL parse the package.json file to detect the framework (React, Next.js, Vue, Angular, Express, Fastify)
2. WHEN analyzing a Python project THEN the OnboardGhost System SHALL parse requirements.txt or pyproject.toml to detect the framework (Django, FastAPI, Flask)
3. WHEN analyzing a Ruby project THEN the OnboardGhost System SHALL parse the Gemfile to detect if Ruby on Rails is used
4. WHEN dependencies are detected THEN the OnboardGhost System SHALL identify the testing framework (Jest, Vitest, pytest, RSpec, Minitest)
5. WHEN dependencies are detected THEN the OnboardGhost System SHALL identify UI libraries (Tailwind, Material-UI, Bootstrap)

### Requirement 5: Database Requirements Detection

**User Story:** As a developer, I want the system to detect database requirements, so that I know what databases I need to install and configure.

#### Acceptance Criteria

1. WHEN analyzing dependencies THEN the OnboardGhost System SHALL detect PostgreSQL if pg or psycopg2 is present
2. WHEN analyzing dependencies THEN the OnboardGhost System SHALL detect MySQL if mysql2 or pymysql is present
3. WHEN analyzing dependencies THEN the OnboardGhost System SHALL detect MongoDB if mongodb or pymongo is present
4. WHEN a database is detected and migration directories exist THEN the OnboardGhost System SHALL mark that migrations are required
5. WHEN database requirements are detected THEN the OnboardGhost System SHALL include setup instructions in the analysis results

### Requirement 6: Environment Variables Extraction

**User Story:** As a developer, I want the system to extract required environment variables, so that I know what configuration is needed to run the application.

#### Acceptance Criteria

1. WHEN a .env.example file exists THEN the OnboardGhost System SHALL parse the file to extract all environment variable names and example values
2. WHEN parsing environment variables THEN the OnboardGhost System SHALL categorize each variable as database, api_key, server, or general based on the variable name
3. WHEN an environment variable has a comment THEN the OnboardGhost System SHALL extract the comment as the variable description
4. WHEN an environment variable has no default value THEN the OnboardGhost System SHALL mark the variable as required
5. WHEN no .env.example file exists THEN the OnboardGhost System SHALL return a warning indicating manual configuration is required

### Requirement 7: Security Scanning with TruffleHog

**User Story:** As a developer, I want the system to detect hardcoded secrets in the codebase, so that I can identify and remove security vulnerabilities.

#### Acceptance Criteria

1. WHEN the Repository Analysis Pipeline reaches the security scan step THEN the OnboardGhost System SHALL execute TruffleHog in a Docker container
2. WHEN TruffleHog detects secrets THEN the OnboardGhost System SHALL record the secret type, file path, line number, and a redacted version of the secret
3. WHEN secrets are found THEN the OnboardGhost System SHALL mark them as high severity security issues
4. WHEN TruffleHog execution fails THEN the OnboardGhost System SHALL continue the analysis and log the error
5. WHEN secrets are detected THEN the OnboardGhost System SHALL include removal tasks in the generated roadmap with critical priority

### Requirement 8: File Upload to Gemini File Search

**User Story:** As a developer, I want the system to upload filtered code files to Gemini, so that the Ghost Mentor chatbot can answer questions about the codebase.

#### Acceptance Criteria

1. WHEN filtered files are ready THEN the OnboardGhost System SHALL fetch the content of each file from the GitHub API
2. WHEN uploading files to Gemini THEN the OnboardGhost System SHALL use the Google AI File Manager with the configured API key
3. WHEN a file is successfully uploaded THEN the OnboardGhost System SHALL store the Gemini URI and file name in Firebase
4. WHEN a file upload fails THEN the OnboardGhost System SHALL log the error and continue with remaining files
5. WHEN all uploads are complete THEN the OnboardGhost System SHALL store the total count and expiration timestamp (48 hours from upload)

### Requirement 9: AI Roadmap Generation

**User Story:** As a developer, I want the system to generate a structured onboarding roadmap, so that I have a clear path to understand and contribute to the codebase.

#### Acceptance Criteria

1. WHEN generating the roadmap THEN the OnboardGhost System SHALL provide Gemini with tech stack analysis, database requirements, environment variables, setup instructions, known issues, and security warnings as context
2. WHEN Gemini generates the roadmap THEN the OnboardGhost System SHALL validate that the response contains sections with tasks
3. WHEN structuring the roadmap THEN the OnboardGhost System SHALL organize sections logically (Environment Setup, Architecture Understanding, First Contribution)
4. WHEN creating tasks THEN the OnboardGhost System SHALL include title, description, instructions, code snippets, difficulty level, completion criteria, tips, and warnings for each task
5. WHEN the roadmap is generated THEN the OnboardGhost System SHALL store it in Firebase with the repository ID and generation timestamp

### Requirement 10: Real-time Progress Logging

**User Story:** As a developer, I want to see real-time updates during repository analysis, so that I know the system is working and understand what step is currently executing.

#### Acceptance Criteria

1. WHEN the Repository Analysis Pipeline starts THEN the OnboardGhost System SHALL display a progress log on the loading page
2. WHEN each analysis step begins THEN the OnboardGhost System SHALL append a log entry with the step name and timestamp
3. WHEN file filtering completes THEN the OnboardGhost System SHALL display the total files found and the number of relevant files after filtering
4. WHEN tech stack detection completes THEN the OnboardGhost System SHALL display the detected framework and language
5. WHEN the analysis completes THEN the OnboardGhost System SHALL redirect the user to the tasks page

### Requirement 11: Ghost Mentor Chat Integration

**User Story:** As a developer, I want to ask questions about the codebase to an AI chatbot, so that I can get instant answers without manually searching through files.

#### Acceptance Criteria

1. WHEN a user submits a question THEN the OnboardGhost System SHALL retrieve the uploaded file URIs from Firebase for the current repository
2. WHEN initializing the chat THEN the OnboardGhost System SHALL configure Gemini with File Search tools using the uploaded file URIs
3. WHEN generating a response THEN the Ghost Mentor SHALL use only the uploaded code files to answer questions
4. WHEN providing answers THEN the Ghost Mentor SHALL include file paths and line numbers when referencing specific code
5. WHEN the answer is not found in the codebase THEN the Ghost Mentor SHALL explicitly state that the information is not available in the analyzed files

### Requirement 12: Progress Tracking and Ghost Visualization

**User Story:** As a developer, I want to track my onboarding progress with a visual ghost indicator, so that I can see how much of the roadmap I have completed.

#### Acceptance Criteria

1. WHEN a user marks a task as complete THEN the OnboardGhost System SHALL update the completed tasks array in Firebase
2. WHEN calculating progress THEN the OnboardGhost System SHALL divide the number of completed tasks by the total number of tasks and multiply by 100
3. WHEN progress is updated THEN the OnboardGhost System SHALL set the ghost solidness value equal to the progress percentage
4. WHEN progress reaches 25%, 50%, 75%, or 100% THEN the OnboardGhost System SHALL trigger a celebration animation
5. WHEN a user returns to the tasks page THEN the OnboardGhost System SHALL load the saved progress from Firebase and display the current ghost solidness

### Requirement 13: Firebase Backend Integration

**User Story:** As a developer, I want the system to use Firebase for data storage and serverless functions, so that the application is scalable and cost-effective.

#### Acceptance Criteria

1. WHEN storing repository analysis results THEN the OnboardGhost System SHALL create a document in the repositories collection with the repository ID as the document key
2. WHEN storing roadmaps THEN the OnboardGhost System SHALL create a document in the roadmaps collection with the repository ID as the document key
3. WHEN storing user progress THEN the OnboardGhost System SHALL create a document in the user_progress subcollection under the user ID with the repository ID as the document key
4. WHEN storing chat messages THEN the OnboardGhost System SHALL create documents in the chat_history subcollection with auto-generated message IDs
5. WHEN executing the analysis pipeline THEN the OnboardGhost System SHALL use Firebase Cloud Functions to handle the serverless execution

### Requirement 14: Rate Limiting and Cost Optimization

**User Story:** As a system administrator, I want to implement rate limiting on API calls, so that the system remains within free tier limits and prevents abuse.

#### Acceptance Criteria

1. WHEN a user sends a chat message THEN the OnboardGhost System SHALL enforce a rate limit of 10 messages per hour per user
2. WHEN the rate limit is exceeded THEN the OnboardGhost System SHALL return an error message indicating the limit and when it resets
3. WHEN uploading files to Gemini THEN the OnboardGhost System SHALL only upload filtered files to reduce API costs by 95%
4. WHEN generating roadmaps THEN the OnboardGhost System SHALL cache the results in Firebase for 30 days to avoid regenerating identical roadmaps
5. WHEN a cached analysis exists and is less than 30 days old THEN the OnboardGhost System SHALL return the cached results instead of re-analyzing

### Requirement 15: Error Handling and Recovery

**User Story:** As a developer, I want the system to handle errors gracefully, so that temporary failures do not prevent me from completing the analysis.

#### Acceptance Criteria

1. WHEN a GitHub API call fails with a network error THEN the OnboardGhost System SHALL retry the request up to 3 times with exponential backoff
2. WHEN the analysis exceeds 5 minutes THEN the OnboardGhost System SHALL timeout and display an error message
3. WHEN Gemini API calls fail THEN the OnboardGhost System SHALL retry up to 3 times before failing
4. WHEN no README file is found THEN the OnboardGhost System SHALL generate a generic roadmap based on the detected tech stack
5. WHEN critical errors occur THEN the OnboardGhost System SHALL log the error details to Firebase and display a user-friendly error message
