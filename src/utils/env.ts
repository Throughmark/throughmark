import { resolve } from "path";

import { config } from "dotenv";

// Load environment variables following standard precedence:
// 1. .env.local (local overrides)
// 2. .env.development, .env.test, or .env.production (environment-specific)
// 3. .env (default)
const envPath = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";

// Load in order of precedence
config({ path: resolve(process.cwd(), ".env.local"), override: true });
config({ path: resolve(process.cwd(), envPath), override: true });
config({ path: resolve(process.cwd(), ".env"), override: true });

// Export environment variables with type safety
export const env = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
} as const;
