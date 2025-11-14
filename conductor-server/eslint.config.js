// eslint.config.js (ESLint v9+ format)
import js from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],

    ...js.configs.recommended,

    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
];
