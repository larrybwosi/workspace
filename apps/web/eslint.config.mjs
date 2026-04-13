import { baseConfig } from "@repo/eslint-config/base";

export default [
  {
    ignores: ["dist/**", "build/**", "node_modules/**", ".next/**", ".turbo/**"],
  },
  ...baseConfig,
];
