import babelParser from '@babel/eslint-parser'

export default [{
  ignores: ['**/*.backup', '**/*.bak*', '**/*.tsbuildinfo'],
}, {
  files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
  languageOptions: {
    parser: babelParser,
    parserOptions: {
      requireConfigFile: false,
      babelOptions: { plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] },
    },
  },
  // Comprobaciones de errores, no una reforma de estilo/arquitectura.
  // TypeScript verifica nombres/tipos; no-undef/no-unused no duplican su análisis.
  rules: {
    'no-debugger': 'error', 'no-eval': 'error', 'no-implied-eval': 'error',
    'no-async-promise-executor': 'error', 'no-unreachable': 'error',
    'no-unsafe-finally': 'error', 'no-constant-binary-expression': 'error',
    'constructor-super': 'error', 'valid-typeof': 'error',
  },
}]
