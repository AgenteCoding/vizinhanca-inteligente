import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Regra do projeto: nada de `any`. Use tipos explícitos ou `unknown`.
      "@typescript-eslint/no-explicit-any": "error",
      // Impede inserir HTML bruto (risco de XSS com texto digitado pelo visitante).
      "react/no-danger": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
