// @ts-check
import antfu from '@antfu/eslint-config'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'

export default antfu(
  {
    typescript: true,
    react: true,
    isInEditor: false,
    // ESLint handles all formatting — no Prettier
    stylistic: {
      indent: 2,
      semi: false,
      quotes: 'single',
    },
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      'README.md',
      'docs/**',
      '**/*.md',
    ],
  },

  /**
   * File & folder naming conventions
   * All src files must be kebab-case
   * Dots are allowed so multi-segment names like auth-session.ts are valid
   */
  {
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/**/*.{ts,tsx}': 'KEBAB_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/': 'KEBAB_CASE',
        },
      ],
    },
  },

  /**
   * Expo Router route files
   * Route files follow expo-router conventions (_layout.tsx, index.tsx, etc.)
   * and live inside route group folders like (auth)/, (app)/ — exempt from kebab rule
   */
  {
    files: ['src/app/**/*.tsx', 'src/app/**/*.ts'],
    rules: {
      'check-file/filename-naming-convention': 'off',
      'check-file/folder-naming-convention': 'off',
    },
  },

  // Strictness rules
  {
    plugins: {
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
    },
    rules: {
      // React hooks exhaustive deps
      'react-hooks/exhaustive-deps': 'warn',
      // No any
      '@typescript-eslint/no-explicit-any': 'error',

      'perfectionist/sort-imports': [
        'warn',
        {
          type: 'natural',
          order: 'asc',

          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'side-effect',
            'type',
          ],

          newlinesBetween: 1,

          internalPattern: ['^@/'],
        },
      ],

      'perfectionist/sort-named-imports': [
        'warn',
        {
          type: 'natural',
          order: 'asc',
        },
      ],

      // Auto-remove unused imports and warn on unused vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // Cyclomatic complexity — keep functions simple
      'complexity': ['error', 10],
      // Max lines per file (excluding blanks and comments)
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      // Max lines per function
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      // Max parameters — prefer option objects
      'max-params': ['error', 4],
      // Warn on console
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prefer const
      'prefer-const': 'error',
      // Expo Router file-based exports don't require display names
      'react/display-name': 'off',
      // Allow process global in React Native (no Node.js module system)
      'node/prefer-global/process': 'off',
      // React 19 style suggestions — off for now
      'react/no-context-provider': 'off',
      'react/no-use-context': 'off',
      // Setting state in effects is intentional for one-time restores
      'react/set-state-in-effect': 'warn',
    },
  },

  // Context & hook files export both components and hooks
  // react-refresh/only-export-components would be a false positive here
  {
    files: ['src/context/**/*.tsx', 'src/theme/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Expo Router _layout.tsx files use Sentry.wrap(Component) as the default export
  // which is an HOC the react-refresh rule cannot statically detect as a component.
  // They also contain unexported helper components (RootNavigator, etc.) which are
  // internal to the layout composition — disabling is intentional and correct here.
  {
    files: ['**/_layout.tsx', '**/layout.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ─── Screen files: higher complexity limit allowed ────────────────────
  // JSX conditional rendering (ternaries, &&) counts toward cyclomatic complexity.
  // Screens inherently render more conditionally than pure logic files.
  {
    files: ['src/app/**/*.tsx'],
    rules: {
      'complexity': ['error', 15],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },

  // Expo Router _layout.tsx files use Sentry.wrap(Component) as the default export.
  // This block MUST come after the src/app/**/*.tsx block to take final precedence.
  {
    files: ['**/_layout.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
