// @ts-check
'use strict'

const nextPlugin = require('eslint-config-next')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextPlugin,
  // Block 1: Module boundary — deep imports forbidden, must import from index.ts
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/modules/*/!(index)*'],
          message: 'Import from module index.ts only (CLAUDE.md module communication rules)',
        }],
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  // Block 2: Service-role gating — @/shared/db/admin restricted to allowed modules only
  // Allowed: src/modules/{settings,portal,auth}/**, src/shared/audit/**, supabase/functions/**
  // Forbidden: src/modules/scanning/** and all other modules
  {
    files: [
      'src/modules/!(settings|portal|auth)/**',
      'src/shared/!(audit|auth-helpers|db)/**',
      'src/app/**',
      'src/proxy.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: '@/shared/db/admin',
          message: 'service-role import not allowed in this module (CLAUDE.md service-role gating)',
        }],
      }],
    },
  },
]

module.exports = config
