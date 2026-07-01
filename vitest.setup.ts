import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// We don't run Vitest with `globals: true`, so React Testing Library's
// automatic per-test cleanup (which keys off a global afterEach) never
// registers. Register it explicitly so each test starts with a clean DOM.
afterEach(() => {
  cleanup();
});
