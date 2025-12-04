# OnboardGhost UI Data Specification

**Version:** 2.0  
**Last Updated:** December 4, 2024  
**Purpose:** Complete data type reference for UI designers and developers

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tasks Page Data Types](#tasks-page-data-types)
3. [Ghost Mentor Chat Data Types](#ghost-mentor-chat-data-types)
4. [Ghost Visualization Data Types](#ghost-visualization-data-types)
5. [API Endpoints](#api-endpoints)
6. [UI Component Examples](#ui-component-examples)

---

## Overview

This document describes all data structures used in the OnboardGhost UI, specifically for the Tasks Page, Ghost Mentor Chat, and Ghost Visualization components. Use this as a reference when designing or implementing new UI interfaces.

---

## Tasks Page Data Types

### 1. Main Roadmap Structure

```typescript
interface Roadmap {
  repository_name: string;           // e.g., "Laravel-Open-Source-Projects"
  total_tasks: number;               // e.g., 15
  estimated_completion_time: string; // e.g., "2-4 hours"
  sections: Section[];               // Array of sections
}
```

**Example:**
```json
{
  "repository_name": "my-awesome-app",
  "total_tasks": 18,
  "estimated_completion_time": "3-5 hours",
  "sections": [...]
}
```

---

### 2. Section Structure

```typescript
interface Section {
  id: string;          // e.g., "section-1"
  title: string;       // e.g., "Understanding the Project"
  description: string; // e.g., "Learn what this project does before setup"
  tasks: Task[];       // Array of tasks
}
```

**Example:**
```json
{
  "id": "section-1",
  "title": "Environment Setup",
  "description": "Install all required tools and dependencies",
  "tasks": [...]
}
```

---

### 3. Task Structure (Enhanced)

```typescript
interface TaskDescription {
  summary: string;       // Brief overview (1-2 sentences)
  why_needed: string;    // Why this task matters for THIS project
  learning_goal: string; // What the developer will learn
}

interface Task {
  id: string;                    // e.g., "task-1"
  title: string;                 // e.g., "Install Node.js v18+"
  description: string | TaskDescription; // Can be string (old) or object (new)
  instructions: string | string[];       // Step-by-step instructions
  commands?: string[];                   // Terminal commands to run
  code_snippets?: CodeSnippet[];         // Code blocks
  tips?: string[];                       // Helpful tips
  warnings?: string[];                   // Important warnings
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;                // e.g., "10-15 minutes"
  dependencies?: string[];               // Task IDs this depends on
}
```

**Example (New Enhanced Format):**
```json
{
  "id": "task-install-php",
  "title": "Install PHP 8.0+ and Composer",
  "description": {
    "summary": "Set up PHP runtime and Composer package manager for Laravel",
    "why_needed": "This Laravel project requires PHP 8.0+ to run and Composer to manage dependencies",
    "learning_goal": "Understand PHP development environment and dependency management"
  },
  "instructions": [
    "Check if PHP is already installed",
    "Download PHP 8.0 or higher from php.net",
    "Install Composer globally",
    "Verify installations"
  ],
  "commands": [
    "php --version",
    "composer --version"
  ],
  "code_snippets": [
    {
      "file": ".env",
      "language": "bash",
      "code": "APP_ENV=local\nAPP_DEBUG=true"
    }
  ],
  "tips": [
    "Use XAMPP on Windows for easy PHP setup",
    "On Mac, use Homebrew: brew install php"
  ],
  "warnings": [
    "Make sure to install PHP 8.0 or higher, not PHP 7.x"
  ],
  "difficulty": "easy",
  "estimated_time": "15-20 minutes"
}
```

**Example (Old String Format - Still Supported):**
```json
{
  "id": "task-1",
  "title": "Clone Repository",
  "description": "Get the project code on your local machine",
  "instructions": "Run git clone command to download the repository",
  "commands": ["git clone https://github.com/user/repo.git"],
  "difficulty": "easy",
  "estimated_time": "5 minutes"
}
```

---

### 4. Code Snippet Structure

```typescript
type CodeSnippet = string | {
  file?: string;     // File path, e.g., ".env" or "config/database.php"
  language?: string; // e.g., "bash", "javascript", "php", "python"
  code: string;      // The actual code content
}
```

**Examples:**
```json
// Simple string format
"npm install"

// Object format with metadata
{
  "file": ".env",
  "language": "bash",
  "code": "DATABASE_URL=postgresql://localhost:5432/mydb\nGEMINI_API_KEY=your_key_here"
}
```

---

### 5. Progress Structure

```typescript
interface Progress {
  completed_tasks: string[];          // Array of completed task IDs
  overall_progress_percentage: number; // 0-100
  ghost_solidness: number;            // 0-100 (same as progress)
}
```

**Example:**
```json
{
  "completed_tasks": ["task-1", "task-2", "task-5"],
  "overall_progress_percentage: 45,
  "ghost_solidness": 45
}
```

---

## Ghost Mentor Chat Data Types

### 1. Chat Message Structure

```typescript
interface ChatMessage {
  id: string;                  // Unique message ID
  role: 'user' | 'assistant';  // Who sent the message
  content: string;             // Message text
  timestamp: Date;             // When message was sent
  file_references?: string[];  // Optional: Referenced files
}
```

**Example:**
```json
{
  "id": "1701234567890",
  "role": "assistant",
  "content": "To set up the database, first install PostgreSQL...",
  "timestamp": "2024-12-04T10:30:00Z",
  "file_references": [
    "config/database.php",
    ".env.example"
  ]
}
```

---

### 2. Chat Component Props

```typescript
interface GhostMentorChatProps {
  repoId: string;  // Repository ID
  userId: string;  // User ID (currently "demo-user")
}
```

---

### 3. Chat API Request

```typescript
interface ChatRequest {
  message: string;  // User's question
  repoId: string;   // Repository context
  userId: string;   // User identifier
}
```

---

### 4. Chat API Response

```typescript
interface ChatResponse {
  response: string;           // AI's answer
  file_references?: string[]; // Files mentioned in response
}
```

---

## Ghost Visualization Data Types

### Ghost Visualization Props

```typescript
interface GhostVisualizationProps {
  progress: number;           // 0-100 (percentage complete)
  showCelebration?: boolean;  // Trigger celebration animation
}
```

**Usage:**
```tsx
<GhostVisualization 
  progress={45} 
  showCelebration={true} 
/>
```

**Visual States:**
- **0-25%**: Very transparent ghost (barely visible)
- **26-50%**: Semi-transparent ghost
- **51-75%**: More solid ghost
- **76-100%**: Fully solid ghost

**Celebration Triggers:**
- Every 25% milestone (25%, 50%, 75%, 100%)
- Shows sparkles and bounce animation
- Displays "Milestone Reached!" message

---

## API Endpoints

### 1. Get Roadmap

**Endpoint:** `GET /api/get-roadmap`

**Query Parameters:**
- `repoId`: string (required)
- `userId`: string (required)

**Response:**
```typescript
{
  roadmap: Roadmap;
  progress: Progress;
}
```

---

### 2. Update Task

**Endpoint:** `POST /api/update-task`

**Request Body:**
```typescript
{
  userId: string;
  repoId: string;
  taskId: string;
  completed: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  newProgress: number;              // Updated percentage
  celebrationTriggered: boolean;    // True if milestone reached
}
```

---

### 3. Chat

**Endpoint:** `POST /api/chat`

**Request Body:**
```typescript
{
  message: string;
  repoId: string;
  userId: string;
}
```

**Response:**
```typescript
{
  response: string;
  file_references?: string[];
}
```

---

### 4. Chat History

**Endpoint:** `GET /api/chat-history`

**Query Parameters:**
- `repoId`: string
- `userId`: string

**Response:**
```typescript
{
  messages: ChatMessage[];
}
```

---

## UI Component Examples

### Example 1: Rendering Task Description (New Format)

```tsx
// Check if description is string or object
{typeof task.description === 'string' ? (
  <p className="text-gray-600">{task.description}</p>
) : (
  <div className="space-y-3">
    {/* Main summary */}
    <p className="text-gray-700 text-lg">
      {task.description.summary}
    </p>
    
    {/* Why this matters */}
    {task.description.why_needed && (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
        <p className="text-sm font-semibold text-blue-900 mb-1">
          Why this matters:
        </p>
        <p className="text-sm text-blue-800">
          {task.description.why_needed}
        </p>
      </div>
    )}
    
    {/* Learning goal */}
    {task.description.learning_goal && (
      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
        <p className="text-sm font-semibold text-green-900 mb-1">
          What you'll learn:
        </p>
        <p className="text-sm text-green-800">
          {task.description.learning_goal}
        </p>
      </div>
    )}
  </div>
)}
```

---

### Example 2: Rendering Code Snippets

```tsx
{task.code_snippets?.map((snippet, index) => {
  // Handle string format
  if (typeof snippet === 'string') {
    return (
      <pre key={index} className="bg-gray-900 text-white p-4 rounded">
        <code>{snippet}</code>
      </pre>
    );
  }
  
  // Handle object format
  return (
    <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
      {/* File name header */}
      {snippet.file && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400">
          📄 {snippet.file}
        </div>
      )}
      
      {/* Code content */}
      <pre className="p-4 text-white overflow-x-auto">
        <code className={`language-${snippet.language}`}>
          {snippet.code}
        </code>
      </pre>
    </div>
  );
})}
```

---

### Example 3: Task Checklist Item

```tsx
<button
  onClick={() => setSelectedTaskId(task.id)}
  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
    isSelected ? 'bg-purple-50 border-2 border-purple-600' : 'hover:bg-gray-50'
  }`}
>
  {/* Checkbox */}
  <input
    type="checkbox"
    checked={isCompleted}
    onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
    className="h-5 w-5 text-purple-600 rounded"
  />
  
  {/* Task info */}
  <div className="flex-1">
    <p className={`text-sm font-medium ${
      isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
    }`}>
      {task.title}
    </p>
    
    {/* Badges */}
    <div className="flex items-center gap-2 mt-1">
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
        task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {task.difficulty}
      </span>
      <span className="text-xs text-gray-500">
        {task.estimated_time}
      </span>
    </div>
  </div>
</button>
```

---

### Example 4: Chat Message Bubble

```tsx
<div className={`flex ${
  message.role === 'user' ? 'justify-end' : 'justify-start'
}`}>
  <div className={`max-w-xs px-3 py-2 rounded-lg ${
    message.role === 'user' 
      ? 'bg-purple-600 text-white' 
      : 'bg-gray-100 text-gray-800'
  }`}>
    {/* Message content */}
    <p className="whitespace-pre-wrap">{message.content}</p>
    
    {/* File references */}
    {message.file_references?.length > 0 && (
      <div className="mt-2 pt-2 border-t">
        <p className="text-xs font-semibold mb-1">📁 Referenced files:</p>
        {message.file_references.map((file, i) => (
          <div key={i} className="text-xs text-blue-600">
            {file}
          </div>
        ))}
      </div>
    )}
    
    {/* Timestamp */}
    <p className="text-xs opacity-70 mt-1">
      {new Date(message.timestamp).toLocaleTimeString()}
    </p>
  </div>
</div>
```

---

## Design Guidelines

### Color Scheme

- **Primary:** Purple (#7C3AED - purple-600)
- **Success:** Green (#10B981 - green-500)
- **Warning:** Yellow (#F59E0B - yellow-500)
- **Error:** Red (#EF4444 - red-500)
- **Info:** Blue (#3B82F6 - blue-500)

### Difficulty Colors

- **Easy:** Green background (#DCFCE7), Green text (#166534)
- **Medium:** Yellow background (#FEF3C7), Yellow text (#92400E)
- **Hard:** Red background (#FEE2E2), Red text (#991B1B)

### Typography

- **Headings:** Font weight 600-700 (semibold-bold)
- **Body:** Font weight 400 (normal)
- **Code:** Monospace font (font-mono)

### Spacing

- **Section gaps:** 24px (gap-6)
- **Card padding:** 24px (p-6)
- **Element spacing:** 12px (space-y-3)

---

## State Management

### Task Completion Flow

1. User clicks checkbox on task
2. `handleTaskToggle(taskId, completed)` is called
3. API request to `/api/update-task`
4. Update local `progress` state
5. If milestone reached, show celebration
6. Auto-select next incomplete task

### Chat Flow

1. User types message and clicks Send
2. Add user message to `messages` array
3. Set `isLoading = true`
4. API request to `/api/chat`
5. Add assistant response to `messages` array
6. Set `isLoading = false`
7. Auto-scroll to bottom

---

## Responsive Design Notes

### Desktop (lg: 1024px+)
- Two-pane layout: 40% checklist, 60% details
- Chat window: Fixed bottom-right, 400px wide
- Ghost visualization: Top-right of header

### Tablet (md: 768px - 1023px)
- Single column layout
- Sticky checklist at top
- Full-width task details below

### Mobile (< 768px)
- Stack all elements vertically
- Collapsible checklist
- Full-screen chat when open
- Smaller ghost visualization

---

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported (Tab, Enter, Escape)
- Color contrast meets WCAG AA standards
- Screen reader friendly text alternatives
- Focus indicators visible on all interactive elements

---

## Performance Considerations

- Lazy load task details (only render selected task)
- Virtualize long task lists (if > 50 tasks)
- Debounce chat input
- Cache roadmap data locally
- Optimize ghost SVG rendering

---

## Future Enhancements

### Planned Features
- Task dependencies visualization
- Progress timeline
- Export roadmap as PDF
- Dark mode support
- Multi-language support
- Voice input for chat
- Code syntax highlighting
- File preview in chat

---

## Questions for Designers

When designing the new UI, consider:

1. **How should we visualize task dependencies?**
   - Tree view? Flow diagram? Simple list?

2. **Should the ghost be more interactive?**
   - Animations? Expressions? Sound effects?

3. **How to handle very long task lists?**
   - Pagination? Infinite scroll? Collapsible sections?

4. **Mobile chat experience?**
   - Full screen? Bottom sheet? Floating?

5. **Code snippet presentation?**
   - Tabs for multiple snippets? Syntax highlighting? Copy button?

---

## Contact

For questions about this specification, contact the development team or refer to:
- `app/tasks/page.tsx` - Main tasks page implementation
- `components/GhostMentorChat.tsx` - Chat component
- `components/GhostVisualization.tsx` - Ghost component
- `lib/types/roadmap.ts` - Type definitions

---

**End of Specification**
