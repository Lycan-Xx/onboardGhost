# **OnboardGhost - Devpost Submission**

---

## **Inspiration**

Every developer has felt it that sinking feeling when you join a new project, stare at thousands of lines of unfamiliar code, and have no idea where to start. I've watched senior developers spend hours answering the same basic setup questions over and over: "How do I run this?" "What does this file do?" "Why isn't my database connecting?" 

The inspiration for OnboardGhost came from a simple observation: **onboarding is a solved problem for companies with money and time, but a nightmare for everyone else.** Large companies have dedicated onboarding docs, mentors, and weeks of ramp-up time. Startups and open-source projects? You get a half-written README and a Slack channel full of developers too busy to help.

I wanted to build something that gives **every** developer whether joining a Fortune 500 company or contributing to their first open-source project the experience of having a senior developer personally walk them through setup. Not generic tutorials. Not Stack Overflow links. A guide that actually knows **your** codebase, **your** dependencies, **your** quirks.

And because this is Kiroween, I thought: what better guide than a friendly ghost who's already haunted your repository and knows every dark corner? 👻

---

## **What It Does**

OnboardGhost transforms repository onboarding from a confusing slog into a **guided, self-paced experience**. Here's the magic:

### **The Analysis (30-60 seconds)**
1. User pastes a GitHub repository URL (public repos work instantly; private repos need OAuth)
2. OnboardGhost analyzes the codebase:
   - **Tech Stack Detection:** Identifies language, framework, database, dependencies with version requirements
   - **Setup Intelligence:** Extracts installation steps from README, detects environment variables, finds migration scripts
   - **Problem Prediction:** Scans for common gotchas, version conflicts, and configuration pitfalls
   - **Security Check:** Flags hardcoded secrets and sensitive data in code

### **The Roadmap (AI-Generated, Project-Specific)**
Gemini AI synthesizes everything into a **personalized, step-by-step roadmap**:
- **Structured by Dependencies:** You can't run migrations before installing the database tasks are ordered logically
- **OS-Specific Instructions:** Mac users get `.pkg` installers, Windows users get `.msi`, Linux users get package manager commands
- **Rich Learning Context:** Every task explains **what** to do, **why** it matters, and **what you'll learn**
- **Code Snippets Ready:** Copy-paste commands and configuration files no hunting through docs
- **Tips & Warnings:** "Never use `sudo` for npm packages" or "M1 Mac users need ARM64 version"

### **The Ghost Mentor (AI Chatbot with RAG)**
The killer feature a chatbot that **actually knows your codebase**:
- **Semantic Code Search:** Files are embedded using Gemini File Search (not generic embeddings)
- **Context-Aware Answers:** Ask "How does authentication work?" and get **actual file paths and code snippets from your repo**
- **Real-Time Help:** Stuck on a task? Ghost Mentor explains the specific setup step you're on
- **No Hallucinations:** Answers are grounded in uploaded code if it doesn't know, it says so

### **The Progress System**
- **Visual Progress Bar:** A progress bar that fills up as you complete tasks, displaying the percentage completion (0% = empty, 100% = fully filled with sparkles)
- **Task Tracking:** Check off tasks, auto-advance to the next, celebrate milestones (25%, 50%, 75%, 100%)
- **Persistent State:** Your progress is saved come back anytime and pick up where you left off

---

## **How We Built It**

### **The Stack**
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Firebase Firestore (real-time database)
- **AI:** Google Gemini 2.0 Flash (roadmap generation, project analysis, chat)
- **Vector Search:** Gemini File Search (built-in RAG no Pinecone needed)
- **Auth:** GitHub OAuth (optional, for private repos)
- **Deployment:** Vercel (production), Firebase (database)

### **The Architecture (8-Step Analysis Pipeline)**

I built this as a **spec-driven system** using Kiro, which meant defining clear contracts before writing code:

**Step 1-2: Repository Acquisition & Filtering**
```typescript
// GitHub API → Fetch repo metadata and file tree
// Smart filtering: 5,000 files → 150-250 relevant files (95% reduction)
// Excludes: node_modules, binaries, lockfiles, images
// Prioritizes: README, package.json, source code, configs
```

**Step 3: Static Analysis (Multi-Language Support)**
```typescript
// Detects: JavaScript/TypeScript (Next.js, React, Express)
//          Python (Django, FastAPI, Flask)
//          Ruby (Rails), Go, Rust, PHP
// Extracts: Dependencies, database type, environment variables
// Parses: README for setup instructions, .env.example for required vars
```

