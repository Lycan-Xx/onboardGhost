# Enhanced Types & Utilities Guide

## Overview

This guide explains the new enhanced type system and formatting utilities for rich, structured roadmap output.

---

## 📁 New Files Created

1. **`lib/types/roadmap.ts`** - Enhanced roadmap type definitions
2. **`lib/utils/markdown.ts`** - Markdown formatting utilities

---

## 🎯 Type System

### Core Roadmap Structure

```typescript
import { Roadmap, RoadmapSection, RoadmapTask } from '@/lib/types/roadmap';

const roadmap: Roadmap = {
  repository_name: "my-project",
  total_tasks: 15,
  estimated_completion_time: "2-3 hours",
  sections: [...]
};
```

### Enhanced Task Structure

Each task now has rich, structured data:

```typescript
const task: RoadmapTask = {
  id: "task-1",
  title: "Install Node.js v18+",
  
  // Rich description
  description: {
    summary: "Install Node.js runtime",
    why_needed: "Required to run this Next.js application",
    learning_goal: "Understand Node.js versions and package managers"
  },
  
  // Step-by-step instructions
  steps: [
    {
      order: 1,
      action: "Download",
      details: "Visit **nodejs.org** and download the `LTS` version",
      os_specific: {
        mac: "Download the .pkg installer",
        windows: "Download the .msi installer",
        linux: "Use your package manager"
      }
    }
  ],
  
  // Commands with context
  commands: [
    {
      command: "node --version",
      description: "Verify Node.js installation",
      expected_output: "v18.x.x or higher",
      os: "all"
    }
  ],
  
  // Code blocks with explanations
  code_blocks: [
    {
      type: "file_content",
      file_path: ".env",
      language: "bash",
      content: "DATABASE_URL=postgresql://...",
      explanation: "Database connection string",
      highlights: [
        {
          line: 1,
          text: "Replace with your actual database URL",
          type: "warning"
        }
      ]
    }
  ],
  
  // External references
  references: [
    {
      text: "Node.js Documentation",
      url: "https://nodejs.org/docs",
      type: "documentation",
      relevance: "Official guide for Node.js installation"
    }
  ],
  
  // Tips with emphasis
  tips: [
    {
      text: "Use **nvm** to manage multiple Node.js versions",
      type: "pro_tip",
      emphasis: ["nvm"]
    }
  ],
  
  // Warnings with severity
  warnings: [
    {
      text: "Don't use **sudo** for npm packages on Mac/Linux",
      severity: "important",
      os_specific: true,
      emphasis: ["sudo"]
    }
  ],
  
  // Verification steps
  verification: {
    how_to_verify: "Run node --version in terminal",
    expected_result: "Should show v18.x.x or higher",
    troubleshooting: [
      {
        problem: "Command not found",
        solution: "Restart your terminal or computer",
        command: null
      }
    ]
  },
  
  difficulty: "beginner",
  estimated_time: "10 minutes",
  depends_on: []
};
```

---

## 🎨 Formatting Utilities

### Import

```typescript
import {
  formatMarkdown,
  extractBoldPhrases,
  highlightPhrases,
  formatCommand,
  stripMarkdown,
  truncateText
} from '@/lib/utils/markdown';
```

### Usage Examples

#### 1. Format Markdown to HTML

```typescript
const text = "Install **Node.js** and run `npm install`";
const html = formatMarkdown(text);
// Output: "Install <strong>Node.js</strong> and run <code class="inline-code">npm install</code>"
```

#### 2. Extract Bold Phrases

```typescript
const text = "Use **nvm** to manage **Node.js** versions";
const phrases = extractBoldPhrases(text);
// Output: ["nvm", "Node.js"]
```

#### 3. Highlight Phrases

```typescript
const text = "Install Node.js from nodejs.org";
const highlighted = highlightPhrases(text, ["Node.js"]);
// Output: "Install <mark>Node.js</mark> from nodejs.org"
```

#### 4. Format Commands with OS Badge

