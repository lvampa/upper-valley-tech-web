import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Reuse the app's vite config (path aliases @components/@lib/@data/@screens and
// the react plugin) so tests resolve imports exactly like the app does.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }),
);