**Step 4-5: AI Processing**
```typescript
// Gemini analyzes: Project purpose, tech stack, setup complexity
// Generates: Structured roadmap JSON with tasks, steps, commands, tips
// Uploads: Filtered code files to Gemini File Search for RAG
```

**Step 6-8: Storage & Delivery**
```typescript
// Firestore stores: Roadmap, progress, uploaded file references
// Real-time sync: Progress updates trigger progress bar visualization
// Chat integration: Gemini File Search enables semantic code Q&A
```

### **The Kiro Experience**

I used Kiro's **spec-driven development** extensively:

**Specs Created:**
- `repo-analysis-onboarding.spec` - Complete pipeline with 75 acceptance criteria
- Component specs for GitHub client, Gemini client, file filtering
- Type definitions for all data models (34 TypeScript interfaces)

**Agent Hooks Used:**
- `pre_commit_hook` - Auto-linting and type checking
- `on_spec_change_hook` - Regenerated components when specs changed
- `post_analysis_hook` - Automated testing after pipeline runs

**Steering Docs:**
- `react_components.steer` - Enforced functional components, TypeScript, Tailwind-only
- `api_routes.steer` - Consistent error handling, input validation with Zod
- `ai_prompts.steer` - Optimized Gemini prompts for structured output

**Development Efficiency:**
- **Without Kiro:** Estimated 14 days (manual coding, inconsistencies, debugging)
- **With Kiro:** Actual 9 days (spec-driven generation, consistent patterns)
- **35% time savings** directly from Kiro's features

---

## **Challenges We Ran Into**

### **Challenge 1: The Roadmap Data Loss Mystery (3 Days Lost)**

**The Problem:** Tasks were showing up with titles but **completely empty instructions** no steps, no commands, no tips. Users would see "Install Node.js" but no instructions on how to actually do it.

**The Wild Goose Chase:**
1. **Suspected Gemini:** Thought the AI was returning bad JSON
   - Added JSON repair logic, changed models, adjusted temperature
   - Added retry mechanisms, error handling, validation
   - **Result:** Gemini was working perfectly! 🤦

2. **Suspected the Prompt:** Thought it was too complex
   - Simplified drastically, added explicit examples
   - Made it scream in all caps: "DO NOT LEAVE ARRAYS EMPTY!"
   - **Result:** Gemini STILL returning good data! 🤦🤦

3. **Suspected Validation Logic:** Found `validateAndNormalizeRoadmap()` adding empty defaults
   - Removed it completely, replaced with basic checks
   - **Result:** Data STILL vanishing! 🤦🤦🤦

4. **Finally Added Logging Everywhere:**
   - Gemini client: "I have 3 steps, 2 commands, 3 tips!" ✅
   - API route: "I see... 0 steps, 0 commands, 0 tips?" ❌
   - **Aha! Data lost BETWEEN Gemini and API**

**The Real Culprit:** Found it buried in `lib/pipeline/analyzer.ts` (line 227-241). The analyzer was doing a "transformation" that **only kept specific fields** (id, title, description) and **threw away everything else** (steps, commands, tips, code_blocks).

It was like having a delivery person who opens your package, throws away the contents, and hands you an empty box with just the shipping label. Thanks, analyzer! 📦❌

**The Fix:**
```typescript
// Before (BAD):
tasks: section.tasks.map(task => ({
  id: task.id,
  title: task.title,
  description: task.description
  // Everything else: GONE
}))

// After (GOOD):
tasks: section.tasks.map(task => ({
  ...task, // Keep EVERYTHING
  // Add compatibility fields
}))
```

**Lesson Learned:** When data disappears, **log at EVERY step**. Don't assume the bug is where you first look. Sometimes it's in the "glue code" no one thinks to check.

---

### **Challenge 2: Gemini's "Creative Freedom" with JSON Structure**

**The Problem:** I needed **consistent, structured JSON** for the UI to render. Gemini kept being "helpful" by reorganizing fields, renaming properties, or adding creative variations.

**Example of Chaos:**
```json
// I asked for:
{ "steps": [{ "order": 1, "action": "...", "details": "..." }] }

// Gemini gave me:
{ "instructions": [{ "step_number": 1, "what_to_do": "..." }] }

// Or sometimes:
{ "steps": "1. Do this\n2. Do that" } // STRING instead of array!
```

