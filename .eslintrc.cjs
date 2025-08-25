module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    'vitest-globals/env': true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'vitest-globals'
  ],
  rules: {
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Import rules
    'no-duplicate-imports': 'error',
    
    // Style rules (keep minimal for production)
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always']
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        'vitest-globals/env': true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['api/**/*.js'],
      env: {
        node: true
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.vercel/',
    'frontend/dist/',
    'frontend/build/',
    '*.min.js'
  ]
};