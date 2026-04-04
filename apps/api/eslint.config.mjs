import { baseConfig } from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