**The Solution:**
1. **Explicit Schema in Prompt:** Showed Gemini the EXACT TypeScript interface
2. **Examples with Real Data:** Provided 3 complete example tasks in the prompt
3. **JSON Mode:** Used `response_mime_type: "application/json"` in Gemini config
4. **Validation + Normalization:** Built `roadmap-transformer.ts` to handle variations:

```typescript
// Normalize: Handle both old and new formats
steps: task.steps || (task.instructions?.map(convertToStep)) || []
```

**Lesson Learned:** AI is probabilistic, not deterministic. **Always validate and normalize external data**, even from your own AI.

---

### **Challenge 3: Gemini File Search "Working Too Well"**

**The Problem:** Gemini File Search was **too literal**. User asks "How do I run this?" and Gemini would quote `npm run dev` from package.json without context.

**The Solution:** Crafted a **specific system prompt** for Ghost Mentor:
```typescript
const systemPrompt = `
You are Ghost Mentor, NOT a code search tool.

When answering:
1. Explain WHY, not just WHAT
2. Include file paths: "In src/config/database.ts, line 42..."
3. Provide context: "This project uses PostgreSQL, so you need..."
4. Keep answers under 200 words
5. Offer ONE follow-up suggestion

Bad answer: "Run npm run dev"
Good answer: "This Next.js project starts with 'npm run dev', which launches 
the development server on port 3000. The command is defined in package.json 
and uses Next.js's built-in dev server with hot reload. After running it, 
visit http://localhost:3000. Want to know how to configure the port?"
`;
```

**Lesson Learned:** RAG systems need **careful prompt engineering** to balance retrieval accuracy with conversational quality.

---

### **Challenge 4: The OAuth "Do We Really Need This?" Dilemma**

**The Problem:** GitHub OAuth is complex (redirect URLs, token storage, refresh logic, security). But **80% of users** just want to analyze public repos.

**The Solution: Progressive Enhancement**
- **Default:** Public repos work instantly (no auth, no friction)
- **Optional:** "Connect GitHub" button unlocks private repos
- **Smart Fallback:** If repo is private, show clear error: "This repo is private. [Connect GitHub] to access it."

**Implementation:**
```typescript
async function verifyRepositoryAccess(owner, repo, token?) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`/repos/${owner}/${repo}`, { headers });
  
  if (response.status === 404) {
    throw new Error('Repository not found or private. Connect GitHub to access.');
  }
  return response.json();
}
```

**Lesson Learned:** **Don't force users through auth gates for public data.** Make the complex stuff optional.

---

### **Challenge 5: "Dark Mode + Pink = Aesthetic Disaster?"**

**The Problem:** I wanted a **dark, minimal theme** with **pink accents** (Kiroween vibes). Early attempts looked like a unicorn threw up on a terminal.

**The Solution:**
```css
/* Background layers */
bg-[#0a0a0f]      /* Deep black for main */
bg-[#12121a]      /* Slightly lighter for cards */
bg-gray-900/50     /* Subtle overlays */

/* Pink accents (sparingly) */
text-pink-400      /* Links, CTAs, highlights only */
border-pink-500/30 /* Subtle borders */
shadow-pink-500/50 /* Glows on interactive elements */

/* Never pink on pink */
/* Always high contrast */
/* Let black do the work */
```

**Key Principle:** Pink is the **accent**, not the base. Like hot sauce a little goes a long way.

**Lesson Learned:** Constraint breeds creativity. Limiting pink to **5% of the design** made the **95% black** feel intentional, not lazy.

---

## **Accomplishments That We're Proud Of**

### **1. Solving a Real Problem (Not a Toy Project)**
This isn't a "build a todo app" hackathon project. **Onboarding costs companies thousands of dollars per hire.** I built something that:
- Reduces onboarding time based on the user's pace
- Eliminates repetitive questions senior devs answer daily
- Works for **any** codebase in 6+ languages

### **2. AI That Actually Understands Your Code**
Most "AI code assistants" are generic. Ghost Mentor is **trained on YOUR specific repository**:
- Ask "How does auth work?" → Get YOUR auth flow, not generic OAuth tutorials
- Ask "Where's the database config?" → Get YOUR config file, not a blog post
- Ask "How do I add a new API endpoint?" → Get YOUR project structure and conventions

### **3. The Data Transformation Architecture**
I'm genuinely proud of the **roadmap transformer system**:
```
Gemini (simple JSON) → Transformer (enrichment) → UI (rich rendering)
```
This separation means:
- **Gemini** focuses on content quality, not format perfection
- **Transformer** handles normalization, defaults, computed fields
- **UI** just renders no business logic

