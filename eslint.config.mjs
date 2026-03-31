import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [".next/*", "node_modules/*", "dist/*"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-unused-vars": "off",
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "no-useless-escape": "warn",
      "no-constant-binary-expression": "warn",
      "no-undef": "off",
      "no-useless-assignment": "warn"
    }
  }
);
