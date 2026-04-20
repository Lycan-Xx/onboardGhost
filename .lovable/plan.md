

# Onboard Ghost — UX/UI Overhaul

A focused redesign and bug-fix pass across the landing page, dashboard, loading flow, tasks page, and Ghost Mentor chat. The new direction takes cues from the two reference images: **minimal, editorial, lots of whitespace, a single accent color, square/soft corners, and a clear single CTA per screen** — applied consistently across light surfaces (marketing) and the existing dark app surfaces.

## Issues found in current build

1. **Landing page** — clicking "Get Started Free" jumps straight into `/dashboard` with no auth gate, so users feel teleported. Logos use Material Icons font (`material-icons-outlined`) which fails to load intermittently → missing ghost icons.
2. **GitHub sign-in button** — no loading state; on success it just reloads the dashboard instead of morphing into the avatar+name pill.
3. **Google sign-in** — currently there is no Google sign-in. The "automatic login" you see is the **anonymous Firebase sign-in** that fires in `useEffect` on the dashboard. That's the bug.
4. **Repo dropdown** — fetches up to 100 repos sorted by `updated`, but the dropdown filters by search text and only shows results if you type. It should show the **top 15 most-recent repos by default** when focused.
5. **Repo name missing** — `loading/page.tsx` parses `repoId.split('_')` but the dashboard creates repoIds with `-` (`owner-repo`), so the name never resolves. Same root cause makes "Recent Analyses" cards rely on `repository_name` from Firestore which is sometimes empty.
6. **Ghost Mentor chat** — fixed-bottom footer overlaps content, markdown renders without proper prose styling on code blocks, no auto-resize textarea, no message timestamps, file references aren't actually clickable, and on mobile it covers the whole screen awkwardly.
7. **Memory mismatch** — the `mem://` index describes a "Triage" Supabase/Vite app. This project is Next.js + Firebase. Memory will be rewritten to match reality.

## Design direction (inspired by your references)

- **Two surfaces, one system**
  - *Marketing* (`/`): near-white `#FAFAFA` bg, serif display headline (e.g. Fraunces), generous whitespace, single black pill CTA — YOURHOME feel.
  - *App* (`/dashboard`, `/tasks`, `/loading`): keep dark `#0a0a0f` but lift to a **grid-lined dark canvas** with a subtle warm radial glow at the bottom — Wezzi feel.
- **One accent**: replace the loud pink with a refined accent (`#F2545B` warm coral) used sparingly — only on the primary CTA, progress bar, and active states.
- **Typography**: Inter for UI, Fraunces (serif) only for marketing H1/H2. Tighten hierarchy: 1 display size, 1 body size, 1 caption.
- **Components**: square-ish 8px radius on cards, 999px (pill) on CTAs, 1px hairline borders `rgba(255,255,255,0.06)`.
- **Iconography**: replace Material Icons font dependency with **lucide-react** (already common, no font fetch → fixes the missing-icon bug).
- **Motion**: 150ms ease for hovers, 250ms for state transitions, no bouncing dots — use a subtle shimmer.
- **Responsive**: mobile-first. Header collapses to logo + single icon button. Dashboard stack becomes a single column under `md`. Tasks page side-rail becomes a top sheet on mobile.

## Changes by screen

### 1. Landing (`app/page.tsx`)
- Light editorial layout: small wordmark top-left, minimal nav (`Product`, `How it works`, `Sign in`), single black pill `Get started →` top-right.
- Hero: serif display headline "Onboard any codebase in days, not weeks", short subline, **search-style hero input** ("Paste a GitHub repo URL…") with inline `Analyze` button — same pattern as YOURHOME's filter bar.
- Replace floating ghost emoji with a **subtle architectural line illustration** (SVG) at the bottom of the hero, fading into the page.
- Trim "How it works" to 3 minimal numbered steps (no icon chips).
- Footer: single line, left wordmark, right links.
- Clicking `Get started` routes to `/dashboard` only **after** a sign-in choice (modal with GitHub + Google).

### 2. Auth flow
- **Remove the auto anonymous sign-in** on dashboard mount. Instead, unauthenticated visitors see a centered sign-in card with two buttons: `Continue with GitHub` and `Continue with Google`.
- **GitHub button states**: idle → `loading` (spinner + "Redirecting to GitHub…") → on return, morph into the avatar pill (`<img> + name + chevron`) that links to `/profile`.
- **Google sign-in**: add via Firebase `GoogleAuthProvider` with `signInWithPopup` and `prompt: 'select_account'` so the consent / account-picker screen always shows (fixes the "auto login" complaint).
- Anonymous mode kept only as an internal fallback for "try a public demo repo without signing in" — explicit button labeled `Try a demo repo` (no implicit anonymous auth).

