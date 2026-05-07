// https://docs.expo.dev/guides/using-eslint/

const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

const simpleImportSort = require('eslint-plugin-simple-import-sort')
const unusedImports = require('eslint-plugin-unused-imports')

module.exports = defineConfig([
  expoConfig,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },

    rules: {
      /**
       * Warn on console.log
       */
      'no-console': [
        'warn',
        {
          allow: ['info', 'warn', 'error'],
        },
      ],

      /**
       * Auto-sort imports
       */
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'unused-imports/no-unused-imports': 'warn',
    },
  },

  {
    ignores: ['dist/*'],
  },
])
