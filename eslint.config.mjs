import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["drizzle/*", "node_modules/*"],
    languageOptions: {
      globals: {
        Bun: "readonly",
        console: "readonly",
        process: "readonly"
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: false
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
