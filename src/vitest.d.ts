// Load the jest-dom matcher augmentation (toBeInTheDocument, etc.) into the TS
// program. The runtime registration lives in vitest.setup.ts, but that file is
// outside `src` (the tsconfig include root), so the type augmentation must be
// referenced from inside `src` for the test files to typecheck.
import '@testing-library/jest-dom/vitest';
