# OnboardGhost 👻

Interactive git repository analyzer and onboarding tool for new developers joining a codebase.

## Features

- 🎯 Dashboard with repository selection
- 📊 Repository analysis and progress tracking
- ✅ Interactive task-based onboarding
- 💬 Ghost Chat assistant for codebase questions
- 👤 User profile management

## Getting Started

```bash
cd onboard-ghost
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Navigation Flow

```
Dashboard → Loading/Analysis → Tasks → Chat Overlay
    ↓
  Profile
```

## Design System

- **Primary Color**: Neon Pink (#ff00a0)
- **Background**: Very dark (#0d0d0d)
- **Surface**: Dark gray (#1a1a1a)
- **Font**: Roboto Mono
- **Icons**: Material Icons Outlined

## Pages

- `/` - Dashboard with repo selection
- `/loading` - Analysis loading screen
- `/tasks` - Task-based onboarding
- `/profile` - User profile

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Material Icons
