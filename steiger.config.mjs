import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

const globalIgnores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  'apps',
]

const sharedModuleGlobs = ['packages/shared/src/**']
const designSystemGlobs = [
  'packages/design-system/src/**',
  'packages/design-system/lib/**',
  'packages/design-system/styles/**',
  'packages/design-system/ui/**',
]

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: globalIgnores,
  },
  {
    files: sharedModuleGlobs,
    rules: {
      'fsd/typo-in-layer-name': 'off',
      'fsd/no-reserved-folder-names': 'off',
    },
  },
  {
    files: designSystemGlobs,
    rules: {
      'fsd/typo-in-layer-name': 'off',
    },
  },
])
