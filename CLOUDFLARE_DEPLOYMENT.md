# Cloudflare Pages Deployment Guide

## ⚠️ Important: Your App Cannot Use Static Export

Your app has:
- API routes (`/api/*`) that need server execution
- Firebase Admin SDK (server-side)
- Dynamic authentication
- Database operations

**Static export (`output: "export"`) doesn't support these features.**

---

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is made by the Next.js team and has zero-config deployment:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Add environment variables from `.env.local`
6. Click "Deploy"

**Done!** Vercel handles everything automatically.

---

## Option 2: Deploy to Cloudflare Pages with Next.js Runtime

Cloudflare Pages can run Next.js with SSR, but requires setup:

### Step 1: Install Cloudflare Adapter

```bash
npm install --save-dev @cloudflare/next-on-pages
```

### Step 2: Update `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  reactCompiler: true
};

export default nextConfig;
```

### Step 3: Update `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages",
    "preview": "npm run pages:build && wrangler pages dev",
    "deploy": "npm run pages:build && wrangler pages deploy"
  }
}
```

### Step 4: Update `wrangler.jsonc`

```jsonc
{
  "name": "onboard-ghost",
  "compatibility_date": "2024-12-05",
  "pages_build_output_dir": ".vercel/output/static"
}
```

### Step 5: Deploy

```bash
npm run deploy
```

### Limitations on Cloudflare:
- Firebase Admin SDK may not work (Node.js APIs)
- Some Next.js features limited
- More complex setup
- Requires Cloudflare Workers paid plan for API routes

---

## Option 3: Deploy to Railway/Render (Node.js Hosting)

These platforms support full Node.js apps:

### Railway:
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add environment variables
4. Deploy

### Render:
1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add environment variables

---

## Recommendation

**Use Vercel** - it's the easiest and most compatible with your stack:
- ✅ Full Next.js support
- ✅ API routes work perfectly
- ✅ Firebase Admin SDK works
- ✅ Zero configuration
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ GitHub integration

---

## Why Static Export Doesn't Work

```
Static Export (output: "export"):
- Generates HTML files at build time
- No server-side code execution
- No API routes
- No dynamic data fetching
- ❌ Cannot use Firebase Admin SDK
- ❌ Cannot use authentication
- ❌ Cannot use database operations

Your App Needs:
- ✅ Server-side API routes
- ✅ Firebase Admin SDK
- ✅ Dynamic authentication
- ✅ Real-time data fetching
- ✅ GitHub OAuth callbacks
```

---

## Current Status

I've reverted your config to support SSR:
- ✅ Removed `output: "export"` from `next.config.ts`
- ✅ Removed `next export` from build script
- ✅ Updated `wrangler.jsonc`

**Next steps:**
1. Choose a deployment platform (Vercel recommended)
2. Follow the guide above
3. Add environment variables
4. Deploy!
