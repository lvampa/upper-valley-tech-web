import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.ladle'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Discourage type assertions. Object-literal casts are banned unless
      // passed directly as a parameter / JSX prop (the one sanctioned escape
      // hatch, e.g. style={{...} as CSSProperties}). Redundant assertions are
      // additionally caught by no-unnecessary-type-assertion (strictTypeChecked).
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow-as-parameter',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  // Plain config files (eslint.config.js, vite.config.ts) aren't part of the
  // app's TS program — lint them without type-aware rules.
  {
    files: ['*.{js,ts}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Must be last: turns off ESLint rules that conflict with Prettier formatting.
  eslintConfigPrettier,
);
