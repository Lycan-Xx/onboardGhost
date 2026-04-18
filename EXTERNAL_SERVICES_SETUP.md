# External Services Setup Guide

To enable background processing and RAG-powered chat in **OnboardGhost**, you need to configure **Inngest** and **Upstash Vector**. Both offer generous free tiers that are perfect for this project.

## 1. Upstash Vector (RAG Database)

Upstash Vector stores the code embeddings used by the Ghost Mentor to answer technical questions.

### Setup Steps:
1.  **Create Account:** Go to [console.upstash.com](https://console.upstash.com) and sign up.
2.  **Create Index:**
    *   Navigate to the **Vector** tab.
    *   Click **Create Index**.
    *   **Name:** `onboard-ghost-index`
    *   **Region:** Choose the region closest to your Vercel deployment (e.g., `us-east-1`).
    *   **Dimensions:** `768` (crucial: Gemini `text-embedding-004` outputs 768-dimensional vectors).
    *   **Distance Metric:** `Cosine`.
3.  **Get Credentials:**
    *   Once created, scroll down to the **Connect** section.
    *   Copy the **UPSTASH_VECTOR_REST_URL**.
    *   Copy the **UPSTASH_VECTOR_REST_TOKEN**.

---

## 2. Inngest (Background Jobs)

Inngest orchestrates the repository analysis offline so it doesn't time out on Vercel.

### Local Development:
You don't need an account for local testing!
1.  In your terminal, run:
    ```bash
    npx inngest-cli@latest dev
    ```
2.  Open the Inngest Dev Server at [http://localhost:8288](http://localhost:8288).
3.  It will automatically detect your local `/api/inngest` route.

### Production Setup:
1.  **Create Account:** Sign up at [inngest.com](https://www.inngest.com/).
2.  **Create App:** Link your GitHub/Vercel or create a manual app.
3.  **Signing Key:**
    *   Go to **Settings** > **Keys**.
    *   Copy the **Signing Key**.
4.  **Event Key:**
    *   Go to **Events** > **Keys**.
    *   Create a new **Event Key**.
5.  **Configure Endpoint:**
    *   In the Inngest dashboard, point your app to `https://your-domain.com/api/inngest`.

---

## 3. Environment Variables

Add these to your `.env` (local) and **Vercel Project Settings** (production):

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `UPSTASH_VECTOR_REST_URL` | Upstash Console | Endpoint for vector queries |
| `UPSTASH_VECTOR_REST_TOKEN` | Upstash Console | Auth for vector queries |
| `INNGEST_EVENT_KEY` | Inngest Dashboard | Required to send events |
| `INNGEST_SIGNING_KEY` | Inngest Dashboard | Required to verify webhooks |

---

### Critical Notes
- **Dimension Mismatch:** If you create the Upstash index with dimensions other than **768**, the RAG system will fail when attempting to upsert Gemini embeddings.
- **Inngest Dev Server:** Always keep the dev server running locally if you want to test the analysis flow, otherwise the events will be sent but never processed.
