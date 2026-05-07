import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('.env', import.meta.url).pathname });

export default defineConfig({
  test: {
    testTimeout: 30_000,
  },
});
