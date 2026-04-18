import { Inngest } from "inngest";

// Define the event schema for better type safety
type Events = {
  "repo/analyze": {
    data: {
      repoUrl: string;
      userId: string;
      githubToken: string | null;
      saveProgress: boolean;
      repoId: string;
    }
  }
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "onboardghost-app",
  // In development, the dev server handles keys. In production, we need the event key to send events.
  eventKey: process.env.INNGEST_EVENT_KEY,
  // Signing key is only required in production for verifying requests from Inngest.
  // We disable it in development to allow the local dev server to sync functions without signatures.
  signingKey: process.env.NODE_ENV === 'production' ? process.env.INNGEST_SIGNING_KEY : undefined,
  schemas: {
    events: {} as { [K in keyof Events]: Events[K] }
  }
});
