import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      // Resolve workspace packages to their TypeScript source so tests run
      // against the source directly rather than the compiled dist.
      {
        find: /^(\.\.\/)?core$|^@sqltags\/core$/,
        replacement: path.resolve(import.meta.dirname, 'core/index.ts'),
      },
    ],
  },
  test: {
    globals: true,
  },
});
