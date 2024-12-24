import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import tailwind from 'eslint-plugin-tailwindcss'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tailwind.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettierConfig,
  {
    // Note: there should be no other properties in this object
    ignores: [
      'dist',
      'src-tauri',
      'eslint.config.mjs',
      'postcss.config.js',
      'tailwind.config.js',
      'vite.config.ts',
    ],
  },
)
