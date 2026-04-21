import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/shared/src/migrations/*.test.ts'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
