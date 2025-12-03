# Implementation Plan

- [ ] 1. Set up project infrastructure and Firebase configuration



  - Install Firebase SDK and initialize Firebase project
  - Configure Firestore database with collections structure
  - Set up Firebase Authentication
  - Create environment variables file with API keys (GitHub, Gemini, Firebase)
  - Configure Next.js API routes structure
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 1.1 Write property test for Firebase configuration
  - **Property 46: Analysis timestamp storage**
  - **Validates: Requirements 20.4**




- [ ] 2. Implement core utility functions and types
  - Create TypeScript interfaces for all data models (RepositoryMetadata, TechStack, DatabaseRequirement, EnvironmentVariable, SecurityIssue, OnboardingRoadmap, UserProgress, ChatMessage)
  - Implement URL validation and parsing utilities
  - Implement retry with exponential backoff utility
  - Implement timeout wrapper utility
  - Implement error handling utilities
  - _Requirements: 1.1, 1.2, 1.3, 2.5, 19.2_

- [ ]* 2.1 Write property test for URL validation
  - **Property 1: URL format validation**
  - **Validates: Requirements 1.1**

- [ ]* 2.2 Write property test for URL parsing
  - **Property 2: URL parsing round-trip**
  - **Validates: Requirements 1.2**

- [ ]* 2.3 Write property test for invalid URL rejection
  - **Property 3: Invalid URL rejection**
  - **Validates: Requirements 1.3**

- [x]* 2.4 Write property test for retry mechanism


  - **Property 4: Retry with exponential backoff**
  - **Validates: Requirements 2.4**

- [ ] 3. Implement GitHub repository access and validation
  - Create GitHub API client with authentication support
  - Implement repository metadata fetching function
  - Implement OAuth token validation
  - Implement repository size validation (500MB limit)
  - Add error handling for 404, 403, and network errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.4_

- [ ]* 3.1 Write property test for repository metadata completeness
  - **Property 5: Repository metadata completeness**
  - **Validates: Requirements 2.5**

- [x]* 3.2 Write unit tests for GitHub API error handling


  - Test 404 error with OAuth suggestion
  - Test 403 error with retry logic
  - Test network error handling
  - _Requirements: 2.4, 2.5_

- [ ] 4. Implement file tree retrieval and smart filtering
  - Create function to fetch complete file tree from GitHub API
  - Implement multi-stage filtering logic (directories, extensions, critical files, size)
  - Create constants for excluded directories, excluded extensions, critical files, and code extensions
  - Implement file categorization (critical vs code files)
  - Calculate filtering statistics (total vs analyzed files)
  - _Requirements: 3.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 4.1 Write property test for excluded directory filtering
  - **Property 8: Excluded directory filtering**
  - **Validates: Requirements 4.2**

- [ ]* 4.2 Write property test for excluded extension filtering
  - **Property 9: Excluded extension filtering**
  - **Validates: Requirements 4.3**

- [-]* 4.3 Write property test for critical files inclusion

  - **Property 10: Critical files always included**
  - **Validates: Requirements 4.4**

- [ ]* 4.4 Write property test for code file size filtering
  - **Property 11: Code file size filtering**
  - **Validates: Requirements 4.5**

- [ ] 5. Implement tech stack detection


  - Create function to detect JavaScript/TypeScript stack from package.json
  - Create function to detect Python stack from requirements.txt and pyproject.toml
  - Create function to detect Ruby stack from Gemfile
  - Implement framework detection logic for each language
  - Implement testing framework detection
  - Implement UI library detection
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for tech stack detection completeness
  - **Property 12: Tech stack detection completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ]* 5.2 Write property test for dependency categorization
  - **Property 13: Dependency categorization**
  - **Validates: Requirements 5.4**



- [ ] 6. Implement database requirements detection
  - Create function to detect database dependencies (PostgreSQL, MySQL, MongoDB)
  - Implement migration directory detection
  - Implement docker-compose.yml parsing for database services
  - Create database requirement objects with setup guides
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 6.1 Write property test for database detection with migrations
  - **Property 14: Database detection with migrations**
  - **Validates: Requirements 6.4**

- [x]* 6.2 Write property test for database requirements completeness


  - **Property 15: Database requirements completeness**
  - **Validates: Requirements 6.5**

- [ ] 7. Implement environment variables extraction
  - Create .env.example file parser
  - Implement environment variable categorization logic
  - Extract comments as descriptions
  - Determine required vs optional variables
  - Handle missing .env.example file case
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 7.1 Write property test for environment variable extraction completeness
  - **Property 16: Environment variable extraction completeness**
  - **Validates: Requirements 7.1, 7.2**



- [ ]* 7.2 Write property test for environment variable categorization
  - **Property 17: Environment variable categorization**
  - **Validates: Requirements 7.3, 7.4**

