import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // O plugin jsx-a11y já é registrado pelo eslint-config-next, mas só com 6 regras.
    // Aqui ativamos o conjunto recomendado completo (acessibilidade é requisito do projeto).
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
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