### 3. Dashboard (`app/dashboard/page.tsx`)
- Header: wordmark left, profile pill right (with loading state).
- Hero block: "Welcome back, {name}" + one-line helper.
- **Unified repo input**: single combobox that, when focused, immediately shows **top 15 most-recently-updated repos** (sorted by `updated_at`); typing filters. The "OR paste URL" pattern is removed — the same field accepts both a selection or a pasted URL (detect `https://github.com/...`).
- Demo chips moved under the input as small ghost-buttons.
- **Recent Analyses**: card grid with proper repo name (fix `repoId` parsing, fall back to `repository_name`, then to a humanized version of the id). Cards show: name, language dot, progress ring (replacing flat bar), last activity ("2h ago"), Continue → / Delete.
- Empty state is a single illustrated line + CTA.

### 4. Loading (`app/loading/page.tsx`)
- Fix repo-name parsing: `repoId` uses `-`, split on first `-` → `owner/repo`. Display the repo name + GitHub-style avatar prominently at the top.
- Replace 5-step bullet list with a vertical timeline showing current step, with a single shimmering line connecting completed/current/pending nodes.
- Add an estimated time and a "this usually takes ~30s" reassurance line.

### 5. Tasks (`app/tasks/page.tsx`)
- Sticky header that always shows the **repo name + owner avatar** (currently missing). Progress meter inline.
- Left rail: task list. Main: active task. Right rail (desktop only): references / tips.
- On mobile: task list collapses into a top sheet, references move under the main content.

### 6. Ghost Mentor chat (`components/GhostMentorChat.tsx`)
- Move from full-width footer to a **right-anchored panel** (max-width 420px desktop, full-screen sheet on mobile) so it never blocks task content.
- Replace bouncing dots with a single shimmer line.
- Use a proper `<textarea>` that auto-grows up to 6 lines; Enter sends, Shift+Enter newline.
- Rich markdown: inline `code`, fenced ```code``` blocks with syntax highlight (`react-syntax-highlighter`), tables, lists — wrapped in a `prose-invert` container with consistent spacing.
- File references become real chips that scroll the corresponding task panel into view (or open the file on GitHub in a new tab as a fallback).
- First-message suggestion chips: "What does this repo do?", "Where do I start?", "Explain the build setup".
- Message timestamps on hover, copy-message button on assistant replies.
- Persist `chatOpen` in `localStorage` so it remembers across navigations.

### 7. Cross-cutting
- Replace all `material-symbols-outlined` / `material-icons-outlined` usage with **lucide-react** icons (kills the "missing logos" bug from font-load failures).
- Centralize tokens in `app/globals.css` (CSS custom props for color, radius, shadow). Tailwind config maps `bg-surface`, `text-muted`, `accent`, etc.
- Add a global `<Toast>` for errors instead of inline red boxes everywhere.
- Refresh memory: rewrite `mem://index.md` and add `mem://project/stack` to reflect Next.js + Firebase + GitHub OAuth + Gemini reality.

## Technical notes (for implementation)

- **Deps to add**: `lucide-react`, `react-syntax-highlighter`, `@types/react-syntax-highlighter`, `clsx`, `date-fns` (for "2h ago"). Optional: `@fontsource-variable/inter`, `@fontsource/fraunces`.
- **Google auth**: Firebase Web SDK `GoogleAuthProvider` + `signInWithPopup(auth, provider)` with `provider.setCustomParameters({ prompt: 'select_account' })`. No Supabase changes — this project does not use Supabase despite the misleading memory file.
- **Repo dropdown**: keep existing `/api/github/repos` endpoint (already returns sorted-by-updated). Slice client-side to 15 by default; show all when user types.
- **RepoId parsing fix**: `repoId.replace(/^([^-]+)-(.+)$/, '$1/$2')` for display; store `repository_name` explicitly when saving analyses.
- **Chat panel**: refactor `GhostMentorChat` into `<ChatPanel>` + `<ChatMessage>` + `<ChatInput>`; wrap markdown in a `MessageContent` component with the `react-markdown` `components` prop overriding `code`, `pre`, `a`, `table`.
- **Icons swap**: codemod-ish — find `<span className="material-symbols-outlined">name</span>` and replace with the matching lucide component (`Lock`, `Trash2`, `FolderOpen`, `Brain`, `Send`, `X`, `Search`, etc.).

## Open questions

I'll need a quick decision on two things before building:

```text
1. Color palette
   a) Keep dark accent (warm coral #F2545B)        — current vibe, refreshed
   b) Go fully editorial light + dark app shell    — closer to YOURHOME ref
   c) Pure mono (black/white) + one accent         — closer to Wezzi ref

2. Typography
   a) Inter only (clean, modern, single family)
   b) Inter + Fraunces serif (editorial, like YOURHOME)
```

I'll ask these as multiple-choice when you approve the plan, then implement everything above in one pass.

