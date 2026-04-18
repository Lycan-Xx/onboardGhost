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
  schemas: {
    events: {} as { [K in keyof Events]: Events[K] }
  }
});