- [ ] 8. Implement project purpose extraction
  - Create function to extract README.md content
  - Implement Gemini API call for project purpose analysis
  - Parse JSON response with purpose, features, target_users, and project_type
  - Handle missing README case
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 8.1 Write property test for project purpose completeness
  - **Property 18: Project purpose completeness**
  - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

- [ ] 9. Implement setup instructions extraction
  - Create function to extract sections from README (Installation, Getting Started, Setup, Quick Start)
  - Implement code block extraction with language detection
  - Implement prerequisite detection (Node.js, Python, Docker)
  - Handle missing setup instructions case
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 9.1 Write property test for setup instructions extraction
  - **Property 19: Setup instructions extraction**
  - **Validates: Requirements 9.2, 9.4**

- [ ]* 9.2 Write property test for prerequisite detection
  - **Property 20: Prerequisite detection**
  - **Validates: Requirements 9.3**

- [ ] 10. Implement security scanning with TruffleHog
  - Set up Docker integration for TruffleHog execution
  - Create function to run TruffleHog scan on repository
  - Parse TruffleHog JSON output
  - Create SecurityIssue objects with redacted secrets
  - Handle TruffleHog execution failures gracefully
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 10.1 Write property test for security issue completeness
  - **Property 21: Security issue completeness**
  - **Validates: Requirements 10.2**

- [ ]* 10.2 Write property test for security issues marked high severity
  - **Property 22: Security issues marked high severity**
  - **Validates: Requirements 10.3**

- [ ]* 10.3 Write property test for security issues in roadmap
  - **Property 23: Security issues in roadmap**
  - **Validates: Requirements 10.5**

- [ ] 11. Implement Gemini file upload for RAG
  - Install Google Generative AI SDK
  - Create function to fetch file content from GitHub
  - Implement file upload to Gemini File Manager
  - Store Gemini URIs and file names in Firebase
  - Handle file upload failures without stopping pipeline
  - Track total uploaded files and expiration timestamp
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 11.1 Write property test for file upload storage completeness
  - **Property 24: File upload storage completeness**
  - **Validates: Requirements 11.3, 11.5**

- [ ]* 11.2 Write property test for file upload failure resilience
  - **Property 25: File upload failure resilience**
  - **Validates: Requirements 11.4**

- [ ] 12. Implement AI roadmap generation
  - Create Gemini prompt template for roadmap generation
  - Implement function to aggregate all analysis data as context
  - Call Gemini API with JSON response format
  - Implement roadmap validation function
  - Store generated roadmap in Firebase
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ]* 12.1 Write property test for roadmap structure validation
  - **Property 26: Roadmap structure validation**
  - **Validates: Requirements 12.2, 12.3, 12.7**

- [x]* 12.2 Write property test for roadmap section ordering


  - **Property 27: Roadmap section ordering**
  - **Validates: Requirements 12.4**

- [ ]* 12.3 Write property test for security tasks prioritized early
  - **Property 28: Security tasks prioritized early**
  - **Validates: Requirements 12.6**

- [ ] 13. Implement analysis pipeline orchestration
  - Create main analysis pipeline function that executes steps 1-8 sequentially
  - Implement progress tracking in Firebase (analysis_progress collection)
  - Add real-time progress updates after each step
  - Implement pipeline timeout (5 minutes)
  - Add error handling and recovery for each step
  - Implement caching logic (30-day cache)
  - _Requirements: 3.2, 3.3, 3.4, 19.1, 19.3, 20.1, 20.2, 20.3_

- [ ]* 13.1 Write property test for progress display for all steps
  - **Property 6: Progress display for all steps**
  - **Validates: Requirements 3.2**

- [ ]* 13.2 Write property test for pipeline stops on failure
  - **Property 7: Pipeline stops on failure**
  - **Validates: Requirements 3.4**

- [ ]* 13.3 Write property test for cache hit for recent analysis
  - **Property 44: Cache hit for recent analysis**
  - **Validates: Requirements 20.2**

- [ ]* 13.4 Write property test for cache expiration and re-analysis
  - **Property 45: Cache expiration and re-analysis**
  - **Validates: Requirements 20.3**

- [ ] 14. Create Dashboard page UI
  - Build repository URL input form with validation
  - Add GitHub OAuth button (optional)
  - Implement form submission handler
  - Add loading state during validation
  - Display error messages for invalid URLs or size limits
  - Redirect to loading page on successful submission
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 14.1 Write unit tests for dashboard form validation
  - Test valid URL acceptance
  - Test invalid URL rejection
  - Test error message display
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 15. Create Loading page UI with real-time progress
  - Build progress log display component
  - Implement Firebase real-time listener for analysis_progress
  - Display current step name and status
  - Show detailed logs for each completed step
  - Add progress bar visualization
  - Implement automatic redirect to tasks page on completion
  - Display error messages and retry option on failure
  - _Requirements: 3.2, 3.3, 3.4, 1.5_

