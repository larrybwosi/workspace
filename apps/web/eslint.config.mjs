import { baseConfig } from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
];
