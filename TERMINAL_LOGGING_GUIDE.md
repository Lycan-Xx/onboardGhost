# Terminal Logging Guide

## Overview

Your OnboardGhost app now has comprehensive real-time logging that shows exactly what's happening during repository analysis in your terminal.

## What You'll See

### 1. API Request Start
```
################################################################################
📥 NEW ANALYSIS REQUEST [abc123]
################################################################################

[API abc123] Repository URL: https://github.com/user/repo
[API abc123] User ID: demo-user
[API abc123] Has GitHub Token: false
```

### 2. Cache Check
```
[API abc123] Repository ID: user-repo
[API abc123] 🔍 Checking cache...
[API abc123] ℹ️  Cache MISS - First time analysis
[API abc123] 🚀 Starting fresh analysis...
```

### 3. Analysis Pipeline Start
```
================================================================================
🚀 STARTING REPOSITORY ANALYSIS
================================================================================
📦 Repository: https://github.com/user/repo
⏰ Started at: 2024-01-15T10:30:45.123Z
================================================================================

[Parser] Owner: user, Repo: repo
```

### 4. Step-by-Step Progress
```
[10:30:45] 🔄 Step 1/8: Repository Access - Fetching repository metadata...
[GitHub API] GET /repos/user/repo
[10:30:46] ✅ Step 1/8: Repository Access - Repository: repo-name
         Details: {
  "stars": 123,
  "language": "TypeScript"
}

[10:30:46] 🔄 Step 2/8: File Tree Filtering - Fetching file tree...
[GitHub API] GET /repos/user/repo/git/trees/main?recursive=1
[10:30:48] ✅ Step 2/8: File Tree Filtering - Filtered 5234 files → 187 relevant files (96% reduction)
         Details: {
  "totalFiles": 5234,
  "analyzedFiles": 187,
  "reductionPercentage": 96
}

[10:30:48] 🔄 Step 3/8: Static Analysis - Analyzing tech stack...
[GitHub API] GET /repos/user/repo/contents/package.json
[GitHub API] GET /repos/user/repo/contents/README.md
[Tech Stack] Analyzing 8 critical files...
[10:30:50] ✅ Step 3/8: Static Analysis - Detected: Next.js, 1 databases, 12 env vars

[10:30:50] 🔄 Step 4/8: Project Purpose - Analyzing project purpose...
[10:30:52] ✅ Step 4/8: Project Purpose - A modern web application for...

[10:30:52] ✅ Step 5/8: Security Scan - Skipped (optional feature)

[10:30:52] ✅ Step 6/8: File Upload - Skipped (will be implemented for chat)

[10:30:52] 🔄 Step 7/8: Roadmap Generation - Generating onboarding roadmap...
[Gemini] Generating roadmap for TypeScript project...
[Gemini] Received 15234 characters
[Gemini] Generated 5 sections, 23 tasks
[10:31:05] ✅ Step 7/8: Roadmap Generation - Generated 5 sections with 23 tasks

[10:31:05] ✅ Step 8/8: Complete - Analysis completed in 20s
```

### 5. Analysis Complete
```
================================================================================
🎉 ANALYSIS COMPLETE!
================================================================================
⏱️  Total Duration: 20s
📊 Files Scanned: 5234
📝 Files Analyzed: 187
📚 Sections Generated: 5
✅ Tasks Created: 23
================================================================================

[API abc123] 💾 Storing results in Firestore...

[API abc123] ✅ Analysis completed successfully!
################################################################################
```

## Log Symbols Explained

| Symbol | Meaning |
|--------|---------|
| 📥 | New API request received |
| 🔍 | Checking cache |
| ✅ | Cache hit (using cached data) |
| ℹ️ | Cache miss (first time) |
| ⚠️ | Cache expired or warning |
| 🚀 | Starting analysis |
| 🔄 | Step in progress |
| ✅ | Step completed |
| ❌ | Step failed |
| 💾 | Saving to database |
| 🎉 | Analysis complete |
| ⏱️ | Duration/timing |
| 📊 | Statistics |
| 📝 | File counts |
| 📚 | Sections |
| 📦 | Repository info |

## Monitoring Tips

### 1. Watch for Slow Steps
If a step takes too long:
- **Step 1-2**: GitHub API might be slow
- **Step 3**: Many files to analyze
- **Step 4**: Gemini API processing README
- **Step 7**: Gemini generating roadmap (can take 10-30s)

### 2. Check for Errors
Look for ❌ symbols or error messages:
```
[API abc123] ❌ Analysis failed: Error: ...
```

### 3. Monitor Cache Usage
```
✅ Cache HIT - Using cached analysis from 2024-01-15T10:00:00.000Z
```
Means you're saving time and API calls!

### 4. Track Performance
```
⏱️  Total Duration: 20s
```
- **Fast**: < 20s
- **Normal**: 20-40s
- **Slow**: > 40s (check network/API)

## Debugging

### Enable More Detailed Logs

The system already logs:
- ✅ Every API request
- ✅ Every analysis step
- ✅ File counts and statistics
- ✅ Gemini API calls
- ✅ Cache hits/misses
- ✅ Errors with stack traces

### Common Issues

#### 1. Stuck at "Generating roadmap..."
```
[Gemini] Generating roadmap for Go project...
```
**Wait**: This can take 10-30 seconds
**Check**: Look for `[Gemini] Received X characters` next

#### 2. GitHub API Errors
```
[GitHub API] GET /repos/user/repo
❌ Error: 404 Not Found
```
**Cause**: Repository doesn't exist or is private
**Fix**: Check URL or add GitHub OAuth token

#### 3. Timeout Errors
```
❌ Analysis failed: Error: Analysis timeout exceeded
```
**Cause**: Analysis took > 5 minutes
**Fix**: Repository might be too large

## Log Levels

### Normal Operation
- Shows all steps with ✅ or 🔄
- Shows timing and statistics
- Shows cache status

### Error Conditions
- Shows ❌ with error details
- Shows stack traces
- Shows which step failed

### Performance Metrics
- Duration for each step
- Total analysis time
- File counts
- API call counts

## Example Full Log

See a complete example log in your terminal when you run an analysis. It will look like the examples above, showing:

1. Request start with ID
2. Cache check
3. Analysis pipeline start
4. 8 steps with progress
5. Completion summary
6. Database storage
7. Final success message

## Tips

1. **Keep terminal visible** during analysis to see progress
2. **Look for timing** to identify slow steps
3. **Check cache status** to see if you're reusing data
4. **Monitor Gemini calls** to track API usage
5. **Watch for errors** to catch issues early

## Next Steps

- Monitor your first analysis
- Check timing for your repositories
- Identify any bottlenecks
- Report issues with log output