This is **production-grade architecture**, not hackathon duct tape.

### **4. Backward Compatibility Built In**
The UI handles **both old and new data formats** gracefully:
```typescript
// Works with old format:
{ "tips": ["Use nvm for versions"] }

// Works with new format:
{ "tips": [{ "text": "Use nvm", "type": "pro_tip", "emphasis": ["nvm"] }] }
```
This means **zero breaking changes** as the system evolves.

### **5. The Progress Bar Visualization**
The progress bar isn't just functional it's motivational UX:
- **0-25%:** Barely filled (you're just starting)
- **50%:** Half-filled (you're halfway there)
- **75%:** Mostly filled (almost done!)
- **100%:** Fully filled with sparkles (celebration!)

It turns abstract progress (73%) into **tangible visual feedback**.

### **6. Spec-Driven Development with Kiro**
I didn't just use Kiro I **leaned into it**:
- 75 acceptance criteria defined BEFORE coding
- 34 TypeScript interfaces from specs
- Agent hooks automated linting, testing, regeneration
- **35% faster development** than manual coding

This proved Kiro's value for **structured, complex projects**.

---

## **What We Learned**

### **Technical Lessons**

**1. AI Is Probabilistic, Not Deterministic**
- Don't expect perfect JSON every time
- Always validate and normalize external data
- Build transformation layers for resilience

**2. RAG Requires Prompt Engineering**
- File Search works, but needs guidance
- System prompts matter more than you think
- Balance retrieval accuracy with conversational quality

**3. Debug Like a Detective**
- When data disappears, log EVERY step
- Don't assume the bug is where you first look
- Sometimes it's the "boring" glue code

**4. Architecture > Features**
- Good separation of concerns (Gemini → Transformer → UI) pays off
- Backward compatibility from day one saves pain later
- Spend time on structure features come easy after

**5. Kiro Shines for Structured Projects**
- Specs force you to think before coding
- Agent hooks eliminate repetitive tasks
- Steering docs maintain consistency at scale
- Best for projects with clear requirements (not exploratory hacks)

---

### **UX Lessons**

**1. Progressive Disclosure Works**
- Start simple (public repos, no auth)
- Add complexity only when needed (OAuth for private repos)
- Don't force users through gates for public data

**2. Context Is Everything**
- Don't just say "Run npm install" explain WHY
- Show WHERE (file paths), WHAT (commands), WHY (purpose)
- Teach, don't just instruct

**3. Visual Feedback Matters**
- Abstract progress (73%) is meaningless
- Concrete progress (progress bar filling up) is motivating
- Celebrate milestones (25%, 50%, 75%, 100%)

**4. Dark Mode Is Hard**
- Pink on black requires restraint
- Use accent colors sparingly (5% of design)
- High contrast always wins

---

### **Process Lessons**

**1. Spec-Driven Development Is Powerful (But Slow)**
- **Pros:** Clear requirements, consistent code, automated testing
- **Cons:** Upfront time investment, less flexible for pivots
- **Best for:** Projects with defined scope (like hackathons with clear judging criteria)

**2. Logging Saves Lives**
- Add logging at EVERY step of data flow
- Don't wait until something breaks
- Future you will thank present you

**3. Build for Real Users, Not Judges**
- Judges care about solving real problems
- A polished MVP beats a feature-bloated mess
- Focus on ONE killer feature (Ghost Mentor) over ten mediocre ones

---

## **What's Next for OnboardGhost**

### **Immediate Post-Hackathon (Week 1-2)**

**1. Security Hardening**
- TruffleHog integration for secret scanning (planned but not implemented)
- Rate limiting on API routes (currently unlimited)
- Input sanitization for GitHub URLs (basic validation only)

**2. Performance Optimization**
- Caching: Analysis results cached for 30 days (reduce API calls by 80%)
- Parallel processing: Run static analysis steps concurrently (2x faster)
- Lazy loading: Don't load all tasks at once (faster page loads)

**3. Mobile Responsiveness**
- Current design is desktop-first
- Tablet: Single-column layout with collapsible checklist
- Mobile: Bottom sheet for task details, full-screen chat

---

### **Short-Term (Month 1-3)**

**4. Multi-Language Support**
- Currently: Strong support for JS/TS, Python, Ruby
- Add: Go, Rust, PHP, Java, Kotlin (framework detection)
- Improve: C/C++, Swift (iOS/macOS projects)

**5. Team Features**
- **Manager Dashboard:** Track team onboarding progress
- **Shared Roadmaps:** One roadmap, multiple team members
- **Annotations:** Managers can add notes/tips to tasks
- **Analytics:** Which tasks take longest? Where do people get stuck?

**6. Custom Roadmaps**
- Let senior devs **edit** AI-generated roadmaps
- Add company-specific tasks ("Join Slack", "Read internal docs")
- Reorder tasks based on team workflow
- Save custom templates for similar projects

**7. GitHub Integration**
- **Create Issues:** Turn roadmap tasks into GitHub issues
- **PR Workflow:** "First contribution" task creates starter PR
- **Progress Sync:** Mark task complete when PR merges

---

### **Medium-Term (Month 4-6)**

**8. Video Walkthroughs**
- Loom/YouTube integration: Embed video guides in tasks
- Auto-generate: Screen recordings of common setup steps
- Community-contributed: Let users add helpful videos

**9. Interactive Terminal**
- **Web-based terminal:** Run commands directly in the browser
- **Safety checks:** Prevent destructive commands
- **Output validation:** Detect errors and suggest fixes
- **Perfect for:** Tutorial-style onboarding

**10. Peer Comparison (Anonymized)**
- "Most developers complete this task in 15 minutes"
- "80% of users found this task easy"
- Identify pain points: Tasks with low completion rates

**11. Voice Input**
- Ask Ghost Mentor questions via voice
- Hands-free while following terminal commands
- Accessibility win for screen reader users

---

### **Long-Term Vision (Month 6-12)**

**12. Repository "Health Score"**
- Analyze onboarding difficulty: A+ (easy) to F (nightmare)
- Metrics: Documentation quality, dependency freshness, setup complexity
- **For maintainers:** "Your onboarding is harder than 85% of similar projects"

**13. AI-Powered Pull Requests**
- Ghost Mentor suggests first contribution ideas
- Generates starter code for common tasks
- Explains what to change and why

**14. Multi-Repo Monorepo Support**
- Analyze entire organization: Frontend + Backend + Mobile
- Cross-repo dependencies: "Backend needs to run first"
- Shared setup tasks: "Database setup applies to all repos"

**15. Offline Mode**
- Download roadmap as PDF
- Export chat history
- Progressive Web App (PWA) for offline access

**16. Enterprise Features**
- **SSO Integration:** Okta, Auth0, Azure AD
- **Audit Logs:** Track who completed what, when
- **Custom Branding:** Company logo, colors, domain
- **SLA Guarantees:** Uptime commitments, support tiers

---

### **Monetization Strategy (If This Becomes Real)**

**Free Tier:**
- Unlimited public repositories
- Basic Ghost Mentor (10 questions/day)
- Community templates

**Pro Tier ($12/month):**
- Unlimited private repositories
- Unlimited Ghost Mentor
- Custom roadmap editing
- Video walkthroughs
- Priority support

**Team Tier ($25/user/month):**
- Everything in Pro
- Manager dashboard
- Team progress tracking
- Shared annotations
- Analytics

**Enterprise (Custom Pricing):**
- SSO, audit logs, SLAs
- On-premise deployment
- Dedicated support
- Custom integrations

---

### **Open Source Vision**

**Core Platform:** MIT licensed, open source
- Analysis pipeline
- Roadmap generation
- Ghost Mentor chat

**Premium Features:** Paid, proprietary
- Team collaboration
- Manager dashboard
- Enterprise integrations

**Why Hybrid Model:**
- Keep core free for individual developers and open source projects
- Fund development with enterprise customers
- Build community trust with open source transparency

---

## **Final Thoughts**

OnboardGhost started as "let's make onboarding suck less" and became a **technical showcase** of spec-driven development, AI integration, and production-grade architecture. I'm proud of what I built in 9 days.

**Would I build it again?** Yes. **Would I build it differently?** Absolutely I'd push Kiro harder, add TruffleHog, polish mobile, and create a more cinematic demo video.

**Is it good enough to win?** **Maybe.** It's a coin toss between "judges love practical solutions" and "judges want mind-blowing innovation."

But regardless of placement, I built something **real, useful, and technically sound**. That's a win in my book. 👻

---

**Thank you for reading this novel. Now go try OnboardGhost and tell your ghost I said hi.** 🚀👻