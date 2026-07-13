import { defineConfig } from 'vitest/config';

// Standalone from vite.config.ts on purpose: the SvelteKit plugin needs
// `svelte-kit sync` and $app aliases at load time, which unit tests of pure
// physics/math modules don't require. Tests import via relative paths.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
