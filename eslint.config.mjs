import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const ignoredPaths = [
  "**/dist/**",
  "**/node_modules/**",
  "archives/**",
  "coverage/**",
  ".husky/**",
  "mobile/**",
];

export default tseslint.config(
  {
    ignores: ignoredPaths,
  },
  {
    files: ["scripts/**/*.js", "*.js", "*.cjs", "*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
);
