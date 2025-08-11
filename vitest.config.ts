import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      provider: 'v8',
      thresholds: {
        100: false,
        functions: 75,
        branches: 85,
        lines: 90,
        statements: 90,
      },
      exclude: [
        'src/ui/prompt.ts',
        'src/types.ts',
        'dist/**/*',
        'examples/**/*',
        'vitest.config.ts',
      ],
    },
  },
});


