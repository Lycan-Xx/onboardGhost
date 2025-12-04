# Roadmap Generation Improvements

## Recent Updates

### 1. OS-Specific Instructions ✅
**What**: Instructions now include Mac, Windows, and Linux variants where applicable

**Example**:
```
"Mac: Download the .pkg installer and run it"
"Windows: Download the .msi installer and run it"  
"Linux: Use your package manager (apt, yum, dnf)"
```

**Benefits**:
- Users on any OS can follow along
- Reduces confusion about platform-specific steps
- Includes OS-specific warnings and tips

### 2. Fixed Code Snippets Rendering Error ✅
**Problem**: React error when rendering code_snippets objects

**Solution**: Updated tasks page to handle both formats:
- Simple strings: `"npm install"`
- Objects with metadata: `{file: ".env", language: "bash", code: "DATABASE_URL=..."}`

**Benefits**:
- No more React errors
- Can show file names and syntax highlighting
- Better organization of code examples

### 3. Conditional Sections ✅
**What**: Only show sections relevant to the project

**Logic**:
- **Always Include**: Understanding the Project, Environment Setup, Getting the Code, Running the Application
- **Conditional**: 
  - Database Setup (only if database detected)
  - Configuration (only if env vars exist)

**Benefits**:
- Cleaner roadmaps for simple projects
- No irrelevant sections
- Faster completion time

### 4. Educational Focus ✅
**What**: Refocused entire system on local setup and learning

**Changes**:
- Primary goal: Get project running locally
- Emphasis on teaching WHY, not just HOW
- Removed deployment/contribution sections
- Added verification steps
- Included troubleshooting tips

## Roadmap Structure

### Section Order (with conditions):

1. **Understanding the Project** (Always)
   - What the project does
   - Tech stack overview
   - Architecture basics

2. **Environment Setup** (Always)
   - Install required tools (Node.js, Python, etc.)
   - OS-specific installation instructions
   - Verification steps

3. **Getting the Code** (Always)
   - Clone repository
   - Install dependencies
   - Understand dependency files

4. **Database Setup** (If database detected)
   - Install database
   - Create database
   - Run migrations
   - Seed data

5. **Configuration** (If env vars exist)
   - Create .env file
   - Explain each variable
   - Get API keys
   - Configure connections

6. **Running the Application** (Always)
   - Start dev server
   - Access in browser
   - Verify features
   - Dev workflow

## Task Structure

Each task includes:
- **Title**: Clear and actionable
- **Description**: 2-3 sentences explaining what and why
- **Instructions**: 4-8 detailed steps with OS-specific guidance
- **Commands**: CLI commands to run (with OS variants)
- **Code Snippets**: Code to write in files (with file names)
- **Tips**: 2-4 helpful learning hints
- **Warnings**: 1-3 common mistakes (OS-specific)
- **Difficulty**: easy/medium/hard
- **Estimated Time**: e.g., "10 minutes"

## Example Task with OS-Specific Instructions

```json
{
  "id": "task-1",
  "title": "Install Node.js v18+ and Verify",
  "description": "Node.js is the JavaScript runtime...",
  "instructions": [
    "Visit nodejs.org and download the LTS version",
    "Mac: Download .pkg installer. Windows: Download .msi installer. Linux: Use package manager",
    "Follow installation wizard (accept defaults)",
    "Open NEW terminal window",
    "Verify installation with version command"
  ],
  "commands": [
    "node --version",
    "npm --version",
    "# Linux: sudo apt install nodejs npm"
  ],
  "tips": [
    "Use nvm on all platforms for version management",
    "LTS is more stable than Current",
    "Windows: May need to run as Administrator"
  ],
  "warnings": [
    "Mac/Linux: Don't use sudo for npm packages",
    "Windows: Restart after installation",
    "M1/M2 Mac: Use ARM64 version"
  ]
}
```

## Testing the Improvements

1. **Analyze a simple project** (no database, no env vars)
   - Should skip Database Setup and Configuration sections
   - Should only show 4 sections

2. **Analyze a complex project** (with database and env vars)
   - Should show all 6 sections
   - Should include OS-specific instructions
   - Should have detailed code snippets

3. **Check code snippets rendering**
   - Should handle both string and object formats
   - Should show file names when provided
   - No React errors

## Next Steps

To see these improvements:
1. Analyze a new repository
2. Check that sections match project needs
3. Verify OS-specific instructions are included
4. Confirm code snippets render correctly