```typescript
const formatted = formatCommand("npm install", "all");
// Output: HTML with OS badge and styled command
```

#### 5. Strip Markdown

```typescript
const text = "Install **Node.js** and run `npm install`";
const plain = stripMarkdown(text);
// Output: "Install Node.js and run npm install"
```

---

## 🔄 Migration from Old Types

### Old Structure (Simple)

```typescript
// Old way
interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  instructions: string;
  code_snippet?: string;
  tips: string[];
  warnings: string[];
}
```

### New Structure (Rich)

```typescript
// New way
interface RoadmapTask {
  id: string;
  title: string;
  description: TaskDescription;  // ← Now an object
  steps: TaskStep[];             // ← Structured steps
  commands: CommandBlock[];      // ← Commands with context
  code_blocks: CodeBlock[];      // ← Rich code blocks
  references: Reference[];       // ← External links
  tips: Tip[];                   // ← Tips with types
  warnings: Warning[];           // ← Warnings with severity
  verification: Verification;    // ← How to verify success
  // ... more fields
}
```

---

## 🚀 Using in Components

### Example: Rendering a Task

```typescript
import { RoadmapTask } from '@/lib/types/roadmap';
import { formatMarkdown } from '@/lib/utils/markdown';

function TaskCard({ task }: { task: RoadmapTask }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      
      {/* Description */}
      <div className="description">
        <p>{task.description.summary}</p>
        <p className="why">Why: {task.description.why_needed}</p>
        <p className="learn">Learn: {task.description.learning_goal}</p>
      </div>
      
      {/* Steps */}
      <ol className="steps">
        {task.steps.map(step => (
          <li key={step.order}>
            <strong>{step.action}:</strong>
            <div dangerouslySetInnerHTML={{ 
              __html: formatMarkdown(step.details) 
            }} />
            
            {/* OS-specific instructions */}
            {step.os_specific && (
              <div className="os-specific">
                {step.os_specific.mac && <p>🍎 Mac: {step.os_specific.mac}</p>}
                {step.os_specific.windows && <p>🪟 Windows: {step.os_specific.windows}</p>}
                {step.os_specific.linux && <p>🐧 Linux: {step.os_specific.linux}</p>}
              </div>
            )}
          </li>
        ))}
      </ol>
      
      {/* Commands */}
      {task.commands.length > 0 && (
        <div className="commands">
          <h4>Commands</h4>
          {task.commands.map((cmd, i) => (
            <div key={i} className="command-block">
              <code>{cmd.command}</code>
              <p>{cmd.description}</p>
              <p className="expected">Expected: {cmd.expected_output}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Code Blocks */}
      {task.code_blocks.length > 0 && (
        <div className="code-blocks">
          {task.code_blocks.map((block, i) => (
            <div key={i}>
              {block.file_path && <p className="file-path">{block.file_path}</p>}
              <pre><code className={`language-${block.language}`}>
                {block.content}
              </code></pre>
              <p>{block.explanation}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Tips */}
      {task.tips.length > 0 && (
        <div className="tips">
          {task.tips.map((tip, i) => (
            <div key={i} className={`tip ${tip.type}`}>
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(tip.text) 
              }} />
            </div>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {task.warnings.length > 0 && (
        <div className="warnings">
          {task.warnings.map((warning, i) => (
            <div key={i} className={`warning ${warning.severity}`}>
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(warning.text) 
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Next Steps

1. **Update `lib/gemini/client.ts`** to return the new `Roadmap` type
2. **Update UI components** in `app/tasks/page.tsx` to use rich data
3. **Add CSS styles** for new elements (command blocks, OS badges, etc.)
4. **Test with a repository** to see the enhanced output

---

## 📚 Benefits

- **Richer Content**: More context and explanations for each task
- **OS-Specific**: Instructions tailored to Mac, Windows, Linux
- **Better Learning**: Explains WHY, not just HOW
- **Verification**: Built-in success criteria and troubleshooting
- **Type Safety**: Full TypeScript support with detailed types
- **Reusable**: Formatting utilities work across the app
