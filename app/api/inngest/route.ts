import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { analyzeRepositoryFunction } from "@/lib/inngest/functions";

// Create an API that serves zero-downtime background functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeRepositoryFunction,
  ],
});
