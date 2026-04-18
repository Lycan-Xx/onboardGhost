import { Index } from "@upstash/vector";

// Initialize Upstash Vector index
// Requires UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in your environment.
export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL as string,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
});
