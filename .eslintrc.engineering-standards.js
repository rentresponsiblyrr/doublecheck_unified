/**
 * ENGINEERING STANDARDS ESLINT CONFIGURATION
 * 
 * Prevents the systemic issues that caused production failures.
 * This configuration enforces Netflix/Meta level code quality standards.
 */

module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  rules: {
    // CRITICAL: Prevent database schema violations
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='from'][arguments.0.value='logs']",
        message: "❌ CRITICAL: Legacy 'logs' table reference - use 'checklist_items' instead"
      },
      {
        selector: "Property[key.name='property_name']",
        message: "❌ CRITICAL: Legacy 'property_name' field - use 'name' instead"
      },
      {
        selector: "Property[key.name='street_address']",
        message: "❌ CRITICAL: Legacy 'street_address' field - use 'address' instead"
      }
    ],

    // CRITICAL: Prevent any type violations
    '@typescript-eslint/no-explicit-any': ['error', {
      'ignoreRestArgs': false,
      'fixToUnknown': true
    }],
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // HIGH PRIORITY: Type safety enforcement
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      'allowExpressions': true,
      'allowTypedFunctionExpressions': true
    }],
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],

    // MEDIUM PRIORITY: Naming conventions
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'custom': {
          'regex': '^I[A-Z]',
          'match': false
        }
      },
      {
        'selector': 'typeAlias',
        'format': ['PascalCase']
      },
      {
        'selector': 'function',
        'format': ['camelCase', 'PascalCase']
      },
      {
        'selector': 'variable',
        'format': ['camelCase', 'PascalCase', 'UPPER_CASE'],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'property',
        'format': ['camelCase', 'PascalCase', 'snake_case'],
        'leadingUnderscore': 'allow'
      }
    ],

    // CONSISTENCY: Event handler naming
    'react/jsx-handler-names': ['warn', {
      'eventHandlerPrefix': 'handle',
      'eventHandlerPropPrefix': 'on',
      'checkLocalVariables': true,
      'checkInlineFunction': true
    }],

    // PERFORMANCE: React best practices
    'react-hooks/exhaustive-deps': 'error',
    'react/no-array-index-key': 'warn',
    'react/jsx-no-leaked-render': 'error',

    // SECURITY: Prevent dangerous patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },

  overrides: [
    {
      // Stricter rules for critical directories
      files: [
        'src/hooks/**/*.ts',
        'src/services/**/*.ts', 
        'src/components/inspector/active/**/*.tsx'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error'
      }
    },
    {
      // Allow any in test files (with warning)
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ],

  settings: {
    react: {
      version: 'detect'
    }
  }
};