import { defineConfig } from 'vitest/config';

// Unit tests only -- pure functions with no DB/network dependency, so they
// run in CI without needing a live Postgres instance. Integration-style
// route tests would need a real test database and are out of scope here.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts']
  }
});