- [ ]* 15.1 Write unit tests for loading page progress display
  - Test log entry rendering
  - Test progress bar calculation
  - Test redirect on completion
  - _Requirements: 3.2, 3.3_

- [ ] 16. Create Tasks page UI with roadmap display
  - Build roadmap section and task list components
  - Implement task expansion/collapse functionality
  - Add task completion checkboxes
  - Display task details (instructions, code snippets, tips, warnings)
  - Show difficulty badges
  - Load roadmap from Firebase on page mount
  - _Requirements: 12.1, 13.1, 13.2, 13.3_

- [ ]* 16.1 Write unit tests for task list rendering
  - Test section rendering
  - Test task expansion
  - Test difficulty badge display
  - _Requirements: 12.1_

- [ ] 17. Implement progress tracking functionality
  - Create function to mark tasks as complete/incomplete
  - Implement progress calculation (completed / total * 100)
  - Update Firebase user_progress on task toggle
  - Update last_activity timestamp
  - Implement milestone celebration triggers (25%, 50%, 75%, 100%)
  - Load saved progress on page mount
  - _Requirements: 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 17.1 Write property test for task completion updates progress
  - **Property 29: Task completion updates progress**
  - **Validates: Requirements 13.5**

- [ ]* 17.2 Write property test for completed tasks stored
  - **Property 30: Completed tasks stored**
  - **Validates: Requirements 14.1**

- [ ]* 17.3 Write property test for progress calculation formula
  - **Property 31: Progress calculation formula**
  - **Validates: Requirements 14.2**

- [ ]* 17.4 Write property test for last activity timestamp updated
  - **Property 32: Last activity timestamp updated**
  - **Validates: Requirements 14.3**

- [ ]* 17.5 Write property test for progress persistence
  - **Property 33: Progress persistence**
  - **Validates: Requirements 14.4**

- [ ]* 17.6 Write property test for milestone celebrations
  - **Property 34: Milestone celebrations**
  - **Validates: Requirements 14.5**

- [ ] 18. Create Ghost visualization component
  - Build SVG ghost graphic with opacity control
  - Implement opacity calculation based on progress percentage
  - Add smooth transition animations
  - Create celebration animation for milestones
  - Integrate with progress tracking
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 18.1 Write property test for ghost opacity matches progress
  - **Property 35: Ghost opacity matches progress**
  - **Validates: Requirements 15.1**

- [ ]* 18.2 Write unit tests for ghost animation
  - Test opacity transitions
  - Test celebration animation triggers
  - _Requirements: 15.2, 15.3_

- [ ] 19. Implement Ghost Mentor chat interface
  - Build chat UI with message history display
  - Create message input form
  - Implement user/assistant message distinction
  - Add file reference links in messages
  - Show typing indicator during response generation
  - Display rate limit warnings
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ]* 19.1 Write property test for file references in chat responses
  - **Property 36: File references in chat responses**
  - **Validates: Requirements 16.6**

- [ ]* 19.2 Write unit tests for chat UI
  - Test message rendering
  - Test file reference link display
  - Test typing indicator
  - _Requirements: 16.2, 16.3_

- [ ] 20. Implement Ghost Mentor chat backend
  - Create /api/chat endpoint
  - Implement rate limiting (10 messages per hour per user)
  - Fetch Gemini file URIs from Firebase
  - Initialize Gemini with File Search tool
  - Implement streaming response
  - Save messages to Firebase chat_history
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4_

- [ ]* 20.1 Write property test for rate limit counter increment
  - **Property 37: Rate limit counter increment**
  - **Validates: Requirements 17.4**

- [ ]* 20.2 Write property test for user message storage
  - **Property 38: User message storage**
  - **Validates: Requirements 18.1**


- [ ]* 20.3 Write property test for assistant message storage
  - **Property 39: Assistant message storage**
  - **Validates: Requirements 18.2**

- [ ]* 20.4 Write property test for chat history chronological order
  - **Property 40: Chat history chronological order**
  - **Validates: Requirements 18.3**

- [x] 21. Implement API route for repository analysis

  - Create /api/analyze-repo endpoint
  - Validate request parameters
  - Check for cached analysis results
  - Trigger analysis pipeline
  - Return repository ID
  - Handle errors and return appropriate status codes
  - _Requirements: 1.5, 20.1, 20.2, 20.3, 20.4_

- [ ]* 21.1 Write unit tests for analyze-repo endpoint
  - Test request validation
  - Test cache hit scenario
  - Test error handling
  - _Requirements: 1.5, 20.2_

