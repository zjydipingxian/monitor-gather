import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
    overrides: {
      'n/prefer-global/process': 'off',
    },
  },
  ignores: [
    '*.sh',
    'node_modules',
    '*.md',
    '*.woff',
    '*.ttf',
    '.idea',
    '/public',
    '/docs',
    '.husky',
    '.local',
    '/bin',
    'Dockerfile',
    'scripts/*.mjs',
  ],
})