- [ ] 22. Implement API route for progress updates
  - Create /api/update-task endpoint
  - Validate request parameters
  - Update Firebase user_progress
  - Calculate new progress percentage
  - Check for milestone celebrations
  - Return updated progress data
  - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [ ]* 22.1 Write unit tests for update-task endpoint
  - Test task completion update
  - Test progress calculation
  - Test milestone detection
  - _Requirements: 14.1, 14.2, 14.5_

- [ ] 23. Implement API route for roadmap retrieval
  - Create /api/get-roadmap endpoint
  - Fetch roadmap from Firebase by repository ID
  - Handle missing roadmap case
  - Return roadmap JSON
  - _Requirements: 12.1_

- [ ]* 23.1 Write unit tests for get-roadmap endpoint
  - Test successful roadmap retrieval
  - Test missing roadmap error
  - _Requirements: 12.1_

- [ ] 24. Implement GitHub OAuth flow
  - Create /api/auth/github endpoint for OAuth callback
  - Implement OAuth token exchange
  - Store encrypted token in Firebase
  - Implement token refresh logic
  - Add OAuth button to dashboard
  - _Requirements: 2.2_

- [ ]* 24.1 Write unit tests for GitHub OAuth
  - Test token exchange
  - Test token storage
  - _Requirements: 2.2_

- [ ] 25. Implement comprehensive error handling
  - Add error boundaries to React components
  - Implement global error handler for API routes
  - Add retry logic for GitHub API calls
  - Add retry logic for Gemini API calls
  - Display user-friendly error messages
  - Log errors to console with details
  - _Requirements: 19.1, 19.2, 19.4, 19.5_

- [ ]* 25.1 Write property test for Gemini API retry with exponential backoff
  - **Property 41: Gemini API retry with exponential backoff**
  - **Validates: Requirements 19.2**

- [ ]* 25.2 Write property test for error logging and user feedback
  - **Property 42: Error logging and user feedback**
  - **Validates: Requirements 19.4**

- [ ]* 25.3 Write property test for retry option on errors
  - **Property 43: Retry option on errors**
  - **Validates: Requirements 19.5**

- [ ] 26. Implement Gemini file re-upload on expiration
  - Create function to check file expiration (48 hours)
  - Implement automatic re-upload when user accesses expired repository
  - Update Firebase with new URIs and expiration timestamp
  - _Requirements: 20.5_

- [ ]* 26.1 Write property test for Gemini file re-upload on expiration
  - **Property 47: Gemini file re-upload on expiration**
  - **Validates: Requirements 20.5**

- [ ] 27. Add Firebase Security Rules
  - Create security rules for repositories collection
  - Create security rules for roadmaps collection
  - Create security rules for user_progress collection
  - Create security rules for chat_history collection
  - Ensure users can only access their own data
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ]* 27.1 Write unit tests for Firebase Security Rules
  - Test authenticated user access
  - Test unauthorized access prevention
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 28. Implement rate limiting for analysis
  - Create rate limit tracking in Firebase
  - Limit users to 5 analyses per day
  - Display rate limit error message
  - Show time until reset
  - _Requirements: 17.1, 17.2_

- [ ]* 28.1 Write unit tests for analysis rate limiting
  - Test rate limit enforcement
  - Test error message display
  - _Requirements: 17.1, 17.2_

- [ ] 29. Add loading states and animations
  - Add skeleton loaders for roadmap loading
  - Add loading spinner for chat responses
  - Add smooth transitions for task completion
  - Add celebration animations for milestones
  - Optimize animation performance
  - _Requirements: 15.2, 15.3_

- [ ]* 29.1 Write unit tests for loading states
  - Test skeleton loader rendering
  - Test loading spinner display
  - _Requirements: 15.2_

- [ ] 30. Implement responsive design
  - Make dashboard mobile-friendly
  - Make loading page mobile-friendly
  - Make tasks page mobile-friendly
  - Optimize chat interface for mobile
  - Test on various screen sizes
  - _Requirements: General UX_

- [ ] 31. Add analytics and monitoring
  - Integrate Firebase Analytics
  - Track analysis success rate
  - Track average analysis duration
  - Track chat response time
  - Track error rates by type
  - Set up error alerts
  - _Requirements: Monitoring_

- [ ] 32. Optimize performance
  - Implement code splitting for pages
  - Lazy load chat component
  - Optimize image assets
  - Minimize bundle size
  - Add service worker for offline support
  - _Requirements: Performance_

- [ ] 33. Write end-to-end tests
  - Test complete analysis flow (dashboard → loading → tasks)
  - Test task completion and progress tracking
  - Test chat interaction
  - Test error scenarios
  - Test OAuth flow
  - _Requirements: All_

- [ ] 34. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Run all end-to-end tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.
